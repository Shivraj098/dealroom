import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

const testMongoUri = process.env.TEST_MONGODB_URI

test('critical DealRoom API workflows (requires an isolated MongoDB test database)', { skip: !testMongoUri }, async () => {
  if (!testMongoUri) return

  const databaseName = new URL(testMongoUri).pathname.replace(/^\//, '').split('/')[0].split('?')[0]
  assert.match(databaseName.toLowerCase(), /test/, 'TEST_MONGODB_URI must point to a database whose name includes "test"')

  // Set test-only configuration before importing modules that validate environment variables.
  process.env.MONGODB_URI = testMongoUri
  process.env.NODE_ENV = 'test'
  process.env.CLIENT_ORIGIN = 'http://localhost:5173'
  process.env.JWT_SECRET = 'dealroom-test-jwt-secret-not-for-production-2026'
  process.env.CSRF_SECRET = 'dealroom-test-csrf-secret-not-for-production-2026'

  const mongooseModule = await import('mongoose')
  const mongoose = mongooseModule.default
  const { default: app } = await import('../../src/app')
  const { attachChatGateway } = await import('../../src/realtime/chatGateway')
  const { User } = await import('../../src/models/User')
  const { StartupProfile } = await import('../../src/models/StartupProfile')
  const { InvestorProfile } = await import('../../src/models/InvestorProfile')
  const { ConnectionRequest } = await import('../../src/models/ConnectionRequest')
  const { DealRoom } = await import('../../src/models/DealRoom')
  const { ChatMessage } = await import('../../src/models/ChatMessage')
  const { DealRoomEvaluation } = await import('../../src/models/DealRoomEvaluation')
  const { PrivateNote } = await import('../../src/models/PrivateNote')
  const { InformationRequest } = await import('../../src/models/InformationRequest')
  const { SavedStartup } = await import('../../src/models/SavedStartup')
  const { Notification } = await import('../../src/models/Notification')
  const { ActivityEvent } = await import('../../src/models/ActivityEvent')
  const wsModule = await import('ws')
  const WebSocketClient = wsModule.WebSocket ?? wsModule.default

  const stamp = `${Date.now()}-${randomUUID().slice(0, 8)}`
  const password = 'DealRoom-test-password-2026!'
  const founderEmail = `founder-${stamp}@example.test`
  const investorEmail = `investor-${stamp}@example.test`
  const outsiderEmail = `outsider-${stamp}@example.test`
  const adminEmail = `admin-${stamp}@example.test`
  const startupName = `DealRoom Test Startup ${stamp}`
  const createdUserIds: string[] = []
  const createdRoomIds: string[] = []
  const createdStartupIds: string[] = []
  let server: ReturnType<typeof app.listen> | undefined
  let closeGateway: (() => Promise<void>) | undefined
  let participantSocket: InstanceType<typeof WebSocketClient> | undefined
  let outsiderSocket: InstanceType<typeof WebSocketClient> | undefined

  class ApiClient {
    private readonly cookies = new Map<string, string>()

    cookieHeader(): string {
      return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
    }

    setCookie(name: string, value: string): void {
      this.cookies.set(name, value)
    }

    async request(path: string, options: { method?: string; body?: unknown; csrf?: boolean } = {}) {
      const method = options.method ?? 'GET'
      const headers = new Headers({ Origin: 'http://localhost:5173' })
      if (options.body !== undefined) headers.set('Content-Type', 'application/json')
      const cookieHeader = this.cookieHeader()
      if (cookieHeader) headers.set('Cookie', cookieHeader)
      const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
      const csrfToken = this.cookies.get('csrf-token')
      if (!safeMethod && options.csrf !== false && csrfToken) headers.set('X-CSRF-Token', csrfToken)

      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })

      for (const cookie of response.headers.getSetCookie()) {
        const firstPart = cookie.split(';', 1)[0]
        const equalsAt = firstPart.indexOf('=')
        if (equalsAt < 1) continue
        const name = firstPart.slice(0, equalsAt)
        const value = firstPart.slice(equalsAt + 1)
        if (!value || /max-age=0/i.test(cookie) || /expires=thu, 01 jan 1970/i.test(cookie)) this.cookies.delete(name)
        else this.cookies.set(name, value)
      }

      const raw = await response.text()
      let json: any = undefined
      try { json = raw ? JSON.parse(raw) : undefined } catch { json = raw }
      return { status: response.status, json, headers: response.headers }
    }

    async initCsrf(): Promise<void> {
      const response = await this.request('/api/auth/csrf')
      assert.equal(response.status, 200)
      assert.ok(this.cookies.get('csrf-token'))
    }

    async register(email: string, role: 'founder' | 'investor' | 'admin', name: string) {
      await this.initCsrf()
      const response = await this.request('/api/auth/register', {
        method: 'POST',
        body: { name, email, password, role },
      })
      assert.equal(response.status, 201, JSON.stringify(response.json))
      const user = response.json.data.user as { id: string; email: string; role: string }
      assert.ok(user.id)
      assert.equal('password' in user, false)
      createdUserIds.push(user.id)
      return user
    }

    async login(email: string, loginPassword = password) {
      await this.initCsrf()
      return this.request('/api/auth/login', {
        method: 'POST',
        body: { email, password: loginPassword },
      })
    }
  }

  let baseUrl = ''
  const founderClient = new ApiClient()
  const investorClient = new ApiClient()
  const outsiderClient = new ApiClient()
  const adminClient = new ApiClient()
  const logoutClient = new ApiClient()
  const loginClient = new ApiClient()
  const invalidRoleClient = new ApiClient()

  await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 12_000 })

  try {
    const allModels = [User, StartupProfile, InvestorProfile, ConnectionRequest, DealRoom, ChatMessage, DealRoomEvaluation, PrivateNote, InformationRequest, SavedStartup, Notification, ActivityEvent]
    await Promise.all(allModels.map(model => model.init()))

    server = app.listen(0)
    await new Promise<void>((resolve, reject) => {
      server!.once('listening', resolve)
      server!.once('error', reject)
    })
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    baseUrl = `http://127.0.0.1:${address.port}`
    closeGateway = attachChatGateway(server)

    // Infrastructure and session/CSRF behavior.
    assert.equal((await founderClient.request('/health')).status, 200)
    assert.equal((await founderClient.request('/api/auth/me')).status, 401)
    assert.equal((await founderClient.request('/api/profiles/me')).status, 401)
    await logoutClient.initCsrf()
    logoutClient.setCookie('token', 'expired.invalid.token')
    assert.equal((await logoutClient.request('/api/auth/logout', { method: 'POST', csrf: false })).status, 403)
    assert.equal((await logoutClient.request('/api/auth/logout', { method: 'POST' })).status, 200)
    assert.equal((await logoutClient.request('/api/auth/me')).status, 401)

    // Registration, login behavior, safe DTOs, role-specific profiles and discovery.
    await invalidRoleClient.initCsrf()
    const publicAdminRegistration = await invalidRoleClient.request('/api/auth/register', {
      method: 'POST', body: { name: 'Public Admin', email: `public-admin-${stamp}@example.test`, password, role: 'admin' },
    })
    assert.equal(publicAdminRegistration.status, 400, 'public registration must not create administrator accounts')

    const founder = await founderClient.register(founderEmail, 'founder', 'Test Founder')
    const investor = await investorClient.register(investorEmail, 'investor', 'Test Investor')
    const outsider = await outsiderClient.register(outsiderEmail, 'founder', 'Test Outsider')

    const duplicateClient = new ApiClient()
    await duplicateClient.initCsrf()
    const duplicateRegistration = await duplicateClient.request('/api/auth/register', {
      method: 'POST', body: { name: 'Duplicate Founder', email: founderEmail.toUpperCase(), password, role: 'founder' },
    })
    assert.equal(duplicateRegistration.status, 409, 'duplicate normalized emails must be rejected')
    assert.equal((await loginClient.login(founderEmail, 'incorrect-password')).status, 401)
    const validLogin = await loginClient.login(founderEmail)
    assert.equal(validLogin.status, 200, JSON.stringify(validLogin.json))
    assert.equal(validLogin.json.data.user.id, founder.id)
    assert.equal('password' in validLogin.json.data.user, false)
    assert.equal((await loginClient.request('/api/auth/me')).status, 200)

    const startupSave = await founderClient.request('/api/profiles/startup', {
      method: 'PUT',
      body: {
        companyName: startupName,
        tagline: 'Operational tools for small teams',
        description: 'A fictional company created by the DealRoom integration test.',
        industry: 'Software',
        stage: 'seed',
        problem: 'Teams lose time switching tools.',
        solution: 'A unified workflow.',
        targetMarket: 'Small businesses',
        status: 'published',
      },
    })
    assert.equal(startupSave.status, 200, JSON.stringify(startupSave.json))
    const startupId = startupSave.json.data.profile.id as string
    createdStartupIds.push(startupId)

    const investorProfileSave = await investorClient.request('/api/profiles/investor', {
      method: 'PUT',
      body: {
        organizationName: 'Test Northstar Capital',
        investorType: 'angel',
        investmentThesis: 'Early-stage software with clear workflows.',
        sectors: ['Software'],
        stages: ['seed'],
        status: 'published',
      },
    })
    assert.equal(investorProfileSave.status, 200, JSON.stringify(investorProfileSave.json))
    assert.equal((await founderClient.request('/api/profiles/investor', { method: 'PUT', body: { status: 'draft' } })).status, 403)
    assert.equal((await investorClient.request('/api/profiles/startup', { method: 'PUT', body: { status: 'draft' } })).status, 403)

    const outsiderStartupName = `Second DealRoom Test Startup ${stamp}`
    const outsiderStartupSave = await outsiderClient.request('/api/profiles/startup', {
      method: 'PUT',
      body: {
        companyName: outsiderStartupName,
        tagline: 'Secure workflows for small businesses',
        description: 'Second fictional company for the rejection and re-request test.',
        industry: 'Software', stage: 'pre-seed',
        problem: 'Small teams have fragmented records.',
        solution: 'A shared workflow.', targetMarket: 'Small businesses', status: 'published',
      },
    })
    assert.equal(outsiderStartupSave.status, 200, JSON.stringify(outsiderStartupSave.json))
    const outsiderStartupId = outsiderStartupSave.json.data.profile.id as string
    createdStartupIds.push(outsiderStartupId)

    const discovery = await investorClient.request(`/api/startups?search=${encodeURIComponent(startupName)}&limit=5`)
    assert.equal(discovery.status, 200, JSON.stringify(discovery.json))
    assert.ok(discovery.json.data.items.some((item: { id: string }) => item.id === startupId))

    assert.equal((await investorClient.request(`/api/startups/${startupId}/saved`, { method: 'PUT', csrf: false })).status, 403)
    assert.equal((await investorClient.request(`/api/startups/${startupId}/saved`, { method: 'PUT' })).status, 200)
    assert.equal((await investorClient.request(`/api/startups?search=${encodeURIComponent(startupName)}&savedOnly=true`)).status, 200)

    // Connection lifecycle: pending uniqueness, role authorization, accept and room creation.
    const requestResult = await investorClient.request(`/api/connections/startups/${startupId}`, {
      method: 'POST',
      body: { message: 'A test introduction request.' },
    })
    assert.equal(requestResult.status, 201, JSON.stringify(requestResult.json))
    const requestId = requestResult.json.data.request.id as string
    assert.equal((await investorClient.request(`/api/connections/startups/${startupId}`, { method: 'POST', body: {} })).status, 409)
    assert.equal((await investorClient.request(`/api/connections/${requestId}/accept`, { method: 'PATCH', body: {} })).status, 403)

    const acceptResult = await founderClient.request(`/api/connections/${requestId}/accept`, { method: 'PATCH', body: {} })
    assert.equal(acceptResult.status, 200, JSON.stringify(acceptResult.json))
    const roomId = acceptResult.json.data.dealRoom.id as string
    createdRoomIds.push(roomId)
    assert.equal(acceptResult.json.data.request.status, 'accepted')
    assert.equal((await founderClient.request(`/api/deal-rooms/${roomId}`)).status, 200)
    assert.equal((await investorClient.request(`/api/deal-rooms/${roomId}`)).status, 200)
    assert.equal((await outsiderClient.request(`/api/deal-rooms/${roomId}`)).status, 404)

    // Rejected requests remain in history and do not prevent a later new request.
    const rejectedRequest = await investorClient.request(`/api/connections/startups/${outsiderStartupId}`, {
      method: 'POST', body: { message: 'First attempt for the second startup.' },
    })
    assert.equal(rejectedRequest.status, 201, JSON.stringify(rejectedRequest.json))
    const rejectedRequestId = rejectedRequest.json.data.request.id as string
    const rejectedResult = await outsiderClient.request(`/api/connections/${rejectedRequestId}/reject`, { method: 'PATCH', body: {} })
    assert.equal(rejectedResult.status, 200, JSON.stringify(rejectedResult.json))
    assert.equal(rejectedResult.json.data.request.status, 'rejected')
    const reRequest = await investorClient.request(`/api/connections/startups/${outsiderStartupId}`, {
      method: 'POST', body: { message: 'Trying again after the rejection.' },
    })
    assert.equal(reRequest.status, 201, JSON.stringify(reRequest.json))
    const reRequestId = reRequest.json.data.request.id as string
    const reAccept = await outsiderClient.request(`/api/connections/${reRequestId}/accept`, { method: 'PATCH', body: {} })
    assert.equal(reAccept.status, 200, JSON.stringify(reAccept.json))
    assert.equal(reAccept.json.data.request.status, 'accepted')
    assert.ok(reAccept.json.data.dealRoom.id)
    createdRoomIds.push(reAccept.json.data.dealRoom.id as string)
    const connectionHistory = await investorClient.request('/api/connections')
    assert.equal(connectionHistory.status, 200)
    assert.ok(connectionHistory.json.data.items.some((item: { id: string; status: string }) => item.id === rejectedRequestId && item.status === 'rejected'))
    assert.ok(connectionHistory.json.data.items.some((item: { id: string; status: string }) => item.id === reRequestId && item.status === 'accepted'))

    // Private investor assessment must not be available to a founder.
    assert.equal((await investorClient.request(`/api/deal-rooms/${roomId}/evaluation`, {
      method: 'PUT', body: { scores: { market: 4 }, summary: 'Integration test assessment.' },
    })).status, 200)
    assert.equal((await founderClient.request(`/api/deal-rooms/${roomId}/evaluation`)).status, 403)
    const noteResult = await investorClient.request(`/api/deal-rooms/${roomId}/notes`, {
      method: 'POST', body: { title: 'Private test note', content: 'This note must remain investor-only.' },
    })
    assert.equal(noteResult.status, 201, JSON.stringify(noteResult.json))
    assert.equal((await founderClient.request(`/api/deal-rooms/${roomId}/notes`)).status, 403)

    // Shared information request lifecycle.
    const informationResult = await investorClient.request(`/api/deal-rooms/${roomId}/information-requests`, {
      method: 'POST', body: { title: 'Quarterly revenue', description: 'Share the latest quarterly revenue figure.' },
    })
    assert.equal(informationResult.status, 201, JSON.stringify(informationResult.json))
    const informationRequestId = informationResult.json.data.id as string
    const responseResult = await founderClient.request(`/api/deal-rooms/${roomId}/information-requests/${informationRequestId}/respond`, {
      method: 'PATCH', body: { responseText: 'Revenue was stable for the quarter.', responseLink: 'https://example.test/report' },
    })
    assert.equal(responseResult.status, 200, JSON.stringify(responseResult.json))
    assert.equal(responseResult.json.data.status, 'responded')
    assert.equal((await investorClient.request(`/api/deal-rooms/${roomId}/information-requests/${informationRequestId}/close`, { method: 'PATCH', body: {} })).status, 200)

    // Persisted chat, idempotent retries, cursor recovery and live WebSocket delivery.
    const socket = new WebSocketClient(`ws://127.0.0.1:${address.port}/api/ws`, {
      headers: { Cookie: investorClient.cookieHeader(), Origin: 'http://localhost:5173' },
    })
    participantSocket = socket
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out opening WebSocket')), 5000)
      socket.once('open', () => { clearTimeout(timeout); resolve() })
      socket.once('error', error => { clearTimeout(timeout); reject(error) })
    })
    const waitForEvent = (predicate: (event: any) => boolean) => new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => { socket.off('message', onMessage); reject(new Error('Timed out waiting for WebSocket event')) }, 5000)
      const onMessage = (raw: unknown) => {
        let event: any
        try { event = JSON.parse(String(raw)) } catch { return }
        if (!predicate(event)) return
        clearTimeout(timeout)
        socket.off('message', onMessage)
        resolve(event)
      }
      socket.on('message', onMessage)
    })
    const subscribed = waitForEvent(event => event.type === 'subscribed' && event.roomId === roomId)
    socket.send(JSON.stringify({ type: 'subscribe', roomId }))
    await subscribed

    const clientMessageId = randomUUID()
    const messagePayload = { content: 'Hello from integration test.', clientMessageId }
    const liveMessage = waitForEvent(event => event.type === 'message' && event.roomId === roomId && event.message?.clientMessageId === clientMessageId)
    const sentMessage = await founderClient.request(`/api/deal-rooms/${roomId}/messages`, { method: 'POST', body: messagePayload })
    assert.equal(sentMessage.status, 201, JSON.stringify(sentMessage.json))
    const deliveredEvent = await liveMessage
    assert.equal(deliveredEvent.message.id, sentMessage.json.data.id)

    // A valid account without membership must not be able to subscribe to this room.
    outsiderSocket = new WebSocketClient(`ws://127.0.0.1:${address.port}/api/ws`, {
      headers: { Cookie: outsiderClient.cookieHeader(), Origin: 'http://localhost:5173' },
    })
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out opening outsider WebSocket')), 5000)
      outsiderSocket!.once('open', () => { clearTimeout(timeout); resolve() })
      outsiderSocket!.once('error', error => { clearTimeout(timeout); reject(error) })
    })
    const outsiderDenial = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for outsider membership denial')), 5000)
      outsiderSocket!.once('message', raw => {
        clearTimeout(timeout)
        try { resolve(JSON.parse(String(raw))) } catch { reject(new Error('Outsider subscription returned invalid JSON')) }
      })
    })
    outsiderSocket.send(JSON.stringify({ type: 'subscribe', roomId }))
    assert.equal((await outsiderDenial).code, 'ROOM_ACCESS_DENIED')
    outsiderSocket.close()

    const retriedMessage = await founderClient.request(`/api/deal-rooms/${roomId}/messages`, { method: 'POST', body: messagePayload })
    assert.equal(retriedMessage.status, 200)
    assert.equal(retriedMessage.json.data.id, sentMessage.json.data.id)
    const history = await investorClient.request(`/api/deal-rooms/${roomId}/messages?afterSequence=0`)
    assert.equal(history.status, 200)
    assert.ok(history.json.data.items.some((item: { clientMessageId: string }) => item.clientMessageId === clientMessageId))

    // Notifications/activity APIs and admin permissions/moderation/pagination.
    const notificationList = await founderClient.request('/api/notifications')
    assert.equal(notificationList.status, 200)
    assert.ok(Array.isArray(notificationList.json.data.items))
    const unreadResult = await founderClient.request('/api/notifications/unread-count')
    assert.equal(unreadResult.status, 200)
    assert.equal(typeof unreadResult.json.data.unreadCount, 'number')
    assert.equal((await founderClient.request('/api/notifications/read-all', { method: 'PATCH', body: {} })).status, 200)
    assert.equal((await investorClient.request('/api/admin/users')).status, 403)

    const adminPassword = 'DealRoom-admin-test-password-2026!'
    const bootstrapEnvironment = {
      ...process.env,
      ADMIN_BOOTSTRAP_NAME: 'Test Administrator',
      ADMIN_BOOTSTRAP_EMAIL: adminEmail,
      ADMIN_BOOTSTRAP_PASSWORD: adminPassword,
    }
    const bootstrapResult = spawnSync(process.execPath, ['--import', 'tsx', 'src/scripts/bootstrapAdmin.ts'], {
      cwd: process.cwd(), env: bootstrapEnvironment, encoding: 'utf8', timeout: 30_000,
    })
    assert.equal(bootstrapResult.status, 0, `${bootstrapResult.stdout}\n${bootstrapResult.stderr}`)
    const admin = await User.findOne({ email: adminEmail }).select('_id').lean()
    assert.ok(admin, 'bootstrap command should create the initial administrator')
    createdUserIds.push(admin._id.toString())

    const duplicateBootstrapResult = spawnSync(process.execPath, ['--import', 'tsx', 'src/scripts/bootstrapAdmin.ts'], {
      cwd: process.cwd(),
      env: { ...process.env, ADMIN_BOOTSTRAP_NAME: 'Second Administrator', ADMIN_BOOTSTRAP_EMAIL: `second-admin-${stamp}@example.test`, ADMIN_BOOTSTRAP_PASSWORD: adminPassword },
      encoding: 'utf8', timeout: 30_000,
    })
    assert.notEqual(duplicateBootstrapResult.status, 0, 'bootstrap must refuse to create a second administrator')
    assert.match(`${duplicateBootstrapResult.stdout}\n${duplicateBootstrapResult.stderr}`, /An administrator already exists/)

    await adminClient.initCsrf()
    const adminLogin = await adminClient.request('/api/auth/login', {
      method: 'POST', body: { email: adminEmail, password: adminPassword },
    })
    assert.equal(adminLogin.status, 200, JSON.stringify(adminLogin.json))

    const adminUserPage = await adminClient.request('/api/admin/users?page=1&limit=1')
    assert.equal(adminUserPage.status, 200)
    assert.equal(adminUserPage.json.data.pagination.page, 1)
    assert.equal(adminUserPage.json.data.pagination.limit, 1)
    assert.equal(adminUserPage.json.data.items.length, 1)
    assert.ok(adminUserPage.json.data.pagination.total >= 4)
    assert.ok(adminUserPage.json.data.pagination.totalPages >= 4)

    const hideResult = await adminClient.request(`/api/admin/startups/${startupId}/moderation`, {
      method: 'PATCH', body: { hidden: true, reason: 'Integration test moderation' },
    })
    assert.equal(hideResult.status, 200, JSON.stringify(hideResult.json))
    assert.equal((await investorClient.request(`/api/startups/${startupId}`)).status, 404)
    assert.equal((await adminClient.request(`/api/admin/startups/${startupId}/moderation`, { method: 'PATCH', body: { hidden: false, reason: '' } })).status, 200)
    assert.equal((await investorClient.request(`/api/startups/${startupId}`)).status, 200)

    // An expired/suspended session can still use CSRF-protected logout to clear its cookies.
    // Register the socket-close waiter before the suspend request so the close event cannot race past it.
    const socketClosedForSuspension = new Promise<number>((resolve, reject) => {
      if (!participantSocket) { reject(new Error('Expected an authenticated WebSocket before suspension')); return }
      const timeout = setTimeout(() => reject(new Error('Suspension did not close the user WebSocket')), 5000)
      participantSocket.once('close', code => { clearTimeout(timeout); resolve(code) })
    })
    const suspension = await adminClient.request(`/api/admin/users/${investor.id}/suspension`, {
      method: 'PATCH', body: { suspended: true, reason: 'Integration test' },
    })
    assert.equal(suspension.status, 200, JSON.stringify(suspension.json))
    assert.equal((await investorClient.request('/api/auth/me')).status, 403)
    assert.equal(await socketClosedForSuspension, 1008)
    assert.equal((await investorClient.request('/api/auth/logout', { method: 'POST' })).status, 200)
    assert.equal((await investorClient.request('/api/auth/me')).status, 401)
    assert.equal((await adminClient.request(`/api/admin/users/${investor.id}/suspension`, { method: 'PATCH', body: { suspended: false, reason: '' } })).status, 200)
    const investorRestoredLogin = await investorClient.login(investorEmail)
    assert.equal(investorRestoredLogin.status, 200, JSON.stringify(investorRestoredLogin.json))

    // Terminal room state must reject new messages.
    assert.equal((await investorClient.request(`/api/deal-rooms/${roomId}/status`, { method: 'PATCH', body: { status: 'approved' } })).status, 200)
    const afterDecision = await founderClient.request(`/api/deal-rooms/${roomId}/messages`, {
      method: 'POST', body: { content: 'This must not be accepted after finalization.', clientMessageId: randomUUID() },
    })
    assert.equal(afterDecision.status, 409)
  } finally {
    for (const socket of [participantSocket, outsiderSocket]) {
      if (socket && socket.readyState !== WebSocketClient.CLOSED) {
        await new Promise<void>(resolve => {
          socket.once('close', () => resolve())
          socket.close()
          setTimeout(resolve, 1000)
        })
      }
    }
    if (closeGateway) await closeGateway()
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()))

    await new Promise(resolve => setTimeout(resolve, 250))
    if (createdUserIds.length > 0) {
      const userIds = createdUserIds.map(id => new mongoose.Types.ObjectId(id))
      const rooms = await DealRoom.find({ $or: [{ founder: { $in: userIds } }, { investor: { $in: userIds } }] }).select('_id').lean()
      const roomIds = [...new Set([...createdRoomIds, ...rooms.map(room => room._id.toString())])].map(id => new mongoose.Types.ObjectId(id))
      const startupIds = [...new Set(createdStartupIds)]
      await Promise.all([
        ChatMessage.deleteMany({ room: { $in: roomIds } }),
        DealRoomEvaluation.deleteMany({ $or: [{ dealRoom: { $in: roomIds } }, { investor: { $in: userIds } }] }),
        PrivateNote.deleteMany({ $or: [{ dealRoom: { $in: roomIds } }, { investor: { $in: userIds } }] }),
        InformationRequest.deleteMany({ $or: [{ dealRoom: { $in: roomIds } }, { founder: { $in: userIds } }, { investor: { $in: userIds } }] }),
        ConnectionRequest.deleteMany({ $or: [{ founder: { $in: userIds } }, { investor: { $in: userIds } }] }),
        SavedStartup.deleteMany({ $or: [{ investor: { $in: userIds } }, { startup: { $in: startupIds } }] }),
        DealRoom.deleteMany({ _id: { $in: roomIds } }),
        InvestorProfile.deleteMany({ user: { $in: userIds } }),
        StartupProfile.deleteMany({ $or: [{ founder: { $in: userIds } }, { _id: { $in: startupIds } }] }),
        Notification.deleteMany({ recipient: { $in: userIds } }),
        ActivityEvent.deleteMany({ $or: [{ actor: { $in: userIds } }, { audienceUsers: { $in: userIds } }] }),
      ])
      await User.deleteMany({ _id: { $in: userIds } })
    }
    await mongoose.disconnect()
  }
})
