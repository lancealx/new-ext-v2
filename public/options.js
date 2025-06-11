// Options page script for Nano LOS Extension

// Save options to chrome.storage
function saveOptions() {
  const defaultRole = document.getElementById('default-role').value;
  const userFilter = document.getElementById('user-filter').value;
  const theme = document.getElementById('theme').value;
  const autoRefresh = document.getElementById('auto-refresh').checked;
  const refreshInterval = parseInt(document.getElementById('refresh-interval').value);
  const maxLoans = parseInt(document.getElementById('max-loans').value);
  
  chrome.storage.local.set({
    userPreferences: {
      defaultRole,
      selectedUser: userFilter,
      theme
    },
    dashboardConfig: {
      refreshInterval,
      maxLoansPerColumn: maxLoans,
      autoRefresh
    }
  }, () => {
    // Show success message
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = 'Options saved successfully!';
    statusMessage.classList.add('success');
    statusMessage.style.display = 'block';
    
    // Hide message after 3 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  });
}

// Restore options from chrome.storage
function restoreOptions() {
  chrome.storage.local.get({
    userPreferences: {
      defaultRole: 'LoanOfficer',
      selectedUser: 'current',
      theme: 'system'
    },
    dashboardConfig: {
      refreshInterval: 300000,
      maxLoansPerColumn: 50,
      autoRefresh: true
    }
  }, (items) => {
    // Set form values from stored preferences
    document.getElementById('default-role').value = items.userPreferences.defaultRole;
    document.getElementById('user-filter').value = items.userPreferences.selectedUser;
    document.getElementById('theme').value = items.userPreferences.theme;
    document.getElementById('auto-refresh').checked = items.dashboardConfig.autoRefresh;
    document.getElementById('refresh-interval').value = items.dashboardConfig.refreshInterval;
    document.getElementById('max-loans').value = items.dashboardConfig.maxLoansPerColumn;
  });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save-options').addEventListener('click', saveOptions); 