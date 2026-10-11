const { readdirSync } = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const testRoot = path.join(__dirname)
const integrationOnly = process.argv.includes('--integration')

function findTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) return findTests(absolute)
    return entry.isFile() && entry.name.endsWith('.test.ts') ? [absolute] : []
  })
}

if (integrationOnly && !process.env.TEST_MONGODB_URI) {
  console.error('TEST_MONGODB_URI is required. Use a dedicated MongoDB database whose name contains "test".')
  process.exit(2)
}

const files = findTests(testRoot).filter((file) => {
  const isIntegration = file.includes(`${path.sep}integration${path.sep}`)
  // Keep the default command safe for developers: it runs isolated unit tests only.
  // Database-mutating integration workflows are opt-in via `npm run test:integration`.
  return integrationOnly ? isIntegration : !isIntegration
})

if (files.length === 0) {
  console.error('No test files found.')
  process.exit(2)
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], {
  cwd: path.resolve(testRoot, '..'),
  stdio: 'inherit',
  env: process.env,
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}
process.exit(result.status ?? 1)
