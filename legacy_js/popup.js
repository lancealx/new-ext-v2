// --- Share Token with popup.js ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'shareToken') {
      const token = request.token;
      console.log('Received token from content.js:', token);
    }
  });
  
  
  
  
  document.getElementById('copyToken').addEventListener('click', function() {
    const copyButton = document.getElementById('copyToken');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            function: getTokenFromLocalStorage
        }, (results) => {
            if (results && results.length > 0) {
                const token = results[0].result;
                if (token) {
                    navigator.clipboard.writeText(token).then(function() {
                        // Provide feedback to the user
                        copyButton.innerText = 'Done!';
                        
                    }, function(err) {
                        console.error('Could not copy text:', err);
                    });
                }
            }
        });
    });
  });
  
  
  
  
  
  document.getElementById('searchPipelineBtn').addEventListener('click', () => {
    const firstName = document.getElementById('searchFirstName').value.trim();
    const lastName = document.getElementById('searchLastName').value.trim();
    const appId = document.getElementById('searchAppId').value.trim();
    const resultsContainer = document.getElementById('searchResultsContainer');
    const resultsBody = document.getElementById('searchResultsBody');
  
    // Show container and set "Searching..." message immediately
    resultsContainer.style.display = 'block';
    resultsBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Searching...</td></tr>';
  
    // --- Get Auth Token ---
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            resultsBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error: Could not get active tab.</td></tr>';
            resultsContainer.style.display = 'block'; // Show error
            return;
        }
        const activeTab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: getTokenFromLocalStorage // Use existing function
        }, (results) => {
            if (chrome.runtime.lastError) {
                 console.error("Scripting Error:", chrome.runtime.lastError.message);
                 resultsBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${chrome.runtime.lastError.message}</td></tr>`;
                 resultsContainer.style.display = 'block';
                 return;
            }
            if (results && results.length > 0 && results[0].result) {
                const token = results[0].result;
                fetchPipelineData(token, firstName, lastName, appId);
            } else {
                console.error('Could not retrieve auth token from local storage.');
                resultsBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error: Could not get auth token. Make sure you are logged in.</td></tr>';
                resultsContainer.style.display = 'block'; // Show error
            }
        });
    });
  });
  
  function fetchPipelineData(token, firstName, lastName, appId) {
    const resultsContainer = document.getElementById('searchResultsContainer');
    const resultsBody = document.getElementById('searchResultsBody');
  
    // Construct the API URL (Ensure base URL is correct)
    const baseUrl = "https://api.nanolos.com/nano/app-query-details";
    const params = new URLSearchParams({
        appId: appId,
        city: '', // Add other potential filter fields if needed, leave empty if not used
        classification: '',
        communicationMethod: '',
        firstName: firstName,
        lastName: lastName,
        roleId: '',
        state: '',
        street: '',
        userId: '',
        zipCode: ''
    });
    const apiUrl = `${baseUrl}?${params.toString()}`;
  
    console.log("Fetching:", apiUrl); // Log the URL for debugging
  
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'accept': 'application/vnd.api+json',
            'authorization': `Bearer ${token}`,
            // Add other necessary headers based on the curl command if required
            // 'origin': 'https://canopymortgage.nanolos.com', // Might be needed depending on CORS policy
        }
    })
    .then(response => {
        console.log("API Response Status:", response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("API Data:", data); // Log the received data
        resultsBody.innerHTML = ''; // Clear "Searching..." or previous results
  
        if (data && data.data && data.data.length > 0) {
            data.data.forEach(item => {
                const attributes = item.attributes;
                const id = item.id || 'N/A';
                const name = `${attributes['first-name'] || ''} ${attributes['last-name'] || ''}`.trim() || 'N/A';
                // Format date nicely, handle nulls
                let closingDate = attributes['closing-date'];
                if (closingDate) {
                    try {
                        closingDate = new Date(closingDate + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC' }); // Adjust timezone if needed
                    } catch (e) {
                        console.warn("Error parsing date:", attributes['closing-date']);
                        closingDate = attributes['closing-date']; // Show raw if parsing fails
                    }
                } else {
                    closingDate = 'N/A';
                }
                const classification = attributes.classification || 'N/A';
  
                const row = document.createElement('tr');
                // Make row clickable
                row.style.cursor = 'pointer';
                const targetUrl = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${id}`;
                row.addEventListener('click', () => {
                    chrome.tabs.create({ url: targetUrl });
                });
  
                row.innerHTML = `
                    <td class="text-primary">${id}</td>
                    <td>${name}</td>
                    <td>${closingDate}</td>
                    <td>${classification}</td>
                `;
                resultsBody.appendChild(row);
            });
            resultsContainer.style.display = 'block'; // Show results table
        } else {
            resultsBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No results found.</td></tr>';
            resultsContainer.style.display = 'block'; // Show "No results" message
        }
    })
    .catch(error => {
        console.error('Error fetching pipeline data:', error);
        resultsBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${error.message}</td></tr>`;
        resultsContainer.style.display = 'block'; // Show error message
    });
  }
  
  
  // --- Existing getTokenFromLocalStorage function ---
  function getTokenFromLocalStorage() {
    // This function executes in the context of the web page
    try {
        const authDataRaw = localStorage.getItem('ember_simple_auth-session');
        if (!authDataRaw) return null; // Handle case where item doesn't exist
        const authData = JSON.parse(authDataRaw);
        // Adjust the path based on actual structure if needed
        return authData?.authenticated?.idToken || null; 
    } catch (e) {
        console.error("Error accessing local storage or parsing auth data:", e);
        return null;
    }
  }
  
  // --- Initial setup ---
  document.addEventListener('DOMContentLoaded', function() {
    // Hide results initially
    const resultsContainer = document.getElementById('searchResultsContainer');
    if (resultsContainer) { // Check if element exists before trying to style it
         resultsContainer.style.display = 'none';
    } else {
        console.error("searchResultsContainer not found on DOMContentLoaded");
    }
    
    // --- Add Enter key listener to search inputs ---
    const searchInputs = [
        document.getElementById('searchFirstName'),
        document.getElementById('searchLastName'),
        document.getElementById('searchAppId')
    ];
    const searchButton = document.getElementById('searchPipelineBtn');
  
    searchInputs.forEach(input => {
        if (input && searchButton) { // Check if elements exist
            input.addEventListener('keydown', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Prevent default form submission (if applicable)
                    searchButton.click(); // Trigger the search button click
                }
            });
        } else {
            if (!input) console.error("A search input field was not found");
            if (!searchButton) console.error("Search button not found");
        }
    });
  
    // --- App ID Quick Open Button Logic ---
    const appIdInput = document.getElementById('searchAppId');
    const openLoanButton = document.getElementById('openQuickLoan');
  
    if (appIdInput && openLoanButton) {
      appIdInput.addEventListener('input', function() {
        const appIdValue = this.value.trim();
        const sixDigitRegex = /^\d{6}$/;
  
        if (sixDigitRegex.test(appIdValue)) {
          openLoanButton.textContent = `Open ${appIdValue}`;
          openLoanButton.style.display = 'block';
  
          // Remove previous listener to avoid duplicates if any
          const newButton = openLoanButton.cloneNode(true);
          openLoanButton.parentNode.replaceChild(newButton, openLoanButton);
          
          // Add the click listener to the new button instance
          document.getElementById('openQuickLoan').addEventListener('click', () => {
            const targetUrl = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${appIdValue}`;
            chrome.tabs.create({ url: targetUrl });
          });
  
        } else {
          openLoanButton.style.display = 'none';
          // Optional: remove listener when hidden? Cloning above handles this.
        }
      });
    } else {
      if (!appIdInput) console.error("searchAppId input not found for quick open logic.");
      if (!openLoanButton) console.error("openQuickLoan button not found.");
    }
  
    // --- Existing Version Display Logic ---
    const versionElement = document.getElementById('copyToken');
    if (versionElement) {
        fetch(chrome.runtime.getURL('manifest.json'))
            .then(response => response.json())
            .then(manifest => {
                versionElement.textContent = `Version: ${manifest.version}`;
            })
            .catch(error => console.error('Error fetching manifest:', error));
    } else {
        console.error("copyToken element not found for version display");
    }
  
    // --- Other existing event listeners (ensure they don't conflict) ---
    // Make sure IDs used here still exist in popup.html
    const composeBtn = document.getElementById('composeEmail');
    if (composeBtn) {
        composeBtn.addEventListener('click', handleComposeEmail); // Renamed handler
    }
  
    const sendEmailBtn = document.getElementById('sendEmail');
    if(sendEmailBtn) {
        sendEmailBtn.addEventListener('click', handleSendEmail); // Renamed handler
    }
  
    // Add other initializations if necessary
  
  }); // End DOMContentLoaded
  
  // --- Refactored existing functions to avoid redeclaration ---
  function handleComposeEmail() {
    const to = document.getElementById("to").value;
    const subject = document.getElementById("subject").value;
    const body = document.getElementById("body").value;
  
    console.log('Compose button clicked. Preparing to create draft.');
  
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      if (token) {
        console.log('Received OAuth token:', token);
        createGmailDraft(token, to, subject, body);
      } else {
        console.error('Failed to obtain OAuth token.');
        alert('Could not get Gmail auth token. Please ensure you are logged into Google and have granted permissions.'); // User feedback
      }
    });
  }
  
  function handleSendEmail() {
     // Assuming extractedData is defined globally or fetched elsewhere
     // For now, using the placeholder data as example
     const extractedData = {
        'Sales Price': 300000, 'Base Loan Amount': 250000, 'LTV': 0.83,
        'Loan Product': 'Fixed Rate', 'Credit Score': 720, 'Front Ratio': 0.35,
        'Back Ratio': 0.45, 'Rate': 3.5, 'Lock Expiration Date': '2023-12-31',
        'Total Assets': 50000, 'Cash To Close': 10000, 'Reserves': 20000,
        'Appraisal Order 1 Status': 'Completed', 'Appraisal Order 1 Market Value': 310000,
        'Closing Date': '2023-11-30'
    };
    const mailtoLink = createMailtoLink(extractedData);
    // Using chrome.tabs.create for better control in extensions
    chrome.tabs.create({ url: mailtoLink });
  }
  
  
  // --- Existing helper functions (ensure they are defined only once) ---
  
  // Function to create mailto link
  function createMailtoLink(extractedData) {
    const subject = 'Loan Details';
    // Using template literals for cleaner multiline strings
    const body = `
  Sales Price: ${formatCurrency(extractedData['Sales Price'])}
  Base Loan Amount: ${formatCurrency(extractedData['Base Loan Amount'])}
  LTV: ${formatPercentage(extractedData['LTV'] * 100)}
  Loan Product: ${extractedData['Loan Product']}
  Credit Score: ${extractedData['Credit Score']}
  Ratios: ${formatPercentage(extractedData['Front Ratio'] * 100)} | ${formatPercentage(extractedData['Back Ratio'] * 100)}
  Rate: ${formatPercentage3(extractedData['Rate'])}
  Lock Expiration Date: ${formatDate(extractedData['Lock Expiration Date'])}
  Total Assets: ${formatCurrency(extractedData['Total Assets'])}
  Cash To Close: ${formatCurrency(extractedData['Cash To Close'])}
  Reserves: ${formatCurrency(extractedData['Reserves'])}
  Appraisal Status: ${extractedData['Appraisal Order 1 Status']}
  Appraisal Market Value: ${formatCurrency(extractedData['Appraisal Order 1 Market Value'])}
  Closing Date: ${formatDate(extractedData['Closing Date'])}
    `.trim().replace(/^\s+/gm, ''); // Trim leading whitespace from each line
  
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return mailtoLink;
  }
  
  // Function to format currency
  function formatCurrency(value) {
    if (typeof value !== 'number') return 'N/A'; // Basic type check
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; // Use toLocaleString for better formatting
  }
  
  // Function to format percentage
  function formatPercentage(value) {
     if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(2)}%`;
  }
  
  // Function to format percentage with 3 decimal places
  function formatPercentage3(value) {
     if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(3)}%`;
  }
  
  // Function to format date
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        // Assuming dateString is YYYY-MM-DD. Add time and specify UTC to avoid timezone issues.
        const d = new Date(dateString + 'T00:00:00Z');
        // Check if date is valid after parsing
        if (isNaN(d.getTime())) {
             throw new Error('Invalid Date');
        }
        return d.toLocaleDateString('en-US', { timeZone: 'UTC' }); // Use UTC consistently
    } catch (e) {
        console.warn("Error formatting date:", dateString, e);
        return dateString; // Return original string if formatting fails
    }
  }
  
  // Function to create Gmail Draft
  function createGmailDraft(token, to, subject, htmlContent) {
    const url = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";
  
    // Create email in MIME format
     const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlContent // HTML content directly here
    ];
    // Note: 'From' is usually set by Gmail automatically based on the authenticated user
  
    const emailContent = emailLines.join("\n");
  
    console.log('Preparing email content for draft.');
  
    try {
        // Encode the email to base64 URL safe
        const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
  
        console.log('Base64 encoded email prepared.');
  
        fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: {
                    raw: base64EncodedEmail
                }
            })
        })
        .then(response => {
            console.log('Gmail Draft API Response status:', response.status);
            if (!response.ok) {
                // Log detailed error from Gmail API if possible
                return response.json().then(errData => {
                    console.error("Gmail API Error Details:", errData);
                    throw new Error(`Gmail API Error: ${response.status} ${response.statusText}`);
                }).catch(() => {
                    // Fallback if error response isn't JSON
                     throw new Error(`Gmail API Error: ${response.status} ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Full response from Gmail API:", JSON.stringify(data, null, 2));
            if (data.id) { // Draft response has 'id' at the top level for the draft itself
                const draftId = data.id;
                // Option 1: Just notify user
                // alert(`Draft created successfully! (ID: ${draftId})`);
  
                // Option 2: Try to open it (Gmail URL structure might change)
                // The URL format using message.id seems more reliable if available
                 const messageId = data.message?.id;
                 if (messageId) {
                     const draftUrl = `https://mail.google.com/mail/u/0/#drafts?compose=${messageId}`;
                     console.log("Opening draft URL:", draftUrl);
                     chrome.tabs.create({ url: draftUrl });
                 } else {
                    console.warn("Draft created, but message ID not found in response. Cannot open directly.");
                     alert(`Draft created successfully! (ID: ${draftId})`); // Fallback notification
                 }
  
            } else {
                console.error('Failed to create draft or response format unexpected:', data);
                alert('Failed to create Gmail draft. Check console for details.');
            }
        })
        .catch(error => {
            console.error('Error during draft creation fetch:', error);
            alert(`Error creating Gmail draft: ${error.message}`);
        });
  
    } catch (e) {
        console.error("Error encoding email content:", e);
         alert("Error preparing email content.");
    }
  }
  
  // --- Final Check ---
  console.log("popup.js finished loading and setting up listeners.");
  
  
  