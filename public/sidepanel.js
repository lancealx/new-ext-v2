// Side panel script for Nano LOS Extension

document.addEventListener('DOMContentLoaded', () => {
  // Set up tab switching
  const tabs = document.querySelectorAll('.tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and content
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding content
      const tabName = tab.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // Load loans (in a real extension, this would fetch from an API)
  loadRecentLoans();
});

// Load recent loans
function loadRecentLoans() {
  // In a real implementation, this would fetch from the Nano LOS API
  // For now, we're using the static content in the HTML
  
  // Check if we have a token for authentication
  chrome.storage.local.get(['nanoToken'], (result) => {
    if (!result.nanoToken) {
      // No token, show a message
      const loanList = document.querySelector('.loan-list');
      loanList.innerHTML = `
        <p>Not connected to Nano LOS. Please log in to view your loans.</p>
      `;
    } else {
      // We have a token, in a real extension we would fetch loans here
      console.log('Token available, would fetch loans in a real implementation');
    }
  });
}

// Function to search loans
function searchLoans(query) {
  // This would normally search using the Nano LOS API
  console.log('Searching for:', query);
  // For demo purposes, just show a message
  const searchTab = document.getElementById('search-tab');
  
  // Add a loading message
  const resultsDiv = document.createElement('div');
  resultsDiv.classList.add('search-results');
  resultsDiv.innerHTML = `<p>Searching for "${query}"...</p>`;
  
  // Replace any existing results
  const existingResults = searchTab.querySelector('.search-results');
  if (existingResults) {
    searchTab.replaceChild(resultsDiv, existingResults);
  } else {
    searchTab.appendChild(resultsDiv);
  }
}

// Set up search input
const searchInput = document.querySelector('#search-tab input');
if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchLoans(searchInput.value);
    }
  });
} 