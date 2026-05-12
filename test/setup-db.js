const logger = require('../lib/logger');
const testDatabaseUrl = process.env.TEST_DATABASE_URL

if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl
  process.env.USE_TEST_DATABASE = 'true'
} else {
  const message = [
    'TEST_DATABASE_URL is not set.',
    'API integration tests require a dedicated Postgres instance.',
    'Set TEST_DATABASE_URL (e.g. in CI secrets or local .env.test) to enable DB-backed tests.'
  ].join(' ')

  logger.warn(`\n[Jest] ${message}\n`)
}

