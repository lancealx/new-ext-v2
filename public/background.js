/**
 * Background script for Nano LOS Extension
 * Handles token management and communication between popup and content scripts
 */

let currentToken = null;
let tokenData = null;

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Nano LOS Extension installed');
  
  // Create a test token for development
  createTestToken();
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  console.log('Message type:', typeof request);
  console.log('Message action:', request?.action);
  
  // Handle cases where request might be undefined or invalid
  if (!request || typeof request !== 'object') {
    console.error('Invalid message received:', request);
    sendResponse({ success: false, error: 'Invalid message format' });
    return;
  }
  
  switch (request.action) {
    case 'getToken':
      console.log('Handling getToken request');
      handleGetToken(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'getDebugInfo':
      console.log('Handling getDebugInfo request');
      handleGetDebugInfo(sendResponse);
      return true;
      
    case 'storeToken':
      console.log('Handling storeToken request');
      handleStoreToken(request.token, request.tokenData, sendResponse);
      return true;
      
    case 'updateToken':
      console.log('Handling updateToken request');
      handleUpdateToken(request.token, sendResponse);
      return true;
      
    default:
      console.log('Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
      return false; // No async response
  }
});

// Handle token retrieval requests
async function handleGetToken(sendResponse) {
  try {
    console.log('handleGetToken called');
    
    // First try to get from memory
    if (currentToken && typeof currentToken === 'string' && isTokenValid(currentToken)) {
      console.log('Returning cached token');
      sendResponse({ success: true, token: currentToken });
      return;
    }
    
    // Try to get from chrome storage
    console.log('Getting token from storage...');
    const result = await getStorageData();
    console.log('Storage result:', result);
    
    if (result.tokenData && result.tokenData.token) {
      const token = result.tokenData.token;
      console.log('Found token in tokenData, checking validity...');
      
      if (typeof token === 'string' && isTokenValid(token)) {
        currentToken = token;
        tokenData = result.tokenData;
        console.log('Token retrieved from storage and cached');
        sendResponse({ success: true, token });
        return;
      } else {
        console.log('Stored token is invalid or expired');
      }
    }
    
    // Try legacy formats
    if (result.nanoToken) {
      console.log('Found legacy nanoToken, checking validity...');
      if (typeof result.nanoToken === 'string' && isTokenValid(result.nanoToken)) {
        currentToken = result.nanoToken;
        console.log('Token retrieved from legacy storage');
        sendResponse({ success: true, token: result.nanoToken });
        return;
      }
    }
    
    console.log('No valid token found anywhere');
    sendResponse({ success: false, error: 'No valid token found' });
    
  } catch (error) {
    console.error('Error getting token:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle debug info requests
async function handleGetDebugInfo(sendResponse) {
  try {
    const result = await getStorageData();
    
    const debugInfo = {
      tokenInfo: {
        hasCurrentToken: !!currentToken,
        currentTokenLength: currentToken ? currentToken.length : 0,
        tokenValid: currentToken ? isTokenValid(currentToken) : false,
        tokenExpiry: tokenData ? new Date(tokenData.expiresAt).toISOString() : null
      },
      storage: result
    };
    
    sendResponse({ success: true, ...debugInfo });
  } catch (error) {
    console.error('Error getting debug info:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle token storage requests
async function handleStoreToken(token, data, sendResponse) {
  try {
    const storageData = { tokenData: data || { token, expiresAt: Date.now() + 3600000 } };
    
    await setStorageData(storageData);
    
    currentToken = token;
    tokenData = storageData.tokenData;
    
    console.log('Token stored successfully');
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error storing token:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle token updates
function handleUpdateToken(token, sendResponse) {
  if (token && typeof token === 'string') {
    currentToken = token;
    console.log('Token updated in memory');
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false, error: 'Invalid token' });
  }
}

// Create a test token for development
function createTestToken() {
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTU3MjQ5MDIyfQ.4Adcj3UFYzPUVaVF43FmMab6RmFDRrOQJ2yoqPri1PU";
  
  const testTokenData = {
    token: testToken,
    expiresAt: Date.now() + 3600000, // 1 hour from now
    refreshToken: "sample-refresh-token"
  };
  
  chrome.storage.local.set({ tokenData: testTokenData }, () => {
    console.log('Test token created and stored');
    currentToken = testToken;
    tokenData = testTokenData;
  });
}

// Utility function to check if token is valid (not expired)
function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  
  try {
    // Basic JWT validation - decode payload
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    }
    
    // If no expiration, consider it valid (let API handle it)
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
}

// Promise wrapper for chrome.storage.local.get
function getStorageData(keys = null) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

// Promise wrapper for chrome.storage.local.set
function setStorageData(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

// Initialize background script
console.log('Nano LOS Extension background script loaded'); 