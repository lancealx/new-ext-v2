---
description: 
globs: 
alwaysApply: false
---
# Testing Rules for Chrome Extension

## **Testing Environment Setup**

### **Development Environment**
```typescript
// ✅ DO: Mock Chrome APIs in development
// test/__mocks__/chrome.ts
const chrome = {
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys, callback) => {
        const result = { gridtoken: 'mock-token' };
        if (callback) callback(result);
        return Promise.resolve(result);
      }),
      set: jest.fn().mockImplementation((data, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({}),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    lastError: null,
  },
  tabs: {
    sendMessage: jest.fn().mockResolvedValue({}),
    query: jest.fn().mockResolvedValue([]),
  },
};

// @ts-ignore
global.chrome = chrome;
```

### **Test Configuration**
```javascript
// ✅ DO: Jest configuration for Chrome extension
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.ts',
    '@testing-library/jest-dom',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/extension/background/background.ts', // Exclude service worker
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/test/**/*.test.{ts,tsx}',
  ],
};
```

## **Unit Testing Patterns**

### **Service/Utility Testing**
```typescript
// ✅ DO: Test utility functions thoroughly
import { TokenManager } from '@/services/TokenManager';
import { chrome } from '../__mocks__/chrome';

describe('TokenManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('extractValidToken', () => {
    it('should extract valid token from localStorage', async () => {
      const mockAuthData = {
        authenticated: {
          idToken: 'valid-token',
          idTokenPayload: {
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          },
        },
      };

      (window.localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(mockAuthData)
      );

      const token = await TokenManager.extractValidToken();
      expect(token).toBe('valid-token');
    });

    it('should return null for expired token', async () => {
      const mockAuthData = {
        authenticated: {
          idToken: 'expired-token',
          idTokenPayload: {
            exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          },
        },
      };

      (window.localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(mockAuthData)
      );

      const token = await TokenManager.extractValidToken();
      expect(token).toBeNull();
    });

    it('should handle malformed localStorage data', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid-json');

      const token = await TokenManager.extractValidToken();
      expect(token).toBeNull();
    });
  });

  describe('shareTokenAcrossExtension', () => {
    it('should store token in chrome storage', async () => {
      await TokenManager.shareTokenAcrossExtension('test-token');

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        gridtoken: 'test-token',
      });
    });

    it('should handle storage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      chrome.storage.local.set = jest.fn().mockRejectedValue(new Error('Storage error'));

      await TokenManager.shareTokenAcrossExtension('test-token');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store token:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});
```

### **React Component Testing**
```typescript
// ✅ DO: Comprehensive component testing
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { LoanDataProvider } from '@/contexts/LoanDataContext';
import { createMockLoan } from '@/test/factories/loanFactory';

const mockProps = {
  currentRole: 'LoanOfficer' as const,
  selectedUser: 'all' as const,
  onRoleChange: jest.fn(),
  onUserChange: jest.fn(),
};

const renderDashboard = (props = mockProps, loans: LoanData[] = []) => {
  return render(
    <LoanDataProvider loans={loans}>
      <Dashboard {...props} />
    </LoanDataProvider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderDashboard();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays role selector with correct options', () => {
    renderDashboard();
    
    const roleSelector = screen.getByLabelText('Role Selector');
    expect(roleSelector).toBeInTheDocument();
    
    fireEvent.click(roleSelector);
    
    expect(screen.getByText('Loan Officer')).toBeInTheDocument();
    expect(screen.getByText('Processor')).toBeInTheDocument();
    expect(screen.getByText('Underwriter')).toBeInTheDocument();
  });

  it('calls onRoleChange when role is selected', async () => {
    const user = userEvent.setup();
    renderDashboard();
    
    const roleSelector = screen.getByLabelText('Role Selector');
    await user.click(roleSelector);
    await user.click(screen.getByText('Processor'));
    
    expect(mockProps.onRoleChange).toHaveBeenCalledWith('Processor');
  });

  it('displays loan cards for current role', () => {
    const mockLoans = [
      createMockLoan({ 
        id: '1', 
        borrowerName: 'John Doe',
        status: { type: 'pending', submittedAt: new Date() } 
      }),
      createMockLoan({ 
        id: '2', 
        borrowerName: 'Jane Smith',
        status: { type: 'approved', approvedAt: new Date(), approvedBy: 'user1' } 
      }),
    ];
    
    renderDashboard(mockProps, mockLoans);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('handles loading state correctly', async () => {
    const { rerender } = renderDashboard();
    
    // Mock loading state
    rerender(
      <LoanDataProvider loans={[]} isLoading={true}>
        <Dashboard {...mockProps} />
      </LoanDataProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error state correctly', () => {
    const errorMessage = 'Failed to load loans';
    
    render(
      <LoanDataProvider loans={[]} error={new Error(errorMessage)}>
        <Dashboard {...mockProps} />
      </LoanDataProvider>
    );
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
```

### **Custom Hook Testing**
```typescript
// ✅ DO: Test custom hooks in isolation
import { renderHook, waitFor } from '@testing-library/react';
import { useToken } from '@/hooks/useToken';
import { TokenManager } from '@/services/TokenManager';

// Mock the TokenManager
jest.mock('@/services/TokenManager');
const mockTokenManager = TokenManager as jest.Mocked<typeof TokenManager>;

describe('useToken Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return token when available', async () => {
    mockTokenManager.getToken.mockResolvedValue('valid-token');
    
    const { result } = renderHook(() => useToken());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.token).toBe('valid-token');
    expect(result.current.error).toBeNull();
  });

  it('should handle token fetch errors', async () => {
    const error = new Error('Token fetch failed');
    mockTokenManager.getToken.mockRejectedValue(error);
    
    const { result } = renderHook(() => useToken());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.token).toBeNull();
    expect(result.current.error).toEqual(error);
  });

  it('should refresh token when refresh is called', async () => {
    mockTokenManager.getToken
      .mockResolvedValueOnce('old-token')
      .mockResolvedValueOnce('new-token');
    
    const { result } = renderHook(() => useToken());
    
    await waitFor(() => {
      expect(result.current.token).toBe('old-token');
    });
    
    await result.current.refresh();
    
    expect(result.current.token).toBe('new-token');
    expect(mockTokenManager.getToken).toHaveBeenCalledTimes(2);
  });
});
```

## **Integration Testing**

### **Extension Integration Tests**
```typescript
// ✅ DO: Test extension integration flows
import { ContentScriptManager } from '@/extension/content/ContentScriptManager';
import { BackgroundService } from '@/extension/background/BackgroundService';

describe('Extension Integration', () => {
  let contentScript: ContentScriptManager;
  let backgroundService: BackgroundService;

  beforeEach(() => {
    contentScript = new ContentScriptManager();
    backgroundService = new BackgroundService();
  });

  it('should initialize extension when config is enabled', async () => {
    // Mock config fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: true }),
    });

    const initializeSpy = jest.spyOn(contentScript, 'initialize');
    
    await contentScript.checkConfigAndInitialize();
    
    expect(initializeSpy).toHaveBeenCalled();
  });

  it('should not initialize when config is disabled', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: false }),
    });

    const initializeSpy = jest.spyOn(contentScript, 'initialize');
    
    await contentScript.checkConfigAndInitialize();
    
    expect(initializeSpy).not.toHaveBeenCalled();
  });

  it('should handle message passing between content and background', async () => {
    const testMessage = { action: 'shareToken', payload: 'test-token' };
    
    // Mock message listener
    const messageHandler = jest.fn();
    chrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageHandler.mockImplementation(listener);
    });

    backgroundService.initializeListeners();
    
    // Simulate message from content script
    await messageHandler(testMessage, {}, jest.fn());
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      gridtoken: 'test-token',
    });
  });
});
```

### **API Integration Tests**
```typescript
// ✅ DO: Test API integration with mocked responses
import { NanoApiService } from '@/services/NanoApiService';
import { createMockLoan } from '@/test/factories/loanFactory';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('NanoApiService Integration', () => {
  const apiService = new NanoApiService('mock-token');

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should fetch loans successfully', async () => {
    const mockLoans = [
      createMockLoan({ id: '1' }),
      createMockLoan({ id: '2' }),
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockLoans }),
    } as Response);

    const result = await apiService.getLoans();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockLoans);
    }
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    const result = await apiService.getLoans();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('API request failed');
    }
  });

  it('should include authentication token in requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    await apiService.getLoans();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token',
        }),
      })
    );
  });
});
```

## **End-to-End Testing**

### **Playwright E2E Tests**
```typescript
// ✅ DO: E2E tests for critical user journeys
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('Chrome Extension E2E', () => {
  test('should load dashboard when on search_files page', async () => {
    // Load extension
    const extensionPath = path.join(__dirname, '../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    const page = await context.newPage();
    
    // Navigate to Nano search_files page
    await page.goto('https://canopymortgage.nanolos.com/loan-fulfillment/#/main/search_files/apps');
    
    // Wait for extension to inject dashboard
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    // Verify dashboard is visible
    const dashboard = page.locator('[data-testid="dashboard"]');
    await expect(dashboard).toBeVisible();
    
    // Verify role selector is present
    const roleSelector = page.locator('[data-testid="role-selector"]');
    await expect(roleSelector).toBeVisible();
    
    await context.close();
  });

  test('should handle role switching', async () => {
    const extensionPath = path.join(__dirname, '../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    const page = await context.newPage();
    await page.goto('https://canopymortgage.nanolos.com/loan-fulfillment/#/main/search_files/apps');
    
    // Wait for dashboard
    await page.waitForSelector('[data-testid="role-selector"]');
    
    // Switch role
    await page.selectOption('[data-testid="role-selector"]', 'Processor');
    
    // Verify role-specific content appears
    await expect(page.locator('[data-testid="processor-view"]')).toBeVisible();
    
    await context.close();
  });
});
```

## **Test Data Factories**

### **Mock Data Creation**
```typescript
// ✅ DO: Create reusable test data factories
// test/factories/loanFactory.ts
import { faker } from '@faker-js/faker';
import type { LoanData, LoanStatus } from '@/types/loan';

export const createMockLoanStatus = (type?: LoanStatus['type']): LoanStatus => {
  const statusType = type || faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'closed']);
  
  switch (statusType) {
    case 'pending':
      return { type: 'pending', submittedAt: faker.date.recent() };
    case 'approved':
      return { 
        type: 'approved', 
        approvedAt: faker.date.recent(), 
        approvedBy: faker.person.fullName() 
      };
    case 'rejected':
      return { 
        type: 'rejected', 
        rejectedAt: faker.date.recent(), 
        reason: faker.lorem.sentence() 
      };
    case 'closed':
      return { type: 'closed', closedAt: faker.date.recent() };
    default:
      throw new Error(`Invalid status type: ${statusType}`);
  }
};

export const createMockLoan = (overrides: Partial<LoanData> = {}): LoanData => ({
  id: faker.string.uuid(),
  borrowerName: faker.person.fullName(),
  amount: faker.number.int({ min: 100000, max: 1000000 }),
  status: createMockLoanStatus(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  assignedTo: faker.string.uuid(),
  priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
  ...overrides,
});

export const createMockLoans = (count: number, overrides: Partial<LoanData> = []): LoanData[] => {
  return Array.from({ length: count }, () => createMockLoan(overrides));
};
```

### **Chrome Extension Mocks**
```typescript
// ✅ DO: Comprehensive Chrome API mocks
// test/__mocks__/chromeExtension.ts
export const createMockChromeApi = () => ({
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys) => {
        const mockData = {
          gridtoken: 'mock-jwt-token',
          userPreferences: { role: 'LoanOfficer' },
        };
        
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockData[keys] });
        }
        
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            result[key] = mockData[key];
          });
          return Promise.resolve(result);
        }
        
        return Promise.resolve(mockData);
      }),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({}),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn().mockReturnValue(false),
    },
    getURL: jest.fn().mockImplementation((path) => `chrome-extension://mock-id/${path}`),
    id: 'mock-extension-id',
    lastError: null,
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  action: {
    setBadgeText: jest.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: jest.fn().mockResolvedValue(undefined),
  },
});
```

## **Testing Best Practices**

### **Test Organization**
```typescript
// ✅ DO: Organize tests logically
describe('TokenManager', () => {
  describe('Token Extraction', () => {
    // Tests for token extraction logic
  });

  describe('Token Validation', () => {
    // Tests for token validation logic
  });

  describe('Token Storage', () => {
    // Tests for token storage logic
  });

  describe('Error Handling', () => {
    // Tests for error scenarios
  });
});
```

### **Async Testing Patterns**
```typescript
// ✅ DO: Proper async testing
test('should handle async operations', async () => {
  const promise = asyncFunction();
  
  // Test loading state
  expect(getLoadingIndicator()).toBeInTheDocument();
  
  // Wait for completion
  const result = await promise;
  
  // Test final state
  expect(result).toBeDefined();
  expect(getLoadingIndicator()).not.toBeInTheDocument();
});

// ✅ DO: Test error conditions
test('should handle errors gracefully', async () => {
  const mockError = new Error('Test error');
  jest.spyOn(apiService, 'fetchData').mockRejectedValue(mockError);
  
  await expect(component.loadData()).rejects.toThrow('Test error');
});
```

### **Performance Testing**
```typescript
// ✅ DO: Test performance-critical functions
test('should handle large datasets efficiently', () => {
  const largeDataset = createMockLoans(10000);
  const startTime = performance.now();
  
  const result = filterLoans(largeDataset, { status: 'pending' });
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
  expect(result).toBeDefined();
});
```

