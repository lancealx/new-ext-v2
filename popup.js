/**
 * Modern Nano LOS Extension Popup
 * Uses shadcn-inspired UI components and real token integration
 */

class NanoLOSPopup {
  constructor() {
    this.token = null;
    this.isSearching = false;
    this.initializeElements();
    this.bindEvents();
    this.initializeApp();
  }

  initializeElements() {
    // Status elements
    this.statusEl = document.getElementById('status');
    this.versionEl = document.getElementById('version');
    
    // Search form elements
    this.firstNameEl = document.getElementById('firstName');
    this.lastNameEl = document.getElementById('lastName');
    this.appIdEl = document.getElementById('appId');
    this.addressEl = document.getElementById('address');
    this.phoneEl = document.getElementById('phone');
    this.emailEl = document.getElementById('email');
    this.searchBtn = document.getElementById('searchBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.searchTextEl = document.getElementById('searchText');
    this.searchLoadingEl = document.getElementById('searchLoading');
    
    // Quick open elements
    this.quickOpenEl = document.getElementById('quickOpen');
    this.quickOpenBtn = document.getElementById('quickOpenBtn');
    
    // Results elements
    this.resultsCardEl = document.getElementById('resultsCard');
    this.resultsContentEl = document.getElementById('resultsContent');
  }

  bindEvents() {
    // Search functionality
    this.searchBtn.addEventListener('click', () => this.handleSearch());
    this.clearBtn.addEventListener('click', () => this.handleClear());
    
    // Enter key support for search inputs
    [this.firstNameEl, this.lastNameEl, this.appIdEl, this.addressEl, this.phoneEl, this.emailEl].forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch();
        }
      });
    });
    
    // App ID quick open functionality
    this.appIdEl.addEventListener('input', () => this.handleAppIdInput());
    this.quickOpenBtn.addEventListener('click', () => this.handleQuickOpen());
    
    // Version click to copy token
    this.versionEl.addEventListener('click', () => this.handleVersionClick());
    
    // Right-click version for debug info
    this.versionEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showDebugInfo();
    });
  }

  async initializeApp() {
    await this.loadVersion();
    await this.checkTokenStatus();
  }

  async loadVersion() {
    try {
      const manifest = await this.fetchManifest();
      this.versionEl.textContent = `v${manifest.version}`;
    } catch (error) {
      console.error('Error loading version:', error);
      this.versionEl.textContent = 'v1.0.0';
    }
  }

  async fetchManifest() {
    const response = await fetch(chrome.runtime.getURL('manifest.json'));
    return response.json();
  }

  async checkTokenStatus() {
    try {
      const response = await this.sendMessage({ type: 'GET_TOKEN' });
      
      if (response.token) {
        this.token = response.token;
        this.updateStatus('connected', '✅', 'Connected to Nano LOS');
      } else {
        this.updateStatus('disconnected', '⚠️', 'No token available');
        console.log('No token available:', response.error);
      }
    } catch (error) {
      console.error('Error checking token status:', error);
      this.updateStatus('disconnected', '❌', 'Connection failed');
    }
  }

  updateStatus(type, icon, message) {
    this.statusEl.className = `status-indicator status-${type}`;
    this.statusEl.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  }

  async handleSearch() {
    if (this.isSearching) return;
    
    const firstName = this.firstNameEl.value.trim();
    const lastName = this.lastNameEl.value.trim();
    const appId = this.appIdEl.value.trim();
    const address = this.addressEl.value.trim();
    const phone = this.phoneEl.value.trim();
    const email = this.emailEl.value.trim();
    
    if (!firstName && !lastName && !appId && !address && !phone && !email) {
      this.showError('Please enter at least one search criteria');
      return;
    }
    
    if (!this.token) {
      this.showError('No authentication token available. Please log in to Nano LOS.');
      return;
    }
    
    this.setSearching(true);
    this.showResults('Searching...');
    
    try {
      const results = await this.searchLoans(firstName, lastName, appId, address, phone, email);
      this.displayResults(results);
    } catch (error) {
      console.error('Search error:', error);
      this.showError(`Search failed: ${error.message}`);
    } finally {
      this.setSearching(false);
    }
  }

  async searchLoans(firstName, lastName, appId, address, phone, email) {
    const baseUrl = 'https://api.nanolos.com/nano/app-query-details';
    
    // Determine communicationMethod value (phone or email)
    let communicationMethod = '';
    if (phone) {
      communicationMethod = phone;
    } else if (email) {
      communicationMethod = email;
    }
    
    const params = new URLSearchParams({
      appId: appId || '',
      city: '',
      classification: '',
      communicationMethod: communicationMethod,
      firstName: firstName || '',
      lastName: lastName || '',
      roleId: '',
      state: '',
      street: address || '',
      userId: '',
      zipCode: ''
    });
    
    const url = `${baseUrl}?${params.toString()}`;
    console.log('Searching:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/vnd.api+json',
        'authorization': `Bearer ${this.token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  }

  displayResults(results) {
    if (!results || results.length === 0) {
      this.showResults(`
        <div class="text-center text-muted py-8">
          <p>No loans found matching your search criteria.</p>
          <p class="text-xs mt-2">Try adjusting your search terms or checking the spelling.</p>
        </div>
      `);
      return;
    }
    
    const tableRows = results.map(item => {
      const attrs = item.attributes;
      const id = item.id || 'N/A';
      const name = `${attrs['first-name'] || ''} ${attrs['last-name'] || ''}`.trim() || 'N/A';
      const closingDate = this.formatDate(attrs['closing-date']);
      const classification = attrs.classification || 'N/A';
      
      return `
        <tr data-loan-id="${id}" class="loan-row cursor-pointer hover:bg-muted">
          <td class="text-primary font-medium">${id}</td>
          <td>${name}</td>
          <td>${closingDate}</td>
          <td>${classification}</td>
        </tr>
      `;
    }).join('');
    
    this.showResults(`
      <table class="results-table">
        <thead>
          <tr>
            <th>App ID</th>
            <th>Name</th>
            <th>Closing Date</th>
            <th>Classification</th>
          </tr>
        </thead>
        <tbody id="resultsTableBody">
          ${tableRows}
        </tbody>
      </table>
      <div class="text-xs text-muted mt-2">
        Found ${results.length} result${results.length !== 1 ? 's' : ''}. Click any row to open the loan application.
      </div>
    `);

    // Add event delegation for loan row clicks
    const tableBody = document.getElementById('resultsTableBody');
    if (tableBody) {
      tableBody.addEventListener('click', (e) => {
        const row = e.target.closest('.loan-row');
        if (row) {
          const loanId = row.getAttribute('data-loan-id');
          if (loanId && loanId !== 'N/A') {
            this.openLoan(loanId);
          }
        }
      });
    }
  }

  showResults(content) {
    this.resultsContentEl.innerHTML = content;
    this.resultsCardEl.classList.remove('hidden');
  }

  showError(message) {
    this.showResults(`
      <div class="text-center py-4">
        <div class="text-destructive font-medium mb-2">❌ ${message}</div>
        <button id="retryConnectionBtn" class="button button-outline button-sm">
          Retry Connection
        </button>
      </div>
    `);

    // Add event listener for retry button
    const retryBtn = document.getElementById('retryConnectionBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.checkTokenStatus());
    }
  }

  setSearching(searching) {
    this.isSearching = searching;
    this.searchBtn.disabled = searching;
    
    if (searching) {
      this.searchTextEl.classList.add('hidden');
      this.searchLoadingEl.classList.remove('hidden');
    } else {
      this.searchTextEl.classList.remove('hidden');
      this.searchLoadingEl.classList.add('hidden');
    }
  }

  handleClear() {
    this.firstNameEl.value = '';
    this.lastNameEl.value = '';
    this.appIdEl.value = '';
    this.addressEl.value = '';
    this.phoneEl.value = '';
    this.emailEl.value = '';
    this.resultsCardEl.classList.add('hidden');
    this.quickOpenEl.classList.add('hidden');
    this.firstNameEl.focus();
  }

  handleAppIdInput() {
    const appId = this.appIdEl.value.trim();
    const isValidAppId = /^\d{6}$/.test(appId);
    
    if (isValidAppId) {
      this.quickOpenBtn.textContent = `Open ${appId}`;
      this.quickOpenEl.classList.remove('hidden');
    } else {
      this.quickOpenEl.classList.add('hidden');
    }
  }

  handleQuickOpen() {
    const appId = this.appIdEl.value.trim();
    if (/^\d{6}$/.test(appId)) {
      this.openLoan(appId);
    }
  }

  openLoan(appId) {
    const url = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${appId}`;
    this.openUrl(url);
  }

  openUrl(url) {
    chrome.tabs.create({ url });
  }

  async handleVersionClick() {
    if (!this.token) {
      await this.checkTokenStatus();
      if (!this.token) {
        this.showNotification('No token available to copy', 'error');
        return;
      }
    }
    
    try {
      await navigator.clipboard.writeText(this.token);
      this.showNotification('Token copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy token:', error);
      this.showNotification('Failed to copy token', 'error');
    }
  }

  async showDebugInfo() {
    try {
      const response = await this.sendMessage({ type: 'DUMP_STORAGE' });
      
      const debugContent = `
        <div class="space-y-4">
          <div>
            <h5 class="font-medium mb-2">Storage Contents</h5>
            <pre class="text-xs bg-muted p-2 rounded overflow-auto">${JSON.stringify(response.storage, null, 2)}</pre>
          </div>
          <button id="closeDebugBtn" class="button button-outline w-full">
            Close Debug Info
          </button>
        </div>
      `;
      
      this.showResults(debugContent);

      // Add event listener for close debug button
      const closeBtn = document.getElementById('closeDebugBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideDebugInfo());
      }
    } catch (error) {
      console.error('Failed to get debug info:', error);
      this.showError('Failed to load debug information');
    }
  }

  hideDebugInfo() {
    this.resultsCardEl.classList.add('hidden');
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString + 'T00:00:00Z');
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      
      return date.toLocaleDateString('en-US', { 
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString;
    }
  }

  showNotification(message, type = 'info') {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-3 rounded-md text-sm font-medium z-50 ${
      type === 'success' ? 'bg-green-100 text-green-800' : 
      type === 'error' ? 'bg-red-100 text-red-800' : 
      'bg-blue-100 text-blue-800'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  sendMessage(message) {
    console.log('Popup sending message:', message);
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        console.log('Popup received response:', response);
        console.log('Runtime last error:', chrome.runtime.lastError);
        
        if (chrome.runtime.lastError) {
          const error = new Error(chrome.runtime.lastError.message);
          console.error('Chrome runtime error:', error);
          reject(error);
        } else if (!response) {
          const error = new Error('No response received from background script');
          console.error('No response error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.nanoPopup = new NanoLOSPopup();
});

// Make it globally accessible for inline event handlers
window.nanoPopup = null; 