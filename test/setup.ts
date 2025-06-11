import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Mock browser APIs not available in Jest
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock chrome extension API
Object.defineProperty(global, 'chrome', {
  value: {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      getManifest: jest.fn(() => ({
        manifest_version: 3,
        name: 'Nano Loan Origination Chrome Extension (Pipeline Pro)',
        version: '1.0.0',
      })),
    },
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn(),
      },
      sync: {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn(),
      },
    },
    tabs: {
      query: jest.fn(),
      sendMessage: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    identity: {
      getAuthToken: jest.fn(),
    },
    permissions: {
      contains: jest.fn(),
      request: jest.fn(),
    },
    scripting: {
      executeScript: jest.fn(),
    },
    action: {
      setBadgeText: jest.fn(),
      setBadgeBackgroundColor: jest.fn(),
    },
  },
  writable: true,
});

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string>;

  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
});

// Mock fetch API
global.fetch = jest.fn();

// Set testing viewport
window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
});

// Suppress console errors during tests
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock AG Grid license manager
jest.mock('ag-grid-enterprise', () => ({
  LicenseManager: {
    setLicenseKey: jest.fn(),
  },
}));

// Mock Zustand
jest.mock('zustand', () => ({
  create: jest.fn(() => jest.fn()),
}));

// Console spy setup for testing
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

export { mockChrome }; 