// frontend/src/services/__mocks__/aiModeManager.js

// This is a mock of the AIModeManager. It prevents the real service from being initialized.
const AIModeManager = {
  getInstance: jest.fn(() => ({
    // Mock any methods that are called on the instance
    initializeAIServices: jest.fn(),
    getMode: jest.fn(),
    switchMode: jest.fn(),
  })),
};

export default AIModeManager;

