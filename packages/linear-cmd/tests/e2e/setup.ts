import './load-env';

import { beforeEach } from 'vitest';

// Global E2E setup
beforeEach(() => {
  // Ensure we have required environment variables for E2E tests
  if (!process.env.LINEAR_API_KEY_E2E) {
    throw new Error('LINEAR_API_KEY_E2E is required for E2E tests. Please set it in .env.e2e file.');
  }

  if (!process.env.LINEAR_TEST_ISSUE_ID) {
    throw new Error('LINEAR_TEST_ISSUE_ID is required for E2E tests. Please set it in .env.e2e file.');
  }
});

// No mocks for E2E tests - we want to use real APIs
