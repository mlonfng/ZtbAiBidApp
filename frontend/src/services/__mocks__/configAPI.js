// frontend/src/services/__mocks__/configAPI.js

export const configAPI = {
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
};

