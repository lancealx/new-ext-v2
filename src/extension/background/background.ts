// Background script for Nano Loan Origination Extension
console.log('Background script loaded');

interface TokenData {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

// Initialize the background service
function initialize(): void {
  // Setup listeners
  chrome.runtime.onInstalled.addListener(handleInstalled);
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Initialize settings if needed
  initializeSettings();
  
  // Check if we have a test token, add for testing
  addTestToken();
  
  console.log('Background service initialized');
}

function handleInstalled(details: chrome.runtime.InstalledDetails): void {
  console.log('Extension installed:', details.reason);
  
  // Initialize default settings on installation
  if (details.reason === 'install') {
    initializeSettings();
  }
}

// For testing - add a test token if we don't have one
function addTestToken(): void {
  chrome.storage.local.get(['tokenData'], (result) => {
    if (!result.tokenData) {
      console.log('No token found, adding test token for debugging purposes');
      
      // This is just a sample JWT token for testing (no sensitive data)
      const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTU3MjQ5MDIyfQ.4Adcj3UFYzPUVaVF43FmMab6RmFDRrOQJ2yoqPri1PU";
      
      const tokenData: TokenData = {
        token: testToken,
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };
      
      chrome.storage.local.set({ tokenData }, () => {
        console.log('Test token added to storage for debugging');
        
        // Also add an older format token for testing fallback
        chrome.storage.local.set({ nanoToken: testToken }, () => {
          console.log('Old format test token added to storage');
        });
      });
    } else {
      console.log('Token already exists in storage:', result.tokenData);
    }
  });
}

function initializeSettings(): void {
  chrome.storage.local.get(['userPreferences', 'dashboardConfig'], (result) => {
    const needsInit = !result.userPreferences || !result.dashboardConfig;
    
    if (needsInit) {
      chrome.storage.local.set({
        userPreferences: {
          defaultRole: 'LoanOfficer',
          selectedUser: 'current',
          theme: 'system'
        },
        dashboardConfig: {
          refreshInterval: 300000, // 5 minutes
          maxLoansPerColumn: 50,
          autoRefresh: true
        }
      });
    }
  });
}

function handleMessage(
  message: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  console.log('Message received in background:', message.action);

  // Handle token operations
  if (message.action === 'GET_TOKEN') {
    handleGetToken(sendResponse);
    return true; // Indicate async response
  }

  if (message.action === 'STORE_TOKEN') {
    handleStoreToken(message, sendResponse);
    return true; // Indicate async response
  }

  if (message.action === 'VALIDATE_TOKEN') {
    handleValidateToken(message, sendResponse);
    return true; // Indicate async response
  }

  // Special test command to dump storage contents
  if (message.action === 'DUMP_STORAGE') {
    chrome.storage.local.get(null, (result) => {
      console.log('Full storage dump:', result);
      sendResponse({ storage: result });
    });
    return true;
  }

  // Handle other message types here
  return false; // No async response expected
}

function handleGetToken(sendResponse: (response: any) => void): void {
  chrome.storage.local.get(['tokenData'], (result) => {
    console.log('GET_TOKEN - Storage lookup result:', result);
    
    if (result.tokenData) {
      const tokenData = result.tokenData as TokenData;
      
      // Check if token is expired
      if (tokenData.expiresAt && Date.now() >= tokenData.expiresAt) {
        console.log('Stored token is expired');
        sendResponse({ token: null });
      } else {
        console.log('Returning stored token (first 10 chars):', tokenData.token.substring(0, 10) + '...');
        sendResponse({ 
          token: tokenData.token,
          expiresAt: tokenData.expiresAt,
          refreshToken: tokenData.refreshToken
        });
      }
    } else {
      // Try fallback to older storage format
      chrome.storage.local.get(['nanoToken'], (oldResult) => {
        if (oldResult.nanoToken) {
          console.log('Found token in older storage format');
          
          // Convert to new format
          const tokenData: TokenData = {
            token: oldResult.nanoToken,
            expiresAt: Date.now() + 3600000 // Default 1 hour expiry
          };
          
          // Store in new format for future use
          chrome.storage.local.set({ tokenData }, () => {
            console.log('Migrated token to new format');
          });
          
          sendResponse({ 
            token: tokenData.token,
            expiresAt: tokenData.expiresAt
          });
        } else {
          console.log('No token found in storage');
          sendResponse({ token: null });
        }
      });
    }
  });
}

function handleStoreToken(message: any, sendResponse: (response: any) => void): void {
  if (!message.token || typeof message.token !== 'string') {
    console.error('Invalid token received:', message.token);
    sendResponse({ success: false, error: 'Invalid token' });
    return;
  }

  console.log('Storing token (first 10 chars):', message.token.substring(0, 10) + '...');

  const tokenData: TokenData = {
    token: message.token,
    expiresAt: message.expiresAt || (Date.now() + 3600000), // Default 1 hour expiry
    refreshToken: message.refreshToken
  };

  chrome.storage.local.set({ tokenData }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to store token:', chrome.runtime.lastError);
      sendResponse({ success: false, error: chrome.runtime.lastError.message });
    } else {
      console.log('Token stored successfully');
      
      // Also store in old format for backward compatibility
      chrome.storage.local.set({ nanoToken: message.token });
      
      // Notify all active tabs about the token update
      broadcastTokenUpdate(tokenData.token);
      
      sendResponse({ success: true });
    }
  });
}

function handleValidateToken(message: any, sendResponse: (response: any) => void): void {
  // Basic token validation
  const isValid = message.token && 
                  typeof message.token === 'string' && 
                  message.token.split('.').length === 3;
  
  sendResponse({ isValid });
}

function broadcastTokenUpdate(token: string): void {
  // Find all tabs that might need the token
  chrome.tabs.query({ url: '*://canopymortgage.nanolos.com/*' }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        try {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'TOKEN_UPDATED',
            token
          });
        } catch (error) {
          // Ignore errors for tabs without content scripts
        }
      }
    }
  });
}

// Initialize the background service
initialize();

// Remove export for service worker compatibility
export {}; 