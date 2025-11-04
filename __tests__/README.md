# Test Suite Documentation

Comprehensive automated tests for core application flows using Jest + React Testing Library (unit tests) and Playwright (E2E tests).

## Test Structure

```
__tests__/
├── unit/                    # Unit tests (Jest + React Testing Library)
│   ├── streak.test.js
│   ├── credit-deduction.test.js
│   ├── reading-generation.test.js
│   └── billing-redirect.test.js
├── e2e/                     # E2E tests (Playwright)
│   ├── streak-tracking.spec.js
│   ├── credit-deduction.spec.js
│   ├── reading-generation.spec.js
│   └── billing-redirect.spec.js
└── fixtures/                # Test fixtures and sample data
    └── test-data.js
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm test __tests__/unit/streak.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test __tests__/e2e/streak-tracking.spec.js
```

### API Tests

```bash
# Run API tests
npm run test:api
```

## Test Suites

### 1. Streak Tracking (`streak.test.js`, `streak-tracking.spec.js`)

**Unit Tests:**
- Daily login streak increment on first login
- Consecutive day streak increment
- Streak reset when login gap > 1 day
- Same-day login prevention (no duplicate increment)
- Streak API endpoint responses

**E2E Tests:**
- Streak display in dashboard
- Streak increment on login
- Streak API integration
- Error handling for streak API failures

### 2. Credit Deduction (`credit-deduction.test.js`, `credit-deduction.spec.js`)

**Unit Tests:**
- Basic tarot reading (1 credit deduction)
- Premium tarot reading (2 credit deduction)
- Insufficient credits handling
- Credit deduction failure handling
- Credit balance updates
- Negative balance prevention

**E2E Tests:**
- Credit display in UI
- Credit deduction after reading generation
- Insufficient credits error display
- Credit balance updates

### 3. Reading Generation (`reading-generation.test.js`, `reading-generation.spec.js`)

**Unit Tests:**
- Successful reading generation
- Reading generation with question
- OpenAI API failure fallback
- Database save failure handling
- Network timeout handling
- Reading validation (question required, card count)

**E2E Tests:**
- Reading generation success flow
- Reading result modal display
- API failure error handling
- Loading state display
- Modal close functionality
- Network timeout handling

### 4. Billing Redirect (`billing-redirect.test.js`, `billing-redirect.spec.js`)

**Unit Tests:**
- Upgrade button click handling
- Stripe checkout session creation
- Existing customer handling
- New customer creation
- Stripe API error handling
- Checkout URL redirect

**E2E Tests:**
- Upgrade button visibility
- Checkout modal opening
- Stripe checkout redirect
- PremiumCard display for non-premium users
- Subscription API error handling
- Loading state during checkout

## Test Fixtures

Located in `__tests__/fixtures/test-data.js`:

- **testUsers**: Sample user data (regular, premium, admin)
- **testCredits**: Sample credit data (initial, low, empty)
- **testStreaks**: Sample streak data (new, active, broken)
- **testReadings**: Sample reading data (tarot basic, premium)
- **testStripeSessions**: Sample Stripe session data
- **mockApiResponses**: Standard API response formats

## Mocking

### Database

All unit tests mock the database pool:

```javascript
jest.mock('@/lib/db', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { pool: mockPool };
});
```

### External APIs

- **Stripe**: Mocked in billing tests
- **OpenAI**: Mocked in reading generation tests
- **Authentication**: Mocked `getAuthenticatedUser`

### API Routes (E2E)

E2E tests use Playwright's `page.route()` to mock API responses:

```javascript
await page.route('**/api/readings/generate', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ success: true, reading: {...} }),
  });
});
```

## Test Data Attributes

For E2E tests, components should use `data-testid` attributes:

- `data-testid="streak-counter"` - Streak display
- `data-testid="credits-display"` - Credits display
- `data-testid="reading-modal"` - Reading result modal
- `data-testid="upgrade-button"` - Upgrade button

## Writing New Tests

### Unit Test Template

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should do something', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### E2E Test Template

```javascript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup (login, etc.)
  });

  test('should do something', async ({ page }) => {
    // Interact with page
    // Assert results
  });
});
```

## CI/CD Integration

Tests are configured to run in CI environments:

- **Jest**: Runs in Node.js environment
- **Playwright**: Runs with `--headed=false` in CI
- **Coverage**: Generates coverage reports for CI

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Troubleshooting

### Unit Tests Fail

1. Check if mocks are properly set up
2. Verify database query mocks return expected structure
3. Ensure async/await is used correctly

### E2E Tests Fail

1. Ensure dev server is running (`npm run dev`)
2. Check browser console for errors
3. Verify test selectors are correct
4. Check if API routes are properly mocked

### Playwright Installation

If Playwright browsers are missing:

```bash
npx playwright install
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clear mocks between tests
3. **Realistic Data**: Use fixtures for consistent test data
4. **Error Cases**: Test both success and failure paths
5. **Accessibility**: Use semantic selectors (roles, labels) when possible
6. **Performance**: Keep E2E tests focused on critical flows
