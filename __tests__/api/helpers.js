/**
 * Test helpers for API test suites
 */

/**
 * Conditional describe block — skips the suite when condition is falsy.
 * Use for integration tests that require external services (DB, running server).
 */
const describeIf = (condition) => (condition ? describe : describe.skip);

module.exports = { describeIf };
