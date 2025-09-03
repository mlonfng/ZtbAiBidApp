// Polyfill for fetch API
import 'whatwg-fetch';






// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock the API service module before any tests run
// This will replace the actual api.js with our mock version in __mocks__
jest.mock('services/api');

jest.mock('services/configAPI', () => ({
  configAPI: {
    getUnifiedConfig: jest.fn(() => Promise.resolve({
      system: {
        current_ai_provider: 'deepseek',
      },
      ai_models: {
        deepseek: {
          api_key: 'test-key',
          base_url: 'https://api.deepseek.com',
          model: 'deepseek-chat',
        },
      },
    })),
  },
}));


