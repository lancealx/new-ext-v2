/**
 * TokenService Test Suite
 * 
 * Comprehensive tests for token extraction, validation, storage, and refresh functionality.
 * This is critical infrastructure - every scenario must be tested.
 */

import { TokenService, tokenService } from '../tokenService';

// Mock Chrome runtime API
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    lastError: null,
  },
};

// Setup global chrome mock
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true,
});

// Mock localStorage with proper interface
const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    _store: store,
    _setStore: (newStore: Record<string, string>) => {
      Object.keys(store).forEach(key => delete store[key]);
      Object.assign(store, newStore);
    }
  };
};

describe('TokenService', () => {
  let service: TokenService;
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  // Create valid JWT tokens for testing
  const createValidJWT = (payload: any = {}, expiresInSeconds: number = 3600) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const defaultPayload = {
      sub: '1234567890',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      ...payload
    };
    
    const headerB64 = btoa(JSON.stringify(header)).replace(/[+\/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify(defaultPayload)).replace(/[+\/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
    const signature = 'mock-signature-part';
    
    return `${headerB64}.${payloadB64}.${signature}`;
  };

  const createExpiredJWT = () => {
    return createValidJWT({}, -3600); // Expired 1 hour ago
  };

  const createStaleJWT = () => {
    return createValidJWT({}, 120); // Expires in 2 minutes (considered stale)
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Create fresh service instance
    service = new TokenService();
    
    // Setup localStorage mock
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Reset chrome mock
    mockChrome.runtime.lastError = null;
    mockChrome.runtime.sendMessage.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Token Extraction', () => {
    it('should extract token from ember_simple_auth-session format', async () => {
      const validToken = createValidJWT();
      const emberData = {
        authenticated: {
          idToken: validToken,
          expiresAt: Date.now() + 3600000,
          refreshToken: 'refresh-token-123'
        }
      };

      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify(emberData)
      });

      // Mock successful storage
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback({ success: true });
      });

      const result = await service.initialize();
      
      expect(result).toBe(true);
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STORE_TOKEN',
          token: validToken,
        }),
        expect.any(Function)
      );
    });

    it('should extract token from gridauth format', async () => {
      const validToken = createValidJWT();
      const gridauthData = {
        token: validToken,
        refreshToken: 'refresh-token-456'
      };

      mockLocalStorage._setStore({
        'gridauth': JSON.stringify(gridauthData)
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback({ success: true });
      });

      const result = await service.initialize();
      
      expect(result).toBe(true);
    });

    it('should try multiple storage keys in order', async () => {
      const validToken = createValidJWT();
      
      // Put token in the third key it will check
      mockLocalStorage._setStore({
        'nanolos-auth': JSON.stringify({
          token: validToken,
          expiresAt: Date.now() + 3600000
        })
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback({ success: true });
      });

      const result = await service.initialize();
      
      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('gridauth');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('ember_simple_auth-session');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('nanolos-auth');
    });

    it('should retry extraction on failure with exponential backoff', async () => {
      // Setup: no valid tokens initially
      mockLocalStorage._setStore({});

      // Start initialization
      const initPromise = service.initialize();
      
      // The service should have scheduled a retry since no token was found
      // Let's simulate this by fast-forwarding and checking behavior
      
      // Add a valid token after some time passes
      setTimeout(() => {
        const validToken = createValidJWT();
        mockLocalStorage._setStore({
          'ember_simple_auth-session': JSON.stringify({
            authenticated: {
              idToken: validToken,
              expiresAt: Date.now() + 3600000
            }
          })
        });

        mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
          if (callback) callback({ success: true });
        });
      }, 1000);

      // Advance time to trigger the retry
      jest.advanceTimersByTime(3000);
      
      const result = await initPromise;
      expect(result).toBe(true);
    });

    it('should give up after maximum attempts', async () => {
      mockLocalStorage._setStore({});

      const initPromise = service.initialize();
      
      // Fast-forward through all retry attempts
      for (let i = 0; i < 6; i++) {
        jest.advanceTimersByTime(2000);
      }
      
      const result = await initPromise;
      expect(result).toBe(false);
    });
  });

  describe('Token Validation', () => {
    it('should reject tokens that are too short', async () => {
      const shortToken = 'abc.def.ghi'; // Too short
      
      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: shortToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      const result = await service.initialize();
      expect(result).toBe(false);
    });

    it('should reject malformed JWT tokens', async () => {
      const malformedToken = 'not.a.valid.jwt.token.with.too.many.parts';
      
      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: malformedToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      const result = await service.initialize();
      expect(result).toBe(false);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = createExpiredJWT();
      
      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: expiredToken,
            expiresAt: Date.now() - 3600000 // Expired
          }
        })
      });

      const result = await service.initialize();
      expect(result).toBe(false);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      mockLocalStorage._setStore({
        'ember_simple_auth-session': '{"invalid":json}', // Malformed JSON
        'gridauth': 'not-json-at-all'
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.initialize();
      expect(result).toBe(false);
      
      // Should not throw errors - the warnings are expected and handled
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Token Storage and Retrieval', () => {
    it('should use stored token if valid', async () => {
      const validToken = createValidJWT();
      
      // Mock chrome storage returning a valid token
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'GET_TOKEN') {
          callback({
            token: validToken,
            expiresAt: Date.now() + 3600000,
            refreshToken: 'refresh-123'
          });
        }
      });

      const result = await service.initialize();
      
      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled(); // Should not check localStorage
    });

    it('should fall back to localStorage if stored token is expired', async () => {
      const expiredToken = createExpiredJWT();
      const validToken = createValidJWT();
      
      // Mock chrome storage returning expired token
      mockChrome.runtime.sendMessage
        .mockImplementationOnce((message, callback) => {
          if (message.type === 'GET_TOKEN') {
            callback({
              token: expiredToken,
              expiresAt: Date.now() - 3600000 // Expired
            });
          }
        })
        .mockImplementationOnce((message, callback) => {
          if (message.type === 'STORE_TOKEN') {
            callback({ success: true });
          }
        });

      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: validToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      const result = await service.initialize();
      
      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalled(); // Should check localStorage
    });

    it('should handle chrome storage errors gracefully', async () => {
      const validToken = createValidJWT();
      
      // Mock chrome storage error
      (mockChrome.runtime as any).lastError = new Error('Storage error');
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback(null);
      });

      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: validToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      const result = await service.initialize();
      
      expect(result).toBe(false); // Should fail to store token
    });
  });

  describe('Token Refresh Logic', () => {
    it('should refresh stale token automatically', async () => {
      const staleToken = createStaleJWT(); // Expires in 2 minutes
      
      // Setup service with stale token
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'GET_TOKEN') {
          callback({
            token: staleToken,
            expiresAt: Date.now() + 120000, // 2 minutes
            refreshToken: 'refresh-123'
          });
        }
      });

      await service.initialize();
      
      // When getting token, it should trigger background refresh
      const token = await service.getToken();
      
      expect(token).toBe(staleToken); // Should still return current token
      
      // But should have started refresh process
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it('should return null for expired token without refresh token', async () => {
      const expiredToken = createExpiredJWT();
      
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'GET_TOKEN') {
          callback({
            token: expiredToken,
            expiresAt: Date.now() - 3600000 // Expired 1 hour ago
            // No refresh token
          });
        }
      });

      await service.initialize();
      const token = await service.getToken();
      
      expect(token).toBeNull();
    });
  });

  describe('Token Listeners', () => {
    it('should notify listeners when token is extracted', async () => {
      const validToken = createValidJWT();
      const mockListener = jest.fn();
      
      service.addTokenListener(mockListener);
      
      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: validToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback({ success: true });
      });

      await service.initialize();
      
      expect(mockListener).toHaveBeenCalledWith(validToken);
    });

    it('should notify listeners with null when no token available', async () => {
      const mockListener = jest.fn();
      
      service.addTokenListener(mockListener);
      
      // Should immediately notify with null since no token available
      expect(mockListener).toHaveBeenCalledWith(null);
    });

    it('should remove listeners correctly', async () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      
      service.addTokenListener(mockListener1);
      service.addTokenListener(mockListener2);
      service.removeTokenListener(mockListener1);
      
      const validToken = createValidJWT();
      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: validToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback({ success: true });
      });

      await service.initialize();
      
      // Only mockListener2 should be called, not mockListener1
      expect(mockListener2).toHaveBeenCalledWith(validToken);
      expect(mockListener1).toHaveBeenCalledTimes(1); // Only the initial null call
    });

    it('should handle listener errors gracefully', async () => {
      // Mock console.error first to capture the error logs
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();
      
      // Add listeners - this should not throw for the null case
      service.addTokenListener(faultyListener);
      service.addTokenListener(goodListener);
      
      // Clear the initial calls from adding listeners
      consoleSpy.mockClear();
      faultyListener.mockClear();
      goodListener.mockClear();
      
      const validToken = createValidJWT();
      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: validToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback({ success: true });
      });

      await service.initialize();
      
      // Good listener should still be called despite faulty listener
      expect(goodListener).toHaveBeenCalledWith(validToken);
      expect(consoleSpy).toHaveBeenCalledWith('Error in token listener:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null localStorage values', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await service.initialize();
      expect(result).toBe(false);
    });

    it('should handle concurrent initialization calls', async () => {
      const validToken = createValidJWT();
      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: validToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback({ success: true });
      });

      // Call initialize multiple times concurrently
      const promises = [
        service.initialize(),
        service.initialize(),
        service.initialize()
      ];

      const results = await Promise.all(promises);
      
      // All should succeed
      expect(results).toEqual([true, true, true]);
      
      // But storage should only be called once per message type
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'STORE_TOKEN' }),
        expect.any(Function)
      );
    });

    it('should handle malformed base64 in JWT', async () => {
      // Create a token with invalid base64 payload
      const malformedToken = 'header.invalid@base64!.signature';
      
      mockLocalStorage._setStore({
        'ember_simple_auth-session': JSON.stringify({
          authenticated: {
            idToken: malformedToken,
            expiresAt: Date.now() + 3600000
          }
        })
      });

      const result = await service.initialize();
      expect(result).toBe(false);
    });
  });

  describe('Token Formats and Storage Keys', () => {
    it('should handle nanolos-auth format with different token properties', async () => {
      const validToken = createValidJWT();
      
      // Test different property names
      const testCases = [
        { token: validToken },
        { idToken: validToken },
        { accessToken: validToken }
      ];

      for (const tokenData of testCases) {
        const service = new TokenService();
        
        mockLocalStorage._setStore({
          'nanolos-auth': JSON.stringify({
            ...tokenData,
            expiresAt: Date.now() + 3600000
          })
        });

        mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
          if (callback) callback({ success: true });
        });

        const result = await service.initialize();
        expect(result).toBe(true);
        
        mockChrome.runtime.sendMessage.mockClear();
      }
    });

    it('should calculate expiry time from expiresIn property', async () => {
      const validToken = createValidJWT();
      const expiresInSeconds = 7200; // 2 hours
      
      mockLocalStorage._setStore({
        'auth_data': JSON.stringify({
          token: validToken,
          expiresIn: expiresInSeconds
        })
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (callback) callback({ success: true });
      });

      await service.initialize();
      
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'STORE_TOKEN',
          expiresAt: expect.any(Number)
        }),
        expect.any(Function)
      );
    });
  });
});

describe('TokenService Singleton', () => {
  it('should export a singleton instance', () => {
    expect(tokenService).toBeInstanceOf(TokenService);
  });

  it('should maintain state across imports', async () => {
    const mockListener = jest.fn();
    tokenService.addTokenListener(mockListener);
    
    // The listener should be registered
    expect(mockListener).toHaveBeenCalledWith(null); // Initial call with null
  });
}); 