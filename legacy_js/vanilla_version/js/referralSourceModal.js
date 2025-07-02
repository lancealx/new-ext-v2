// --- Referral Source Modal Search Logic ---

  function setupReferralSearchListener() {
    const searchButton = document.getElementById('searchButton');
    const modalElement = document.getElementById('referral-source-editor');
  
    // Add references to the specific input fields needed for this API
    const phoneInput = document.getElementById('phoneSearch');
    const emailInput = document.getElementById('emailSearch');
    // Other inputs might not be used directly by this specific endpoint but keep references if needed elsewhere
    const nameInput = document.getElementById('nameSearch');
    const companyInput = document.getElementById('companySearch');
  
    // Combine all relevant inputs into an array
    const searchInputs = [nameInput, companyInput, phoneInput, emailInput];

    // Basic check for required elements
    if (!searchButton || !modalElement || searchInputs.some(input => !input)) {
        console.error("Required elements for Referral search (button, modal, search inputs) not found.");
        // Log which inputs are missing if needed
        searchInputs.forEach((input, index) => {
            if (!input) console.error(`Search input at index ${index} is missing.`);
        });
        return;
    }

    // --- Add Enter key listener to search inputs ---
    searchInputs.forEach(input => {
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission behavior
                searchButton.click(); // Trigger the search button click
            }
        });
    });

    // --- Existing Search Button Click Listener ---
    searchButton.addEventListener('click', async () => {
      // 1. Get App ID 
        const appId = modalElement.dataset.appId;
  
        // 2. Get Required Search Criteria for Providers API
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const name = nameInput.value.trim(); 
        const company = companyInput.value.trim(); 

      // --- ADD CHECK FOR EMPTY INPUTS ---
      if (!phone && !email && !name && !company) {
          alert("Please enter at least one search criterion (Name, Company, Phone, or Email).");
          return; // Stop execution if all fields are empty
      }
      // --- END CHECK ---
  
        // 3. Get Auth Token 
        const token = window.token;
        if (!token) {
            alert("Error: Authentication token is missing. Cannot perform search.");
            return;
        }
  
        // 4. Construct API Call for Providers endpoint
      const baseUrl = "https://api.nanolos.com/nano/providers"; 
      const params = new URLSearchParams(); 
  
        // Conditionally append parameters
        if (company) {
             params.append('companyNames[]', company);
        }
        if (email) {
            params.append('email', email); 
        }
      params.append('isActive', 'true'); 
        params.append('licensedState', '');
        params.append('organizationCode', '');
        if (phone) {
            params.append('phone', phone);
        }
      if (name) {
          params.append('primaryContacts[]', name); 
        }
        params.append('providerId', '');
        params.append('providerTypeId', '');
        params.append('state', '');
        
        const apiUrl = `${baseUrl}?${params.toString()}`;
  
        console.log("Provider Search - Fetching:", apiUrl);
  
      // 5. Execute Fetch (ensure results container exists)
      const resultsContainer = document.getElementById('providerResultsContainer');
      if (resultsContainer) {
         resultsContainer.innerHTML = '<div class="text-center p-2"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Searching...</div>';
      }

      try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'accept': 'application/vnd.api+json',
                    'authorization': `Bearer ${token}`,
                }
            });
  
            if (!response.ok) {
                let errorDetails = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetails += ` - ${JSON.stringify(errorData)}`;
                } catch (e) { /* Ignore */ }
                throw new Error(errorDetails);
            }
  
            const data = await response.json();
            console.log("Provider Search - API Data:", data);
            displayProviderResults(data.data);
  
        } catch (error) {
            console.error('Error fetching provider data:', error);
            alert(`Error during provider search: ${error.message}`);
          if (resultsContainer) {
              resultsContainer.innerHTML = `<div class="alert alert-danger p-2" role="alert">Search failed: ${error.message}</div>`;
          }
        }
    });
  }


  
  // --- Function to display provider search results ---
  function displayProviderResults(providers) {
    const resultsContainer = document.getElementById('providerResultsContainer'); 
    if (!resultsContainer) {
        console.error("Provider results container not found!");
        return;
    }
  
    resultsContainer.innerHTML = ''; // Clear previous results or loading indicator
  
    if (!providers || providers.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center text-muted p-2">No providers found matching criteria.</p>';
        return;
    }
  
    const list = document.createElement('ul');
    list.className = 'list-group list-group-flush'; 
  
    providers.forEach(provider => {
        const attributes = provider.attributes;
        const providerId = provider.id; 
  
        // Extract name
        let firstName = '';
        let lastName = '';
        const primaryContact = attributes['primary-contact'] || '';
        const nameParts = primaryContact.split(' ');
        if (nameParts.length > 0) {
            firstName = nameParts[0];
            if (nameParts.length > 1) {
                lastName = nameParts.slice(1).join(' '); 
            }
        }
        
        const company = attributes['company-name'] || 'N/A';
        const email = attributes['email'] || 'N/A';
        const phone = attributes['phone'] || 'N/A';
        const fullProviderName = `${firstName} ${lastName}`.trim(); // Store full name
        
        const listItem = document.createElement('li');
        // Use flexbox for layout within the list item
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center small'; 

        // Create container for text info
        const textContainer = document.createElement('div');
        textContainer.innerHTML = `
            <div>
                <strong>${fullProviderName}</strong> - <span class="text-muted">${company}</span>
            </div>
            <div>
                <small>${email} | ${phone}</small>
            </div>
        `;
        
        // --- Create the "Add" Button ---
        const addButton = document.createElement('button');
        addButton.textContent = 'Add';
        addButton.type = 'button'; // Good practice for buttons not submitting forms
        addButton.className = 'btn btn-success btn-sm'; // Bootstrap styling
        
        // Store provider data directly on the button for easy access
        addButton.dataset.providerId = providerId;
        addButton.dataset.providerName = fullProviderName;
        addButton.dataset.providerCompany = company;
        addButton.dataset.providerEmail = email;
        addButton.dataset.providerPhone = phone;
        
        // Add click listener to the Add button
        addButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering the listItem click listener (if any)
            selectProvider(addButton.dataset); // Pass button's dataset to select function
        }); 
        // --- End Button Creation ---

        // Append text container and button to the list item
        listItem.appendChild(textContainer);
        listItem.appendChild(addButton); // Add the button to the list item
        
        list.appendChild(listItem);
    });
  
    resultsContainer.appendChild(list);
  }


  
  // --- Function to update the App's Referral Source Contact ---
  async function updateAppContact(appId, providerData) {
    if (!appId) {
        console.error("updateAppContact: Missing appId.");
        toastr.error("Cannot update contact: Application ID is missing.");
        return false; // Indicate failure
    }
    if (!providerData || !providerData.providerId) {
        console.error("updateAppContact: Missing providerData or providerId.");
        toastr.error("Cannot update contact: Selected provider data is missing.");
        return false; // Indicate failure
    }

    const token = window.token; // Assuming token is globally available
    if (!token) {
        console.error("updateAppContact: Missing auth token.");
        toastr.error("Cannot update contact: Authentication token is missing.");
        return false; // Indicate failure
    }

    const contactsApiUrl = `https://api.nanolos.com/nano/contacts`; // Base URL for contacts
    const getContactsUrl = `${contactsApiUrl}?appId=${appId}`;
    const baseHeaders = { // Headers common to GET/DELETE/POST
        'accept': 'application/vnd.api+json',
        'authorization': `Bearer ${token}`,
        'appid': String(appId) // Include appid header as seen in DELETE example
        // Add other common headers like origin, referer etc. if strictly necessary
        // 'origin': 'https://canopymortgage.nanolos.com',
        // 'referer': 'https://canopymortgage.nanolos.com/',
    };
    const postDeleteHeaders = {
        ...baseHeaders,
        'Content-Type': 'application/vnd.api+json' // Needed for POST/DELETE with potential bodies/empty bodies
    };


    try {
        // --- Step 1 & 2: GET Contacts and Find Existing Referral Source (Type 37) ---
        console.log(`Fetching contacts for appId: ${appId}`);
        const getResponse = await fetch(getContactsUrl, { headers: baseHeaders });

        if (!getResponse.ok) {
             let errorDetails = `Failed to fetch contacts. Status: ${getResponse.status}`;
             try { const errorData = await getResponse.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch(e) {}
            throw new Error(errorDetails);
        }

        const contactsResult = await getResponse.json();
        console.log("Existing Contacts:", contactsResult.data);

        let contactToDeleteId = null;
        if (contactsResult.data && Array.isArray(contactsResult.data)) {
            const existingReferral = contactsResult.data.find(contact =>
                contact.relationships?.['provider-type']?.data?.id === '37'
            );
            if (existingReferral) {
                contactToDeleteId = existingReferral.id;
                console.log(`Found existing Referral Source contact (Type 37) to delete: ID ${contactToDeleteId}`);
            }
        }

        // --- Step 3: DELETE Existing Contact (if found) ---
        if (contactToDeleteId) {
            console.log(`Deleting contact ID: ${contactToDeleteId}`);
            const deleteUrl = `${contactsApiUrl}/${contactToDeleteId}`;
            const deleteResponse = await fetch(deleteUrl, {
                 method: 'DELETE',
                 headers: postDeleteHeaders // Use headers including Content-Type if API expects it even for DELETE
            });

            if (!deleteResponse.ok && deleteResponse.status !== 204) { // 204 No Content is also success for DELETE
                let errorDetails = `Failed to delete existing contact ${contactToDeleteId}. Status: ${deleteResponse.status}`;
                try { const errorData = await deleteResponse.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch(e) {}
                // Log error but proceed to add the new one anyway
                console.error(errorDetails);
                toastr.warning(`Could not remove old referral source, but will try to add the new one.`);
            } else {
                console.log(`Successfully deleted contact ID: ${contactToDeleteId}`);
            }
        }

        // --- Step 4: POST New Contact ---
        console.log("Preparing to POST new contact for provider:", providerData.providerId);
        const postPayload = {
            data: {
                type: "contacts",
                attributes: {
                    "primary-contact": providerData.providerName || null,
                    "company-name": providerData.providerCompany !== 'N/A' ? providerData.providerCompany : null,
                    "email": providerData.providerEmail !== 'N/A' ? providerData.providerEmail : null,
                    "phone": providerData.providerPhone !== 'N/A' ? providerData.providerPhone : null,
                    "is-settlement-agent": false,
                    "non-person-entity-indicator": true
                },
                relationships: {
                    app: { data: { type: "apps", id: String(appId) } },
                    "parent-provider": { data: { type: "providers", id: String(providerData.providerId) } },
                    "provider-type": { data: { type: "provider-types", id: "37" } }
                }
            }
        };

        console.log("POST Payload:", JSON.stringify(postPayload, null, 2));

        const postResponse = await fetch(contactsApiUrl, {
            method: 'POST',
            headers: postDeleteHeaders,
            body: JSON.stringify(postPayload)
        });

        if (!postResponse.ok) {
             let errorDetails = `Failed to add new contact. Status: ${postResponse.status}`;
             try { const errorData = await postResponse.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch(e) {}
             throw new Error(errorDetails);
        }

        const newContactData = await postResponse.json();
        console.log("Successfully added new contact:", newContactData);
        toastr.success(`Referral source '${providerData.providerName}' added successfully!`);

        // --- Refresh Grid Cell (Get rowNode from modal) ---
        try {
            const modalElement = document.getElementById('referral-source-editor');
            const rowNode = modalElement?.agGridRowNode; // Retrieve the stored node object

            // Check if the node exists and its data contains the correct app ID
            if (rowNode && rowNode.data && rowNode.data.app == appId) { // Use == for potential type flexibility, or ensure types match
                // Format the new value as "Contact Name (Company Name)"
                let displayValue = providerData.providerName || ''; 
                if (providerData.providerCompany && providerData.providerCompany !== 'N/A') {
                    displayValue += ` (${providerData.providerCompany})`;
                }
                
                // Update the underlying data directly on the retrieved node reference
                rowNode.setDataValue('referralSource', displayValue.trim()); 
                console.log(`Updated referral source in grid for app ${appId} to: ${displayValue}`);
                
                // Optional: Flash the cell briefly after update
                // if (gridApi) { // Still need gridApi for flashCells
                //    gridApi.flashCells({ rowNodes: [rowNode], columns: ['referralSource'] });
                // }

            } else { 
                if (!rowNode) console.warn("Row node reference not found attached to the modal.");
                // Check if the appId from the node's data matches the expected appId
                else if (rowNode.data && rowNode.data.app != appId) {
                     console.warn(`App ID mismatch: Modal appId=${appId}, Node appId=${rowNode.data.app}`);
                } else {
                     console.warn("Attached row node is missing data or app ID.");
                }
                 console.warn("Cannot update grid cell display via direct node reference.");
            }
        } catch (gridError) {
            console.error("Error updating grid cell via node reference:", gridError); 
        }

        return true; // Indicate success (of the contact update part)

    } catch (error) { // Outer catch for the overall function
        console.error("Error in updateAppContact:", error);
        toastr.error(`Failed to update contact: ${error.message}`);
        return false; // Indicate failure
    }
}

// --- Function called when a provider's 'Add' button is clicked ---
async function selectProvider(providerData) { // Make this async
     console.log('Selected Provider:', providerData); 
  
     // Get the App ID from the modal's dataset
     const modalElement = document.getElementById('referral-source-editor');
     const appId = modalElement?.dataset?.appId;

     if (!appId) {
         toastr.error("Could not get Application ID from modal to update contact.");
         return;
     }

     // Show a temporary loading state (optional)
     toastr.info("Updating referral source...", {timeOut: 2000}); 

     // Call the new function to handle the API calls
     const success = await updateAppContact(appId, providerData);

     // Close the modal only if the update was successful
     if (success && modalElement) {
         const bsModal = bootstrap.Modal.getInstance(modalElement);
         if (bsModal) {
             bsModal.hide();
         }
     } else if (!success) {
         console.log("Contact update failed, keeping modal open.");
         // Toastr error already shown in updateAppContact
     }
}

// --- Function to Remove the App's Referral Source Contact (Type 37) ---
async function removeReferralContact(appId) {
    if (!appId) {
        console.error("removeReferralContact: Missing appId.");
        toastr.error("Cannot remove contact: Application ID is missing.");
        return false; // Indicate failure
    }

    const token = window.token; // Assuming token is globally available
    if (!token) {
        console.error("removeReferralContact: Missing auth token.");
        toastr.error("Cannot remove contact: Authentication token is missing.");
        return false; // Indicate failure
    }

    const contactsApiUrl = `https://api.nanolos.com/nano/contacts`;
    const getContactsUrl = `${contactsApiUrl}?appId=${appId}`;
    const baseHeaders = {
        'accept': 'application/vnd.api+json',
        'authorization': `Bearer ${token}`,
        'appid': String(appId)
    };
     const deleteHeaders = { // Headers for DELETE
        ...baseHeaders,
        'Content-Type': 'application/vnd.api+json' // Important even for empty body on DELETE for some APIs
    };

    try {
        // --- 1. GET Contacts to find the one to delete ---
        console.log(`Fetching contacts for appId ${appId} to find referral source...`);
        const getResponse = await fetch(getContactsUrl, { headers: baseHeaders });

        if (!getResponse.ok) {
             let errorDetails = `Failed to fetch contacts. Status: ${getResponse.status}`;
             try { const errorData = await getResponse.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch(e) {}
            throw new Error(errorDetails);
        }

        const contactsResult = await getResponse.json();
        let contactToDeleteId = null;
        if (contactsResult.data && Array.isArray(contactsResult.data)) {
            const existingReferral = contactsResult.data.find(contact =>
                contact.relationships?.['provider-type']?.data?.id === '37'
            );
            if (existingReferral) {
                contactToDeleteId = existingReferral.id;
            }
        }

        // --- 2. Check if a contact was found ---
        if (!contactToDeleteId) {
            console.log(`No existing Referral Source contact (Type 37) found for appId ${appId}.`);
            toastr.info("No referral source contact found to remove.");
            return true; // Nothing to delete, consider it a success state
        }

        // --- 3. DELETE the Found Contact ---
        console.log(`Attempting to delete Referral Source contact ID: ${contactToDeleteId}`);
        const deleteUrl = `${contactsApiUrl}/${contactToDeleteId}`;
        const deleteResponse = await fetch(deleteUrl, {
             method: 'DELETE',
             headers: deleteHeaders 
        });

        if (!deleteResponse.ok && deleteResponse.status !== 204) { // 204 No Content is also success
            let errorDetails = `Failed to delete contact ${contactToDeleteId}. Status: ${deleteResponse.status}`;
            try { const errorData = await deleteResponse.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch(e) {}
            throw new Error(errorDetails);
        }

        console.log(`Successfully deleted contact ID: ${contactToDeleteId}`);
        toastr.success("Referral source contact removed successfully!");

        // --- 4. Refresh Grid Cell ---
        try {
            const modalElement = document.getElementById('referral-source-editor');
            const rowNode = modalElement?.agGridRowNode; // Get stored node reference

            if (rowNode && rowNode.data && rowNode.data.app == appId) {
                // Update the underlying data to reflect removal
                rowNode.setDataValue('referralSource', null); // Set to null or empty string
                console.log(`Cleared referral source in grid for app ${appId}`);
            } else {
                 if (!rowNode) console.warn("Row node reference not found attached to the modal for removal update.");
                 else console.warn("Cannot update grid cell display via direct node reference after removal.");
            }
        } catch (gridError) {
            console.error("Error updating grid cell after removal:", gridError);
        }

        return true; // Indicate success

    } catch (error) {
        console.error("Error in removeReferralContact:", error);
        toastr.error(`Failed to remove contact: ${error.message}`);
        return false; // Indicate failure
    }
}

// --- Function to handle the 'Create New +' button click ---
async function handleCreateNewReferral() {
    const modalElement = document.getElementById('referral-source-editor');
    const appId = modalElement?.dataset?.appId;
    const token = window.token;

    // Get input values
    const nameInput = document.getElementById('nameSearch');
    const companyInput = document.getElementById('companySearch');
    const phoneInput = document.getElementById('phoneSearch');
    const emailInput = document.getElementById('emailSearch');
    const searchButton = document.getElementById('searchButton'); // Need reference to trigger search

    const name = nameInput?.value.trim();
    const company = companyInput?.value.trim();
    const phone = phoneInput?.value.trim();
    const email = emailInput?.value.trim();

    // --- Basic Validations ---
    if (!appId) {
        toastr.error("Cannot create: Application ID is missing.");
        return;
    }
    if (!token) {
        toastr.error("Cannot create: Authentication token missing.");
        return;
    }
    // Validate required fields for *creation*
    let missingFields = [];
    if (!name) missingFields.push("Name");
    if (!company) missingFields.push("Company");
    if (!phone) missingFields.push("Phone");
    if (!email) missingFields.push("Email");

    if (missingFields.length > 0) {
        toastr.warning(`Please fill in all fields before creating: ${missingFields.join(', ')}.`);
        return;
    }

    // --- API URLs and Headers ---
    const contactsApiUrl = `https://api.nanolos.com/nano/contacts`;
    const providersApiUrl = `https://api.nanolos.com/nano/providers`;
    const getContactsUrl = `${contactsApiUrl}?appId=${appId}`;
    const baseHeaders = {
        'accept': 'application/vnd.api+json',
        'authorization': `Bearer ${token}`,
        'appid': String(appId) // Include appid for GET contacts check
    };
    const postHeaders = {
        ...baseHeaders,
        'Content-Type': 'application/vnd.api+json'
        // Remove appid header for POST /providers if not required by that specific endpoint
    };
    // Check if appid header is needed for POST /providers based on API spec
    // If not needed: delete postHeaders.appid; 

    // --- Button Feedback ---
    const createButton = document.getElementById('createNewReferralButton');
    if(createButton) {
        createButton.disabled = true;
        createButton.textContent = 'Creating...';
    }

    try {
        // --- 1. Check for existing Referral Source contact ---
        console.log(`Checking for existing contacts for appId: ${appId}`);
        const getResponse = await fetch(getContactsUrl, { headers: baseHeaders });

        if (!getResponse.ok) {
             // If fetching contacts fails, maybe proceed cautiously or stop? Let's proceed but log error.
             console.error(`Failed to fetch existing contacts. Status: ${getResponse.status}. Proceeding with creation attempt...`);
        } else {
            const contactsResult = await getResponse.json();
            if (contactsResult.data && Array.isArray(contactsResult.data)) {
                const existingReferral = contactsResult.data.find(contact =>
                    contact.relationships?.['provider-type']?.data?.id === '37'
                );
                if (existingReferral) {
                    toastr.warning("An existing referral source contact exists. Please remove it before creating a new one.");
                    if(createButton){ createButton.disabled = false; createButton.textContent = 'Create New +'; }
                    return; // Stop creation
                }
            }
        }

        // --- 2. Create the New Provider ---
        console.log("No existing contact found. Creating new provider...");
        const createProviderPayload = {
            data: {
                type: "providers",
                attributes: {
                    "primary-contact": name || null, // Use values from modal inputs
                    "company-name": company || null,
                    "email": email || null,
                    "phone": phone || null,
                    "is-active": true,
                    // Default other attributes as needed, based on cURL example
                    "state": "GA", // Default or get from somewhere? Example uses GA
                    "alt-phone": null,
                    "assistant-email": null,
                    "assistant-first-name": null,
                    "assistant-last-name": null,
                    "assistant-phone": null,
                    "city": null,
                    "company-license-identifier": null,
                    "created": new Date().toISOString(), // Use current time
                    "fannie-mae-identifier": null,
                    "fax": null,
                    "individual-license-identifier": null,
                    "is-amc": false,
                    "is-default": null,
                    "licensed-state": null,
                    "modified": null,
                    "new-orders-email": null,
                    "vendor-id": null,
                    "website": null,
                    "zip-code": null
                },
                relationships: {
                    // Assuming "Northstar" is the correct default org ID. Adjust if needed.
                    "organization": { data: { type: "organizations", id: "Northstar" } },
                    // Set provider type to Referral Source (37)
                    "provider-type": { data: { type: "provider-types", id: "37" } }
                }
            }
        };

        console.log("Create Provider Payload:", JSON.stringify(createProviderPayload, null, 2));

        const createResponse = await fetch(providersApiUrl, {
            method: 'POST',
            headers: postHeaders, // Use headers potentially without appid
            body: JSON.stringify(createProviderPayload)
        });

        if (!createResponse.ok) {
             let errorDetails = `Failed to create provider. Status: ${createResponse.status}`;
             try { const errorData = await createResponse.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch(e) {}
             throw new Error(errorDetails);
        }

        const newProviderData = await createResponse.json();
        console.log("Successfully created new provider:", newProviderData);
        toastr.success(`Provider '${name}' created successfully! Searching...`);

        // post newProviderData to the app
        const postResponse = await fetch(contactsApiUrl, {
            method: 'POST',
            headers: postHeaders,
            body: JSON.stringify(newProviderData)
        });

        if (!postResponse.ok) {
            let errorDetails = `Failed to post new provider. Status: ${postResponse.status}`;
            try { const errorData = await postResponse.json(); errorDetails += ` - ${JSON.stringify(errorData)}`; } catch(e) {}
            throw new Error(errorDetails);
        }

        const newContactData = await postResponse.json();
        console.log("Successfully posted new contact:", newContactData);
        toastr.success(`Referral source '${name}' added successfully! Searching...`);







    } catch (error) {
        console.error("Error in handleCreateNewReferral:", error);
        toastr.error(`Failed to create provider: ${error.message}`);
    } finally {
        // Re-enable button regardless of success/failure
         if(createButton){
             createButton.disabled = false;
             createButton.textContent = 'Create New +';
         }
    }
}
  
// --- Initialize referral search listener after DOM is ready ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Setting up referral source modal listeners...");
    setupReferralSearchListener(); 

    // --- Add Listener for Remove Button ---
    const removeButton = document.getElementById('removeReferralButton');
    const modalElement = document.getElementById('referral-source-editor'); // Need modal ref here too

    if (removeButton && modalElement) {
        removeButton.addEventListener('click', async () => {
            const appId = modalElement.dataset.appId;
            if (!appId) {
                toastr.error("Cannot remove: Application ID is missing from modal.");
                return;
            }

            // Optional: Confirmation dialog
            if (!confirm(`Are you sure you want to remove the current referral source for App ID ${appId}?`)) {
                return; 
            }

            // Disable button while processing
            removeButton.disabled = true;
            removeButton.textContent = 'Removing...'; 

            const success = await removeReferralContact(appId);

            // Re-enable button
            removeButton.disabled = false;
            removeButton.textContent = 'Remove Current';

            // Close modal on success
            if (success) {
                const bsModal = bootstrap.Modal.getInstance(modalElement);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        });
    } else {
        if (!removeButton) console.error("Remove button not found.");
        if (!modalElement) console.error("Modal element not found for remove button listener.");
    }
    // --- End Listener for Remove Button ---

    // --- ADD Listener for Create New Button ---
    const createButton = document.getElementById('createNewReferralButton');
    if (createButton) {
        //createButton.addEventListener('click', handleCreateNewReferral); // Call the new handler
    } else {
        //console.error("Create New button not found.");
        return;
    }
    // --- End Listener for Create New Button ---
});