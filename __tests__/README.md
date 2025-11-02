# Testing Guide

This directory contains comprehensive tests for the Cosmic Spiritual Guide application.

## Test Structure

```
__tests__/
├── api/              # API endpoint tests (Jest)
├── e2e/              # End-to-end tests (Playwright)
├── unit/             # Unit tests (Jest)
└── README.md         # This file
```

## Prerequisites

Install dependencies:
```bash
npm install
```

Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### All Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e           # Run in headless mode
npm run test:e2e:headed    # Run with browser visible
npm run test:e2e:ui        # Run with Playwright UI
```

### API Tests
```bash
npm run test:api
```

### Unit Tests
```bash
npm run test:unit
```

### Watch Mode (Unit/API Tests)
```bash
npm test -- --watch
```

## Test Coverage

### User Onboarding
- ✅ Tour display for new users
- ✅ Tour completion flow
- ✅ Tour skip functionality
- ✅ Returning user behavior

### Credit Management
- ✅ Initial credits assignment
- ✅ Credit deduction after readings
- ✅ Database logging
- ✅ Edge cases (insufficient credits)
- ✅ Credit display on dashboard

### Authentication
- ✅ Login flow
- ✅ Signup flow
- ✅ Invalid credential handling
- ✅ Google OAuth button display
- ✅ Login loop prevention
- ✅ Forgot password navigation

### Edge Cases
- ✅ Insufficient credits handling
- ✅ Duplicate email prevention
- ✅ Missing required fields
- ✅ Invalid tokens
- ✅ Empty form submissions

## Environment Setup

Tests use the following environment variables:
- `TEST_DATABASE_URL` - Optional, defaults to `DATABASE_URL`
- `TEST_URL` - E2E test base URL, defaults to `http://localhost:5000`

## Continuous Integration

Tests should be run before deployment:
1. API tests verify backend logic
2. Unit tests check individual functions
3. E2E tests validate user flows

## Writing New Tests

### E2E Test Example
```javascript
test('should perform a specific action', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('button:has-text("Action")');
  await expect(page.locator('.result')).toBeVisible();
});
```

### API Test Example
```javascript
test('should return correct response', async () => {
  const response = await fetch('http://localhost:5000/api/endpoint');
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
});
```

### Unit Test Example
```javascript
test('should calculate correctly', () => {
  const result = calculateSomething(5, 10);
  expect(result).toBe(15);
});
```

## Debugging Tests

### E2E Tests
```bash
# Run with debug output
DEBUG=pw:* npm run test:e2e

# Pause execution
await page.pause();

# Take screenshot
await page.screenshot({ path: 'debug.png' });
```

### API/Unit Tests
```bash
# Run specific test file
npm test -- credits.test.js

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm test -- --coverage
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Descriptive Names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock External Services**: Don't call real APIs in unit tests
6. **Test Edge Cases**: Cover error conditions and boundary cases

## Troubleshooting

### Tests Timing Out
- Increase timeout in test file: `test.setTimeout(60000)`
- Check if dev server is running for E2E tests

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Ensure test database is accessible
- Check SSL configuration if using remote DB

### Playwright Installation Issues
```bash
# Reinstall browsers
npx playwright install --force
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Tests
  run: |
    npm install
    npm run test:api
    npm run test:unit
    npm run test:e2e
```

## Coverage Goals

- Unit Tests: 80%+ coverage
- API Tests: All endpoints covered
- E2E Tests: Critical user flows covered

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Update this README if adding new test categories
4. Run full test suite before committing


