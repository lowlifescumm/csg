// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:5000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

// Global test timeout
jest.setTimeout(30000)

