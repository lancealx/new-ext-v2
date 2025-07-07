/**
 * @jest-environment jsdom
 */

import { userService, UserService } from '../userService';

// Mock Chrome APIs
const mockChromeStorage = {
  local: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn()
  }
};

// Mock global chrome object
Object.defineProperty(global, 'chrome', {
  value: {
    storage: mockChromeStorage
  },
  writable: true
});

// Mock fetch
global.fetch = jest.fn();

// Mock TokenService
const mockTokenService = {
  getToken: jest.fn()
};

// Mock window.setTimeout and window.clearTimeout
const originalSetTimeout = window.setTimeout;
const originalClearTimeout = window.clearTimeout;

beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockReset();
  
  // Reset user service state
  userService.destroy();
  (userService as any).currentUser = null;
  (userService as any).userSession = null;
  (userService as any).refreshTimer = null;
  (userService as any).sessionTimer = null;
  (userService as any).listeners = [];
  (userService as any).tokenService = null;
  
  // Mock setTimeout and clearTimeout
  window.setTimeout = jest.fn((cb, delay) => {
    if (delay === 0) {
      // Execute immediately for testing
      cb();
    }
    return 123 as any;
  }) as any;
  
  window.clearTimeout = jest.fn() as any;
});

afterEach(() => {
  // Restore original timers
  window.setTimeout = originalSetTimeout;
  window.clearTimeout = originalClearTimeout;
});

describe('UserService', () => {
  describe('initialize', () => {
    it('should initialize successfully with valid stored user data', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now() - 1000,
        storedAt: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(true);
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith(['nano_user_data']);
    });

    it('should fetch user data from API when no stored data', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      const mockResponse = {
        data: {
          id: '1523',
          attributes: {
            firstName: 'David',
            lastName: 'Alexander',
            nickName: 'Lance',
            email: 'lance@example.com',
            permissions: [4, 13, 14, 28],
            organizationId: '456',
            role: 'admin'
          }
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nanolos.com/nano/users?currentOnly=true',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Accept': 'application/vnd.api+json'
          })
        })
      );
    });

    it('should handle initialization failure when no token available', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle old stored user data', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        storedAt: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      const mockResponse = {
        data: {
          id: '1523',
          attributes: {
            firstName: 'David',
            lastName: 'Alexander',
            nickName: 'Lance',
            email: 'lance@example.com',
            permissions: [4, 13, 14, 28],
            organizationId: '456',
            role: 'admin'
          }
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('getUserSession', () => {
    it('should return valid user session', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      const session = await userService.getUserSession();
      
      expect(session.isAuthenticated).toBe(true);
      expect(session.userData?.userId).toBe('1523');
      expect(session.userData?.nickName).toBe('Lance');
      expect(session.permissions.read_loans).toBe(true);
      expect(session.permissions.edit_loans).toBe(true);
    });

    it('should return empty session when no user data', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      await userService.initialize(mockTokenService);
      const session = await userService.getUserSession();
      
      expect(session.isAuthenticated).toBe(false);
      expect(session.userData).toBe(null);
      expect(session.permissions).toEqual({});
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      const user = await userService.getCurrentUser();
      
      expect(user).toBeTruthy();
      expect(user?.userId).toBe('1523');
      expect(user?.nickName).toBe('Lance');
    });

    it('should return null when no user data', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      await userService.initialize(mockTokenService);
      const user = await userService.getCurrentUser();
      
      expect(user).toBe(null);
    });
  });

  describe('hasPermission', () => {
    beforeEach(async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
    });

    it('should return true for numeric permissions user has', async () => {
      const hasPermission = await userService.hasPermission(4);
      expect(hasPermission).toBe(true);
    });

    it('should return false for numeric permissions user does not have', async () => {
      const hasPermission = await userService.hasPermission(999);
      expect(hasPermission).toBe(false);
    });

    it('should return true for string permissions user has', async () => {
      const hasPermission = await userService.hasPermission('read_loans');
      expect(hasPermission).toBe(true);
    });

    it('should return false for string permissions user does not have', async () => {
      const hasPermission = await userService.hasPermission('super_admin');
      expect(hasPermission).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      const newService = new UserService();
      await newService.initialize(mockTokenService);
      
      const hasPermission = await newService.hasPermission('read_loans');
      expect(hasPermission).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    beforeEach(async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
    });

    it('should return true when user has any of the permissions', async () => {
      const hasAny = await userService.hasAnyPermission(['read_loans', 'super_admin']);
      expect(hasAny).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      const hasAny = await userService.hasAnyPermission(['super_admin', 'system_config']);
      expect(hasAny).toBe(false);
    });

    it('should work with mixed numeric and string permissions', async () => {
      const hasAny = await userService.hasAnyPermission([4, 'super_admin']);
      expect(hasAny).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    beforeEach(async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
    });

    it('should return true when user has all permissions', async () => {
      const hasAll = await userService.hasAllPermissions(['read_loans', 'edit_loans']);
      expect(hasAll).toBe(true);
    });

    it('should return false when user is missing some permissions', async () => {
      const hasAll = await userService.hasAllPermissions(['read_loans', 'super_admin']);
      expect(hasAll).toBe(false);
    });

    it('should work with mixed numeric and string permissions', async () => {
      const hasAll = await userService.hasAllPermissions([4, 'edit_loans']);
      expect(hasAll).toBe(true);
    });
  });

  describe('getDisplayName', () => {
    it('should return nickName when available', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      const displayName = await userService.getDisplayName();
      
      expect(displayName).toBe('Lance');
    });

    it('should return full name when nickName not available', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: '',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      const displayName = await userService.getDisplayName();
      
      expect(displayName).toBe('David Alexander');
    });

    it('should return Unknown User when no user data', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      await userService.initialize(mockTokenService);
      const displayName = await userService.getDisplayName();
      
      expect(displayName).toBe('Unknown User');
    });
  });

  describe('getUserPermissions', () => {
    it('should return readable permission names', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      const permissions = await userService.getUserPermissions();
      
      expect(permissions).toEqual(['read_loans', 'edit_loans', 'delete_loans', 'export_data']);
    });

    it('should return empty array when not authenticated', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      await userService.initialize(mockTokenService);
      const permissions = await userService.getUserPermissions();
      
      expect(permissions).toEqual([]);
    });
  });

  describe('refreshUserData', () => {
    it('should refresh user data from API', async () => {
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      const mockResponse = {
        data: {
          id: '1523',
          attributes: {
            firstName: 'David',
            lastName: 'Alexander',
            nickName: 'Lance',
            email: 'lance@example.com',
            permissions: [4, 13, 14, 28],
            organizationId: '456',
            role: 'admin'
          }
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      await userService.initialize(mockTokenService);
      const result = await userService.refreshUserData();
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nanolos.com/nano/users?currentOnly=true',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });

    it('should handle refresh failure', async () => {
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await userService.initialize(mockTokenService);
      const result = await userService.refreshUserData();
      
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user data and session', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      
      await userService.logout();
      
      expect(mockChromeStorage.local.remove).toHaveBeenCalledWith(['nano_user_data']);
      
      const session = await userService.getUserSession();
      expect(session.isAuthenticated).toBe(false);
    });

    it('should handle storage clear errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockChromeStorage.local.remove.mockRejectedValue(new Error('Storage error'));
      
      await userService.logout();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear user storage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('listeners', () => {
    it('should add and notify user session listeners', async () => {
      const mockListener = jest.fn();
      
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      
      userService.addUserSessionListener(mockListener);
      
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          isAuthenticated: true,
          userData: expect.objectContaining({
            userId: '1523',
            nickName: 'Lance'
          })
        })
      );
    });

    it('should remove user session listeners', async () => {
      const mockListener = jest.fn();
      const testService = new UserService();
      
      testService.addUserSessionListener(mockListener);
      testService.removeUserSessionListener(mockListener);
      
      // Should not be called after removal
      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', async () => {
      const mockListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      
      userService.addUserSessionListener(mockListener);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in user session listener:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('API integration', () => {
    it('should handle API errors gracefully', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(false);
    });

    it('should handle invalid API response', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(false);
    });

    it('should handle malformed API response', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      const mockResponse = {
        data: null // Invalid response format
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(false);
    });
  });

  describe('storage operations', () => {
    it('should handle storage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockChromeStorage.local.get.mockRejectedValue(new Error('Storage error'));
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(false);
      
      consoleSpy.mockRestore();
    });

    it('should handle storage set errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      mockChromeStorage.local.set.mockRejectedValue(new Error('Storage set error'));
      
      const mockResponse = {
        data: {
          id: '1523',
          attributes: {
            firstName: 'David',
            lastName: 'Alexander',
            nickName: 'Lance',
            email: 'lance@example.com',
            permissions: [4, 13, 14, 28],
            organizationId: '456',
            role: 'admin'
          }
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await userService.initialize(mockTokenService);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to store user data in extension:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      const mockUserData = {
        userId: '1523',
        firstName: 'David',
        lastName: 'Alexander',
        nickName: 'Lance',
        email: 'lance@example.com',
        permissions: [4, 13, 14, 28],
        organizationId: '456',
        role: 'admin',
        sessionStart: '2024-01-15T09:00:00Z',
        lastUpdated: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_user_data: mockUserData
      });
      
      await userService.initialize(mockTokenService);
      
      // Now destroy should have timers to clear
      userService.destroy();
      
      expect(window.clearTimeout).toHaveBeenCalled();
    });
  });
});

describe('UserService class instantiation', () => {
  it('should create a new instance', () => {
    const service = new UserService();
    expect(service).toBeInstanceOf(UserService);
  });
}); 