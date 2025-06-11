# 🏦 Nano LOS Pipeline Pro Chrome Extension

A modern, enterprise-grade Chrome extension for Canopy Mortgage's Nano LOS platform featuring real-time token extraction, advanced search capabilities, and seamless API integration.

![Extension Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)
![Manifest](https://img.shields.io/badge/Manifest-v3-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

## ✨ Key Features

### 🔐 **Real Token Extraction**
- Automatic JWT token extraction from `ember_simple_auth-session` localStorage
- Token validation and expiration checking
- Cross-tab synchronization
- Fallback support for legacy token formats

### 🎨 **Modern UI Design**
- **shadcn-inspired** popup interface with card-based layout
- Real-time status indicators with visual feedback
- Loading states and smooth animations
- Content Security Policy (CSP) compliant

### 🔍 **Advanced Search**
- **Live Nano API Integration**: Direct connection to `https://api.nanolos.com/nano/app-query-details`
- **Multiple Search Options**: First name, last name, or 6-digit application ID
- **Quick Open**: Instant loan application access for valid app IDs
- **Click-to-Open**: Results table with direct loan navigation

### ⚡ **Smart Functionality**
- **Version Click**: Copy JWT token to clipboard instantly
- **Debug Mode**: Right-click version for storage inspection overlay
- **Auto-Retry**: Intelligent connection retry mechanisms
- **URL Monitoring**: Automatic token refresh on page navigation

## 🏗️ Architecture

### **Content Script** (`src/extension/content/content.ts`)
```typescript
// Real token extraction using proven legacy method
const authDataRaw = localStorage.getItem('ember_simple_auth-session');
const authData = JSON.parse(authDataRaw);
const token = authData?.authenticated?.idToken;
```

### **Background Script** (`public/background.js`)
- Token caching and validation
- Cross-script communication hub
- Automatic test token creation for development
- Promise-based storage operations

### **Popup Interface** (`public/popup.js`)
- Modern class-based architecture
- Event delegation (no inline handlers)
- Comprehensive error handling
- Real-time search with loading states

## 🚀 Quick Start

### **Installation**
1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load the `dist/` folder in Chrome extensions (Developer mode)

### **Development**
```bash
# Install dependencies
npm install

# Build extension
npm run build

# Watch for changes (if needed)
npm run dev
```

### **Testing**
1. Navigate to `https://canopymortgage.nanolos.com/`
2. Log in with your credentials
3. Open the extension popup
4. Verify "Connected to Nano LOS" status
5. Test search functionality

## 📁 Project Structure

```
├── src/                          # TypeScript source files
│   ├── extension/
│   │   ├── content/content.ts    # Token extraction & monitoring
│   │   └── background/           # Service worker logic
│   ├── services/
│   │   └── tokenService.ts      # Token management utilities
│   └── types/index.ts           # TypeScript definitions
├── public/                       # Static assets & compiled scripts
│   ├── manifest.json            # Chrome extension manifest v3
│   ├── popup.html              # Extension popup interface
│   ├── popup.js                # Popup logic & API integration
│   └── background.js           # Service worker script
├── scripts/                     # Build automation
│   ├── create-icons.js         # Icon generation
│   └── move-scripts.js         # Build file organization
├── dist/                        # Compiled extension (ready for Chrome)
└── legacy_js/                  # Reference implementation
```

## 🔧 Technical Implementation

### **Token Management**
- **Storage Format**: `ember_simple_auth-session` localStorage key
- **Validation**: JWT expiration checking via payload.exp
- **Sync**: Real-time updates across tabs and windows
- **Security**: No token storage in extension storage unless necessary

### **API Integration**
```javascript
// Search endpoint with Bearer authentication
const response = await fetch('https://api.nanolos.com/nano/app-query-details?' + params, {
  headers: {
    'accept': 'application/vnd.api+json',
    'authorization': `Bearer ${token}`
  }
});
```

### **Build Process**
1. **Icon Generation**: Automatic placeholder PNG creation
2. **TypeScript Compilation**: ES2020 target for service worker compatibility
3. **File Organization**: Smart script placement and import resolution
4. **Manifest v3 Compliance**: Proper permissions and CSP handling

## 🛡️ Security & Compliance

### **Content Security Policy**
- No inline event handlers (`onclick` attributes)
- Proper event delegation and listeners
- Script integrity via proper imports

### **Permissions**
```json
{
  "permissions": ["storage", "activeTab", "scripting", "background"],
  "host_permissions": [
    "https://canopymortgage.nanolos.com/*",
    "https://api.nanolos.com/*"
  ]
}
```

### **Token Security**
- Client-side only extraction
- No unnecessary network transmission
- Automatic expiration handling
- Secure clipboard operations

## 🎯 Usage Examples

### **Search by Name**
1. Enter first name: `John`
2. Enter last name: `Smith`
3. Click "Search"
4. Results show matching loans with click-to-open functionality

### **Quick App ID Access**
1. Enter 6-digit app ID: `123456`
2. "Open 123456" button appears automatically
3. Click to navigate directly to loan application

### **Token Copy**
1. Click the version number in popup
2. JWT token copied to clipboard
3. "Token copied!" notification appears

### **Debug Information**
1. Right-click the version number
2. Debug overlay shows:
   - Current token status and expiry
   - Full localStorage contents
   - Connection diagnostics

## 🔄 Development Workflow

### **Making Changes**
1. Edit source files in `src/`
2. Run `npm run build`
3. Reload extension in Chrome
4. Test functionality on Nano LOS

### **Adding Features**
1. Update TypeScript files
2. Ensure CSP compliance (no inline handlers)
3. Test token extraction scenarios
4. Verify API integration

### **Debugging**
- Use Chrome DevTools on extension popup
- Check console logs in content script context
- Monitor network requests in Developer Tools
- Test token extraction in various auth states

## 📋 Troubleshooting

### **"No token available"**
- Ensure you're logged into Nano LOS
- Check that `ember_simple_auth-session` exists in localStorage
- Verify token hasn't expired
- Try refreshing the Nano LOS page

### **Search returns 401 errors**
- Confirm authentication status
- Check token expiration
- Verify API permissions
- Try manual token refresh

### **Content script not loading**
- Check Chrome extensions page for errors
- Verify you're on `canopymortgage.nanolos.com`
- Ensure extension has proper permissions
- Check console for script loading errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Nano LOS
5. Submit a pull request

## 📄 License

This project is proprietary software for Canopy Mortgage's internal use.

## 🏆 Key Achievements

- ✅ **Real token extraction** working with live Nano LOS
- ✅ **Modern UI** with shadcn-inspired design
- ✅ **Live API integration** with proper authentication
- ✅ **CSP compliance** and security best practices
- ✅ **Manifest v3** compatibility
- ✅ **TypeScript** architecture with proper build process
- ✅ **Error handling** and user feedback
- ✅ **Cross-tab synchronization** and monitoring

---

**Built with ❤️ for Canopy Mortgage's Nano LOS Platform**
