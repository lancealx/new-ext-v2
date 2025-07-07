/**
 * @jest-environment jsdom
 */

import { licenseService, LicenseService } from '../licenseService';

// Mock Chrome APIs
const mockChromeStorage = {
  local: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn()
  }
};

const mockChromeRuntime = {
  getManifest: jest.fn(() => ({ version: '1.0.0' }))
};

// Mock global chrome object
Object.defineProperty(global, 'chrome', {
  value: {
    storage: mockChromeStorage,
    runtime: mockChromeRuntime
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
  
  // Reset license service state
  licenseService.destroy();
  (licenseService as any).currentLicense = null;
  (licenseService as any).validationTimer = null;
  (licenseService as any).listeners = [];
  (licenseService as any).tokenService = null;
  
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

describe('LicenseService', () => {
  describe('initialize', () => {
    it('should initialize successfully with valid stored license', async () => {
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now() - 1000,
        expiresAt: Date.now() + 86400000, // 24 hours from now
        features: ['search', 'data_grid'],
        userId: '123',
        organizationId: '456',
        agGridLicense: 'ag-grid-license-key',
        storedAt: Date.now()
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(true);
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith(['nano_license_data']);
    });

    it('should fetch license remotely when no stored license', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      const mockResponse = {
        valid: true,
        license: {
          license: 'remote-license-key',
          issuedAt: Date.now(),
          expiresAt: Date.now() + 86400000,
          features: ['search', 'data_grid'],
          userId: '123',
          organizationId: '456',
          agGridLicense: 'ag-grid-license-key'
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.nanolos.com/nano/license/validate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle initialization failure when no token available', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle expired stored license', async () => {
      const mockLicenseData = {
        license: 'expired-license-key',
        issuedAt: Date.now() - 86400000,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        features: ['search'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      const mockResponse = {
        valid: true,
        license: {
          license: 'new-license-key',
          issuedAt: Date.now(),
          expiresAt: Date.now() + 86400000,
          features: ['search', 'data_grid'],
          userId: '123',
          organizationId: '456'
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('getLicenseStatus', () => {
    it('should return valid license status', async () => {
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search', 'data_grid'],
        userId: '123',
        organizationId: '456',
        agGridLicense: 'ag-grid-license-key'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      const status = await licenseService.getLicenseStatus();
      
      expect(status.isValid).toBe(true);
      expect(status.isExpired).toBe(false);
      expect(status.features).toEqual(['search', 'data_grid']);
      expect(status.agGridLicense).toBe('ag-grid-license-key');
    });

    it('should return expired license status', async () => {
      const mockLicenseData = {
        license: 'expired-license-key',
        issuedAt: Date.now() - 86400000,
        expiresAt: Date.now() - 1000,
        features: ['search'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      mockTokenService.getToken.mockResolvedValue(null);
      
      await licenseService.initialize(mockTokenService);
      const status = await licenseService.getLicenseStatus();
      
      expect(status.isValid).toBe(false);
      expect(status.isExpired).toBe(true);
      expect(status.error).toBe('License has expired');
    });

    it('should return error status when no license found', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      await licenseService.initialize(mockTokenService);
      const status = await licenseService.getLicenseStatus();
      
      expect(status.isValid).toBe(false);
      expect(status.isExpired).toBe(false);
      expect(status.error).toBe('No valid license found');
    });
  });

  describe('isFeatureAvailable', () => {
    it('should return true for available features', async () => {
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search', 'data_grid'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      
      const hasSearch = await licenseService.isFeatureAvailable('search');
      const hasDataGrid = await licenseService.isFeatureAvailable('data_grid');
      
      expect(hasSearch).toBe(true);
      expect(hasDataGrid).toBe(true);
    });

    it('should return false for unavailable features', async () => {
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      
      const hasAnalytics = await licenseService.isFeatureAvailable('analytics');
      
      expect(hasAnalytics).toBe(false);
    });

    it('should return false when license is invalid', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      await licenseService.initialize(mockTokenService);
      
      const hasSearch = await licenseService.isFeatureAvailable('search');
      
      expect(hasSearch).toBe(false);
    });
  });

  describe('getAgGridLicense', () => {
    it('should return AG-Grid license key when available', async () => {
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search', 'data_grid'],
        userId: '123',
        organizationId: '456',
        agGridLicense: 'ag-grid-license-key'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      
      const agGridLicense = await licenseService.getAgGridLicense();
      
      expect(agGridLicense).toBe('ag-grid-license-key');
    });

    it('should return null when AG-Grid license not available', async () => {
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      
      const agGridLicense = await licenseService.getAgGridLicense();
      
      expect(agGridLicense).toBe(null);
    });
  });

  describe('validateCoreAccess', () => {
    it('should return true for valid license', async () => {
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search', 'data_grid'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      
      const hasAccess = await licenseService.validateCoreAccess();
      
      expect(hasAccess).toBe(true);
    });

    it('should return false for invalid license', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      await licenseService.initialize(mockTokenService);
      
      const hasAccess = await licenseService.validateCoreAccess();
      
      expect(hasAccess).toBe(false);
    });
  });

  describe('listeners', () => {
    it('should add and notify license listeners', async () => {
      const mockListener = jest.fn();
      
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search', 'data_grid'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      
      licenseService.addLicenseListener(mockListener);
      
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: true,
          isExpired: false,
          features: ['search', 'data_grid']
        })
      );
    });

    it('should remove license listeners', async () => {
      const mockListener = jest.fn();
      const testService = new LicenseService();
      
      testService.addLicenseListener(mockListener);
      testService.removeLicenseListener(mockListener);
      
      // Should not be called after removal
      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', async () => {
      const mockListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      
      licenseService.addLicenseListener(mockListener);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in license listener:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('remote validation', () => {
    it('should handle API errors gracefully', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const result = await licenseService.initialize(mockTokenService);
      
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
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(false);
    });

    it('should handle invalid license response', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      
      const mockResponse = {
        valid: false,
        error: 'Invalid license'
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(false);
    });
  });

  describe('storage operations', () => {
    it('should handle storage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockChromeStorage.local.get.mockRejectedValue(new Error('Storage error'));
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(false);
      
      consoleSpy.mockRestore();
    });

    it('should handle missing storage data', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue(null);
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(false);
    });

    it('should handle storage set errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockChromeStorage.local.get.mockResolvedValue({});
      mockTokenService.getToken.mockResolvedValue('valid-token');
      mockChromeStorage.local.set.mockRejectedValue(new Error('Storage set error'));
      
      const mockResponse = {
        valid: true,
        license: {
          license: 'valid-license-key',
          issuedAt: Date.now(),
          expiresAt: Date.now() + 86400000,
          features: ['search'],
          userId: '123',
          organizationId: '456'
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await licenseService.initialize(mockTokenService);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to store license in extension:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      const mockLicenseData = {
        license: 'valid-license-key',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        features: ['search'],
        userId: '123',
        organizationId: '456'
      };
      
      mockChromeStorage.local.get.mockResolvedValue({
        nano_license_data: mockLicenseData
      });
      
      await licenseService.initialize(mockTokenService);
      
      // Now destroy should have timers to clear
      licenseService.destroy();
      
      expect(window.clearTimeout).toHaveBeenCalled();
    });
  });
});

describe('LicenseService class instantiation', () => {
  it('should create a new instance', () => {
    const service = new LicenseService();
    expect(service).toBeInstanceOf(LicenseService);
  });
}); 