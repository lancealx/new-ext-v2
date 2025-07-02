/**
 * Token Service - Handles JWT token extraction, validation, and management
 * 
 * This service provides robust error handling, token validation, refresh logic, 
 * and cross-extension token sharing capabilities.
 */

interface TokenData {
  token: string;
  expiresAt: number; // Unix timestamp in milliseconds
  refreshToken?: string;
}

interface StorageAuth {
  token?: string;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
}

// Known storage keys that might contain tokens in Nano LOS
const STORAGE_KEYS = [
  'gridauth',
  'ember_simple_auth-session',
  'nanolos-auth',
  'auth_data'
];

// Minimum token length to be considered valid (sanity check)
const MIN_TOKEN_LENGTH = 50;

// Maximum attempts to extract token before giving up
const MAX_EXTRACTION_ATTEMPTS = 5;

// Delay between extraction attempts (ms)
const EXTRACTION_RETRY_DELAY = 2000;

// Time before expiration to consider token stale (ms)
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export class TokenService {
  private currentToken: TokenData | null = null;
  private extractionAttempts = 0;
  private extractionTimer: number | null = null;
  private listeners: Array<(token: string | null) => void> = [];

  /**
   * Initialize the token service and start extraction process
   */
  public async initialize(): Promise<boolean> {
    // First try to get token from extension storage
    const storedToken = await this.getTokenFromStorage();
    
    if (storedToken) {
      this.currentToken = storedToken;
      
      // Validate if the stored token is still valid
      if (this.isTokenValid(storedToken)) {
        this.notifyListeners(storedToken.token);
        return true;
      }
    }
    
    // If no valid token in storage, try to extract from localStorage
    return this.startTokenExtraction();
  }

  /**
   * Get the current token if available and valid
   */
  public async getToken(): Promise<string | null> {
    // If we have a cached token, check if it's valid
    if (this.currentToken) {
      // If token is expired, try to refresh it
      if (this.isTokenExpired(this.currentToken)) {
        // Try to refresh if possible
        if (this.currentToken.refreshToken) {
          try {
            await this.refreshToken(this.currentToken.refreshToken);
          } catch (error) {
            console.error('Failed to refresh token:', error);
            this.currentToken = null;
          }
        } else {
          // No refresh token, clear current token
          this.currentToken = null;
        }
      }
      // If token will expire soon, trigger background refresh
      else if (this.isTokenStale(this.currentToken)) {
        if (this.currentToken.refreshToken) {
          this.refreshToken(this.currentToken.refreshToken).catch(error => {
            console.error('Background token refresh failed:', error);
          });
        }
        // Still return current token since it's not expired yet
        return this.currentToken.token;
      }
    }
    
    // If token is not available or invalid, start extraction
    if (!this.currentToken) {
      await this.startTokenExtraction();
    }
    
    return this.currentToken?.token || null;
  }

  /**
   * Register a listener for token updates
   */
  public addTokenListener(callback: (token: string | null) => void): void {
    this.listeners.push(callback);
    
    // Immediately notify with current token
    try {
      if (this.currentToken && this.isTokenValid(this.currentToken)) {
        callback(this.currentToken.token);
      } else {
        callback(null);
      }
    } catch (error) {
      console.error('Error in token listener:', error);
    }
  }

  /**
   * Remove a token listener
   */
  public removeTokenListener(callback: (token: string | null) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Start the token extraction process with retries
   */
  private async startTokenExtraction(): Promise<boolean> {
    this.extractionAttempts = 0;
    
    // Clear any existing timer
    if (this.extractionTimer !== null) {
      window.clearTimeout(this.extractionTimer);
      this.extractionTimer = null;
    }
    
    return this.extractToken();
  }

  /**
   * Extract token from localStorage with retry logic
   */
  private async extractToken(): Promise<boolean> {
    if (this.extractionAttempts >= MAX_EXTRACTION_ATTEMPTS) {
      console.error('Maximum token extraction attempts reached');
      return false;
    }
    
    this.extractionAttempts++;
    console.log(`Token extraction attempt ${this.extractionAttempts}/${MAX_EXTRACTION_ATTEMPTS}`);
    
    try {
      // Try each known storage key
      for (const key of STORAGE_KEYS) {
        const rawData = localStorage.getItem(key);
        if (!rawData) continue;
        
        try {
          const parsedData = JSON.parse(rawData);
          const tokenData = this.parseTokenFromData(key, parsedData);
          
          if (tokenData && this.isTokenValid(tokenData)) {
            this.currentToken = tokenData;
            await this.storeTokenInExtension(tokenData);
            this.notifyListeners(tokenData.token);
            return true;
          }
        } catch (parseError) {
          console.warn(`Failed to parse data from ${key}:`, parseError);
          // Continue to next key
        }
      }
      
      // If no token found, schedule a retry
      this.scheduleRetry();
      return false;
    } catch (error) {
      console.error('Token extraction error:', error);
      this.scheduleRetry();
      return false;
    }
  }
  
  /**
   * Schedule a retry for token extraction
   */
  private scheduleRetry(): void {
    if (this.extractionAttempts < MAX_EXTRACTION_ATTEMPTS) {
      this.extractionTimer = window.setTimeout(() => {
        this.extractToken();
      }, EXTRACTION_RETRY_DELAY);
    }
  }

  /**
   * Parse token data from different storage formats
   */
  private parseTokenFromData(storageKey: string, data: any): TokenData | null {
    if (!data) return null;
    
    try {
      // Handle different storage formats
      switch (storageKey) {
        case 'gridauth':
          if (typeof data.token === 'string' && data.token.length > MIN_TOKEN_LENGTH) {
            const decoded = this.decodeToken(data.token);
            const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600000;
            
            return {
              token: data.token,
              expiresAt,
              refreshToken: data.refreshToken
            };
          }
          break;
          
        case 'ember_simple_auth-session':
          // This is the main format used by Nano LOS
          if (data.authenticated) {
            // Extract the idToken like in the legacy code
            const token = data.authenticated.idToken;
            
            if (typeof token === 'string' && token.length > MIN_TOKEN_LENGTH) {
              const decoded = this.decodeToken(token);
              const expiresAt = decoded?.exp 
                ? decoded.exp * 1000 
                : (data.authenticated.expiresAt || Date.now() + 3600000);
              
              console.log('Successfully extracted token from ember_simple_auth-session');
              
              return {
                token,
                expiresAt,
                refreshToken: data.authenticated.refreshToken
              };
            }
          }
          break;
          
        case 'nanolos-auth':
        case 'auth_data':
          // These may have different structures
          const tokenData = data as StorageAuth;
          const token = tokenData.token || tokenData.idToken || tokenData.accessToken;
          
          if (typeof token === 'string' && token.length > MIN_TOKEN_LENGTH) {
            const decoded = this.decodeToken(token);
            
            // Calculate expiry time
            let expiresAt: number;
            if (decoded?.exp) {
              expiresAt = decoded.exp * 1000;
            } else if (tokenData.expiresAt) {
              expiresAt = typeof tokenData.expiresAt === 'number' 
                ? tokenData.expiresAt 
                : parseInt(tokenData.expiresAt);
            } else if (tokenData.expiresIn) {
              expiresAt = Date.now() + (tokenData.expiresIn * 1000);
            } else {
              expiresAt = Date.now() + 3600000; // Default 1 hour
            }
            
            return {
              token,
              expiresAt,
              refreshToken: tokenData.refreshToken
            };
          }
          break;
      }
    } catch (error) {
      console.error(`Error parsing token from ${storageKey}:`, error);
    }
    
    return null;
  }

  /**
   * Decode a JWT token to access its payload
   */
  private decodeToken(token: string): any {
    try {
      // JWT tokens are in format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the payload (middle part)
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      console.log('jsonPayload', jsonPayload);
      return JSON.parse(jsonPayload);

    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if a token is still valid (not expired)
   */
  private isTokenValid(tokenData: TokenData): boolean {
    // Basic validation checks
    if (!tokenData || !tokenData.token || typeof tokenData.token !== 'string') {
      return false;
    }
    
    if (tokenData.token.length < MIN_TOKEN_LENGTH) {
      return false;
    }
    
    // Check if token follows JWT format (header.payload.signature)
    const parts = tokenData.token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Check if token is expired
    return !this.isTokenExpired(tokenData);
  }

  /**
   * Check if a token is expired
   */
  private isTokenExpired(tokenData: TokenData): boolean {
    return Date.now() >= tokenData.expiresAt;
  }

  /**
   * Check if a token will expire soon and should be refreshed
   */
  private isTokenStale(tokenData: TokenData): boolean {
    return tokenData.expiresAt - Date.now() <= TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Refresh the token using a refresh token
   */
  private async refreshToken(refreshToken: string): Promise<boolean> {
    // This would typically call the Nano LOS API to refresh the token
    // For now, we'll just log that it would happen
    console.log('Would refresh token using:', refreshToken);
    
    // In a real implementation, this would:
    // 1. Call the refresh token endpoint
    // 2. Get a new token
    // 3. Update localStorage with the new token
    // 4. Update the token in extension storage
    
    // For this example, we'll just try to extract a new token
    return this.startTokenExtraction();
  }

  /**
   * Store token in Chrome extension storage for sharing between components
   */
  private async storeTokenInExtension(tokenData: TokenData): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      chrome.runtime.sendMessage(
        { 
          type: 'STORE_TOKEN', 
          token: tokenData.token,
          expiresAt: tokenData.expiresAt,
          refreshToken: tokenData.refreshToken 
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to store token in extension:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else if (response && response.success) {
            resolve();
          } else {
            reject(new Error('Failed to store token in extension'));
          }
        }
      );
    });
  }

  /**
   * Get token from Chrome extension storage
   */
  private async getTokenFromStorage(): Promise<TokenData | null> {
    return new Promise<TokenData | null>((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_TOKEN' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to get token from extension:', chrome.runtime.lastError);
          resolve(null);
        } else if (response && response.token) {
          resolve({
            token: response.token,
            expiresAt: response.expiresAt || Date.now() + 3600000,
            refreshToken: response.refreshToken
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Notify all listeners about token changes
   */
  private notifyListeners(token: string | null): void {
    for (const listener of this.listeners) {
      try {
        listener(token);
      } catch (error) {
        console.error('Error in token listener:', error);
      }
    }
  }
}

// Create singleton instance
export const tokenService = new TokenService();

// Export default for convenient imports
export default tokenService; 