import assert from 'node:assert/strict'
import test from 'node:test'
import { registerSchema, loginSchema } from '../../src/validators/auth.validator'
import { startupProfileSchema, investorProfileSchema } from '../../src/validators/profile.validator'
import { startupDiscoveryQuerySchema } from '../../src/validators/startupDiscovery.validator'
import { createConnectionRequestSchema } from '../../src/validators/connection.validator'
import {
  createChatMessageSchema,
} from '../../src/validators/chat.validator'
import {
  createInformationRequestSchema,
  createPrivateNoteSchema,
  respondToInformationRequestSchema,
  saveEvaluationSchema,
  updateDealRoomStatusSchema,
} from '../../src/validators/dealRoom.validator'
import { updateStartupModerationSchema, updateUserSuspensionSchema } from '../../src/validators/admin.validator'

const validStartup = {
  companyName: 'Atlas Analytics',
  tagline: 'Operational intelligence for clinics',
  description: 'A test description for a fictional startup.',
  industry: 'Healthcare SaaS',
  stage: 'seed',
  problem: 'Clinic teams work across disconnected systems.',
  solution: 'One workflow for clinic operations.',
  targetMarket: 'Independent clinics',
  status: 'published',
} as const

const validInvestor = {
  organizationName: 'Northstar Capital',
  investorType: 'angel',
  investmentThesis: 'Early-stage workflow software.',
  sectors: ['SaaS'],
  stages: ['seed'],
  status: 'published',
} as const

test('registration normalizes email and only permits founder/investor roles', () => {
  const parsed = registerSchema.parse({ name: '  Taylor Lee  ', email: '  TAYLOR@EXAMPLE.COM ', password: 'a-long-test-password', role: 'founder' })
  assert.equal(parsed.name, 'Taylor Lee')
  assert.equal(parsed.email, 'taylor@example.com')
  assert.equal(registerSchema.safeParse({ ...parsed, role: 'admin' }).success, false)
  assert.equal(registerSchema.safeParse({ ...parsed, password: 'short' }).success, false)
})

test('login rejects malformed credentials and normalizes email', () => {
  assert.equal(loginSchema.parse({ email: ' USER@EXAMPLE.COM ', password: 'x' }).email, 'user@example.com')
  assert.equal(loginSchema.safeParse({ email: 'bad-email', password: 'x' }).success, false)
  assert.equal(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success, false)
})

test('founders may save an incomplete draft but cannot publish incomplete profiles', () => {
  const draft = startupProfileSchema.parse({ status: 'draft' })
  assert.equal(draft.status, 'draft')
  assert.equal(startupProfileSchema.safeParse({ status: 'published' }).success, false)
  assert.equal(startupProfileSchema.safeParse(validStartup).success, true)
})

test('startup publication rejects invalid fundraising ranges and negative metrics', () => {
  assert.equal(startupProfileSchema.safeParse({
    ...validStartup,
    fundraising: { isRaising: true, targetAmount: 100, amountRaised: 101, currency: 'USD' },
  }).success, false)
  assert.equal(startupProfileSchema.safeParse({ status: 'draft', traction: { monthlyRevenue: -1 } }).success, false)
})

test('investors may save drafts but publication needs thesis, sector, and stage', () => {
  assert.equal(investorProfileSchema.safeParse({ status: 'draft' }).success, true)
  assert.equal(investorProfileSchema.safeParse({ ...validInvestor, maxInvestment: 100, minInvestment: 200 }).success, false)
  assert.equal(investorProfileSchema.safeParse(validInvestor).success, true)
})

test('startup discovery parses safe filters and rejects unsupported values', () => {
  const parsed = startupDiscoveryQuerySchema.parse({ search: ' Atlas ', limit: '12', page: '2', isRaising: 'false', sort: 'name-asc' })
  assert.equal(parsed.search, 'Atlas')
  assert.equal(parsed.page, 2)
  assert.equal(parsed.limit, 12)
  assert.equal(parsed.isRaising, false)
  assert.equal(startupDiscoveryQuerySchema.safeParse({ limit: '31' }).success, false)
  assert.equal(startupDiscoveryQuerySchema.safeParse({ sort: 'random' }).success, false)
})

test('connection request message is trimmed and bounded', () => {
  assert.equal(createConnectionRequestSchema.parse({ message: '  Intro please  ' }).message, 'Intro please')
  assert.equal(createConnectionRequestSchema.safeParse({ message: 'x'.repeat(1001) }).success, false)
})

test('chat messages require a non-empty bounded body and UUID idempotency key', () => {
  const clientMessageId = '123e4567-e89b-12d3-a456-426614174000'
  assert.equal(createChatMessageSchema.parse({ content: '  Hello  ', clientMessageId }).content, 'Hello')
  assert.equal(createChatMessageSchema.safeParse({ content: 'Hello', clientMessageId: 'not-a-uuid' }).success, false)
  assert.equal(createChatMessageSchema.safeParse({ content: ' ', clientMessageId }).success, false)
  assert.equal(createChatMessageSchema.safeParse({ content: 'x'.repeat(2001), clientMessageId }).success, false)
})

test('evaluation requires at least one score/summary and scores must be 1 through 5', () => {
  assert.equal(saveEvaluationSchema.safeParse({}).success, false)
  assert.equal(saveEvaluationSchema.safeParse({ scores: { market: 5 } }).success, true)
  assert.equal(saveEvaluationSchema.safeParse({ scores: { market: 6 } }).success, false)
  assert.equal(saveEvaluationSchema.safeParse({ summary: 'A useful assessment' }).success, true)
})

test('status transitions can only request terminal decisions', () => {
  assert.equal(updateDealRoomStatusSchema.safeParse({ status: 'approved' }).success, true)
  assert.equal(updateDealRoomStatusSchema.safeParse({ status: 'passed' }).success, true)
  assert.equal(updateDealRoomStatusSchema.safeParse({ status: 'active' }).success, false)
})

test('private notes and information requests require meaningful content', () => {
  assert.equal(createPrivateNoteSchema.safeParse({ title: '  Risk  ', content: '  Sales cycle is long. ' }).success, true)
  assert.equal(createPrivateNoteSchema.safeParse({ title: '', content: 'Body' }).success, false)
  assert.equal(createInformationRequestSchema.safeParse({ title: 'Financials', description: 'Share last quarter revenue.' }).success, true)
  assert.equal(createInformationRequestSchema.safeParse({ title: 'x', description: '' }).success, false)
})

test('information request responses accept a valid URL and reject invalid URLs', () => {
  assert.equal(respondToInformationRequestSchema.safeParse({ responseText: 'Uploaded', responseLink: 'https://example.com/report' }).success, true)
  assert.equal(respondToInformationRequestSchema.safeParse({ responseText: 'Uploaded', responseLink: 'not a URL' }).success, false)
})

test('admin moderation schemas validate booleans and bound reasons', () => {
  assert.equal(updateUserSuspensionSchema.parse({ suspended: true }).reason, '')
  assert.equal(updateStartupModerationSchema.safeParse({ hidden: true, reason: 'x'.repeat(501) }).success, false)
  assert.equal(updateUserSuspensionSchema.safeParse({ suspended: 'true' }).success, false)
})
