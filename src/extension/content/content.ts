/**
 * Content script for Nano LOS Extension
 * Handles token extraction from the current page and UI enhancements
 */

class NanoLOSContent {
  private currentUrl: string;
  private observers: MutationObserver[] = [];

  constructor() {
    this.currentUrl = window.location.href;
    this.initialize();
  }

  private async initialize() {
    console.log('Nano LOS Content Script initializing...');
    
    // Extract and store token using the proven method from legacy script
    await this.extractAndStoreToken();
    
    // Set up monitoring for URL changes and token updates
    this.setupUrlMonitoring();
    this.setupTokenMonitoring();
    
    // Listen for messages from background/popup
    this.setupMessageListeners();
    
    console.log('Nano LOS Content Script initialized');
  }

  private async extractAndStoreToken() {
    try {
      console.log('Attempting to extract token from ember_simple_auth-session...');
      
      // Use the exact same method as the legacy script
      const authDataRaw = localStorage.getItem('ember_simple_auth-session');
      
      if (!authDataRaw) {
        console.log('No ember_simple_auth-session found in localStorage');
        return;
      }

      const authData = JSON.parse(authDataRaw);
      const token = authData && authData.authenticated && authData.authenticated.idToken;
      const idTokenPayload = authData && authData.authenticated && authData.authenticated.idTokenPayload;


      if (!token) {
        console.log('No idToken found in auth data');
        return;
      }

      // Check token expiration like the legacy script
      if (idTokenPayload) {
        const expirationTime = idTokenPayload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();

        if (expirationTime < currentTime) {
          console.log('Token is expired');
          return;
        }
      }

      console.log('Valid token extracted successfully');
      

      // Send token to background script (like legacy: chrome.runtime.sendMessage({ action: 'shareToken', token: token }))
      await this.sendTokenToBackground(token);
      
      console.log('Token stored and shared with background script');
    } catch (error) {
      console.error('Error extracting token:', error);
    }
  }

  private async sendTokenToBackground(token: string) {
    return new Promise<void>((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'storeToken',
        token: token
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          console.log('Token successfully sent to background script');
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to store token'));
        }
      });
    });
  }

  private setupUrlMonitoring() {
    // Monitor for URL changes (SPA navigation) - same as legacy
    let lastUrl = location.href;
    
    const urlObserver = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('URL changed to:', currentUrl);
        
        // Re-extract token on navigation with delay like legacy
        setTimeout(() => this.extractAndStoreToken(), 1000);
      }
    });

    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(urlObserver);

    // Also listen for popstate and hashchange like legacy
    window.addEventListener('popstate', () => {
      setTimeout(() => this.extractAndStoreToken(), 500);
    });
    
    window.addEventListener('hashchange', () => {
      setTimeout(() => this.extractAndStoreToken(), 500);
    });
  }

  private setupTokenMonitoring() {
    // Monitor localStorage changes for token updates
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem.call(localStorage, key, value);
      
      // Check if this is the ember_simple_auth-session key
      if (key === 'ember_simple_auth-session') {
        console.log('ember_simple_auth-session updated, re-extracting token');
        setTimeout(() => this.extractAndStoreToken(), 500);
      }
    };

    // Also monitor for storage events from other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === 'ember_simple_auth-session') {
        console.log('ember_simple_auth-session changed in another tab');
        setTimeout(() => this.extractAndStoreToken(), 500);
      }
    });
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Content script received message:', request.type || request.action);
      
      switch (request.type || request.action) {
        case 'extractToken':
          this.handleExtractTokenRequest(sendResponse);
          return true; // Keep message channel open
          
        case 'refreshToken':
          this.handleRefreshTokenRequest(sendResponse);
          return true;
          
        case 'getPageInfo':
          this.handleGetPageInfoRequest(sendResponse);
          return true;
          
        case 'TOKEN_UPDATED':
          // Handle token update broadcast from background script
          console.log('Token updated by background script');
          sendResponse({ success: true });
          return false; // No async response needed
          
        default:
          console.log('Unknown message type/action:', request.type || request.action);
          return false;
      }
    });
  }

  private async handleExtractTokenRequest(sendResponse: (response: any) => void) {
    try {
      await this.extractAndStoreToken();
      
      // Get the token from localStorage like legacy script
      const authDataRaw = localStorage.getItem('ember_simple_auth-session');
      if (authDataRaw) {
        const authData = JSON.parse(authDataRaw);
        const token = authData && authData.authenticated && authData.authenticated.idToken;
        sendResponse({ success: true, token });
      } else {
        sendResponse({ success: false, error: 'No token found' });
      }
    } catch (error) {
      console.error('Error handling extract token request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ success: false, error: errorMessage });
    }
  }

  private async handleRefreshTokenRequest(sendResponse: (response: any) => void) {
    try {
      await this.extractAndStoreToken();
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error handling refresh token request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ success: false, error: errorMessage });
    }
  }

  private handleGetPageInfoRequest(sendResponse: (response: any) => void) {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      isNanoLOS: this.isNanoLOSPage(),
      hasAuthForm: this.hasAuthenticationForm(),
      storageKeys: this.getStorageKeys()
    };
    
    sendResponse({ success: true, pageInfo });
  }

  private isNanoLOSPage(): boolean {
    return window.location.hostname.includes('nanolos.com') || 
           window.location.hostname.includes('canopymortgage.nanolos.com');
  }

  private hasAuthenticationForm(): boolean {
    const authSelectors = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[name*="email"]',
      'form[class*="login"]',
      'form[class*="auth"]'
    ];
    
    return authSelectors.some(selector => 
      document.querySelector(selector) !== null
    );
  }

  private getStorageKeys(): string[] {
    const keys = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
    } catch (error) {
      console.error('Error reading localStorage keys:', error);
    }
    
    return keys;
  }

  // Cleanup method
  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('Nano LOS Content Script destroyed');
  }
}

// Initialize the content script immediately like legacy script
let contentScript: NanoLOSContent | null = null;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contentScript = new NanoLOSContent();
  });
} else {
  contentScript = new NanoLOSContent();
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  if (contentScript) {
    contentScript.destroy();
  }
});

// Export for debugging
(window as any).nanoContentScript = contentScript; 