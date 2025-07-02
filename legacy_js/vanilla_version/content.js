// Call the initializeApp function to start the process
initializeApp();

// Confirm app is enabled before proceeding
async function initializeApp() {

    try {
        // URL to the config.json file on your Google Cloud Storage with cache-busting
        const configUrl = 'https://storage.googleapis.com/toolbar_resources/config.json?cache-bust=' + new Date().getTime();

        // Fetch the config.json file
        const response = await fetch(configUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to download config.json');
        }

        // Parse the JSON response
        const config = await response.json();

        // Log the fetched config for debugging
        console.log('Fetched config:', config);

        // Check if the extension is enabled
        if (config.enabled) {
            console.log('Extension is enabled, proceeding with initialization.');

            getToken();
            proceedWithInitialization();
            
        } else {
            console.log('Extension is disabled.');
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function proceedWithInitialization() {
  //if url contains "/search/" then call searchPage() function
  if (window.location.href.includes("/search/")) {
    searchPage();
  }
//remove pipeline-pro-button-container if it exists
const pipelineProButtonContainer = document.getElementById('pipeline-pro-button-container');
if (pipelineProButtonContainer) {
    pipelineProButtonContainer.remove();
}
    

    // if url does not contain "/app/" then remove the toolbar if it exists, otherwise if url contains "/app/" then call main() function
    if (!window.location.href.includes("/app/") && !window.location.href.includes("/loan-application/")) {
        // Check if the toolbar exists and remove it
        const existingDataDiv = document.querySelector('.custom-data-div');
        if (existingDataDiv) {
            console.log("Not on App page and Existing custom-data-div found, removing it.");
            existingDataDiv.remove();
        }
        console.log("Not on App page, exiting script.");
    } else {
        console.log("On App page, calling main() function.");
        main();        
    }
}


// Function to monitor the page and add buttons when needed
function searchPage() {

    //Check if token is set
    const token = localStorage.getItem('gridtoken');
    if (!token) {
        //if no token, call initializeApp() function
        getToken();
        return;
    }
    
    // ID for our custom buttons container
    const customButtonsId = 'pipeline-pro-button-container';
    
    // Check if our buttons already exist
    function buttonsExist() {
      return document.getElementById(customButtonsId) !== null;
    }

    //create a div with id pipeline-pro-button-container
    createButtons();
    
    // Function to create and append the buttons
    function createButtons() {
      // Check if the loanFulfillment div exists
      const loanFulfillmentDiv = document.getElementsByClassName('f-app-container');
      if (!loanFulfillmentDiv) return false;
      
      // Check if our buttons already exist
      if (buttonsExist()) return true;
      
      // Create header element
      const header = document.createElement('p');
      header.textContent = 'Open Pipeline Pro';
      header.style.fontSize = '0.85em'; // Make font smaller
      header.style.fontWeight = 'bold';
      header.style.textAlign = 'right'; // Align to the right
      header.style.marginBottom = '2px'; // Add a small space below the header
      header.style.paddingRight = '180px'; // Add padding to align with buttons
      header.style.color = '#555'; // Optional: adjust color

      // Create container for buttons
      const buttonsContainer = document.createElement('div');
      buttonsContainer.id = customButtonsId;
      buttonsContainer.className = 'mb-3';
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.justifyContent = 'center';
      buttonsContainer.style.width = '100%';
      buttonsContainer.style.padding = '0px 140px 0px 0px'; // Adjust padding to align buttons under header
      
      // Button definitions
      const buttons = [
        { text: 'Prospects', class: 'btn-primary' },
        { text: 'Active', class: 'btn-primary' },
        { text: 'Prospects & Active', class: 'btn-primary' },
        { text: 'Funded', class: 'btn-primary' },
        { text: 'Cancelled', class: 'btn-primary' }
      ];
      
      // Create each button
      buttons.forEach(buttonInfo => {
        const button = document.createElement('a'); // Change from button to anchor element
        button.className = `btn ${buttonInfo.class} mx-1`;
        button.textContent = buttonInfo.text;
        button.setAttribute('data-filter', buttonInfo.text.toLowerCase().replace(' & ', '-and-'));
        // Make buttons a link to the chrome extension html file
        const gridUrl = chrome.runtime.getURL(`grid.html?filter=${buttonInfo.text.toLowerCase().replace(' & ', '-and-')}`);
        button.href = gridUrl;
        button.target = '_blank'; // Add this line to open in a new tab
        button.style.color = 'white'; // Set text color to white
        button.style.fontWeight = 'normal'; // Set text to not bold
        button.style.margin = '0px 5px';
        
        // Add click event listener (primarily for styling now)
        button.addEventListener('click', function(event) {
            // event.preventDefault(); // REMOVE: Allow default link behavior
            // Remove active class from all buttons
            buttonsContainer.querySelectorAll('a').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to this button
            this.classList.add('active');
            
            // Log the filter action
            console.log(`Opening grid filtered by: ${this.getAttribute('data-filter')} in a new tab.`);
            // window.location.href = this.href; // REMOVE: Let the browser handle navigation
        });
        
        buttonsContainer.appendChild(button);
      });
      
      // Insert header first, then buttons, at the top of loanFulfillment
      loanFulfillmentDiv.prepend(header);
      loanFulfillmentDiv.prepend(buttonsContainer);
      return true;
    }
    
    // Try to create buttons immediately in case the element already exists
    if (createButtons()) {
      return; // Success, no need for observer
    }
    
    // Set up a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(function(mutations) {
      if (createButtons()) {
        // Success, disconnect the observer
        observer.disconnect();
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Set a timeout to eventually stop observing if element is never found
    setTimeout(() => {
      observer.disconnect();
    }, 30000); // Stop after 30 seconds
  }
  



let titleInterval;

function main() {


// 1. Get 6 digit number from current URL and log it as AppID variable

// If currentURL is not declared, declare it. Otherwise, update its value.
if (typeof currentURL === 'undefined') {
    var currentURL = window.location.href;
} else {
    currentURL = window.location.href;
}

// 2. Get auth token from local storage, log it as "token"
const authDataRaw = localStorage.getItem('ember_simple_auth-session');
const authData = JSON.parse(authDataRaw);
const token = authData && authData.authenticated && authData.authenticated.idToken;

const regex = /(\d{6})/;
const match = currentURL.match(regex);
const AppId = match ? match[1] : null;
console.log("AppId:", AppId);



// Only proceed if token and AppId are not null
if (!token || !AppId ) {
    // console.log('Token not found in localStorage or it is null.');
    return;
}



// Find total Manual price adjustments and sum them together
fetch(`https://api.nanolos.com//nano/manual-price-adjustments?appId=${AppId}`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
.then(response => response.json()) 
.then(data => {
    window.totalHoldbacksConcessions = 0;

    // Since data is an array, you can directly loop over it
    data.forEach(adjustment => {
        
        // If the adjustment is a Holdback or Concession, add it to the total. Holdbacks are type 34, Concessions are type 19 and are +/- depending on who pays them
        if (adjustment.priceAdjustmentType === "34" || adjustment.priceAdjustmentType === "19") {
            window.totalHoldbacksConcessions += (adjustment.amount / 100);
        }
        // If the adjustment is a Lock extension "14" and not paid by the borrower, subtract it from the total
        else if (adjustment.priceAdjustmentType === "14" && adjustment.affectedEntity !== "Borrower") {
            window.totalHoldbacksConcessions += (adjustment.amount / 100 * -1);
        }
    });

    console.log("Total Holdbacks & Concessions:", totalHoldbacksConcessions);
})
.catch(error => {
    console.error('Error fetching or parsing data:', error);
});



// Sum all allocated lender credits
function sumLenderPayments(obj) {
    let sum = 0;
  
    if (Array.isArray(obj)) {
      for (const item of obj) {
        sum += sumLenderPayments(item);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      if (obj.paidBy === "Lender" && obj.amount) {
        sum += obj.amount;
      }
  
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sum += sumLenderPayments(obj[key]);
        }
      }
    }
  
    return sum;
  }





// Helper function to search for a key-value pair in a nested object.
function findInObject(obj, key, val, prop = null) {
  if (!obj || typeof obj !== 'object') return null;

  if (obj[key] === val) {
      return prop ? obj[prop] : obj;
  }

  for (let i in obj) {
      if (obj.hasOwnProperty(i)) {
          let found = findInObject(obj[i], key, val, prop);
          if (found) return found;
      }
  }
  return null;
}




// Define the fields array at the top of the script
const fields = [
    { key: 'code', val: 'TotalLoanAmount', prop: 'value', label: 'Total Loan Amount' },
    { key: 'code', val: 'TotalLenderCredits', prop: 'value', label: 'Lender Credits' },
    { key: 'code', val: 'SalesPrice', prop: 'value', label: 'Sales Price' },
    { key: 'code', val: 'CreditScore', prop: 'value', label: 'Credit Score' },
    { key: 'code', val: 'LoanProductNickname', prop: 'value', label: 'Loan Product' },
    { key: 'code', val: 'ClosingDate', prop: 'value', label: 'Closing Date' },
    { key: 'code', val: 'LockExpirationDate', prop: 'value', label: 'Lock Expiration Date' },
    { key: 'code', val: 'CashToCloseTotal', prop: 'value', label: 'Cash To Close' },
    { key: 'code', val: 'TotalAssets', prop: 'value', label: 'Total Assets' },
    { key: 'code', val: 'ReservesAmount', prop: 'value', label: 'Reserves' },
    { key: 'code', val: 'HousingExpenseRatio', prop: 'value', label: 'Front Ratio' },
    { key: 'code', val: 'TotalExpenseRatio', prop: 'value', label: 'Back Ratio' },
    { key: 'code', val: 'BaseLoanAmount', prop: 'value', label: 'Base Loan Amount' },
    { key: 'code', val: 'LTV', prop: 'value', label: 'LTV' },
    { key: 'code', val: 'Rate', prop: 'value', label: 'Rate' },
    { key: 'code', val: 'Locked', prop: 'value', label: 'Locked' },
    { key: 'code', val: 'SubjectHousingExpense', prop: 'value', label: 'Monthly Payment' },
    { key: 'code', val: 'occupancyType', prop: 'value', label: 'Occupancy Type' },
    { key: 'code', val: 'LoanPurpose', prop: 'value', label: 'Loan Purpose' },
    

    
];

// Fetching loan data:
// Initialize an empty object to store values
window.extractedData = {};

// Fetching data from the API
fetch(`https://api.nanolos.com//nano/loans?appId=${AppId}&includes=Findings%2CGroups%2CLocks%2CClosingDisclosure&isDefaultOnly=true`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
.then(response => response.json())
.then(data => {

   
    
    // Process for Total Allocated Lender Credits
    const total = sumLenderPayments(data);
    window.totalAllocatedLenderCredits = total;
    console.log("Total Allocated Lender Credits:", window.totalAllocatedLenderCredits);

    // Process to extract specific fields
    fields.forEach(field => {
        const value = findInObject(data, field.key, field.val, field.prop);
       // console.log(field.label + ":", value);

        // Store the value in a global object
        window.extractedData = window.extractedData || {};
        window.extractedData[field.label] = value;
    });

/*
// Fetch Correct closing date  
fetch(`https://api.nanolos.com/nano/apps/${AppId}`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
.then(response => response.json())
.then(appData => {
    // console.log('App Data:', JSON.stringify(appData, null, 2)); // Log the entire appData object

    // Extract the closing date directly from the appData object
    const closingDate = appData.closingDate;
    
    
    // Store closing-date in extractedData
    window.extractedData['Closing Date'] = closingDate;
    console.log('Closing Date from App resource:', closingDate);
})
.catch(error => {
    console.error('Error fetching closing date:', error);
});
*/

    // Fetching appraisal orders data
    fetch(`https://api.nanolos.com/nano/appraisal-orders?appId=${AppId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
    }
    })
    .then(response => response.json())
    .then(appraisalData => {
        console.log('Appraisal Data:', appraisalData);


        // Function to format date as mm/dd/yyyy
        const formatDate = (dateString) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        };

        // Extract the required fields
        const extractedFields = appraisalData.map(order => ({
            createDate: order.createDate,
            effectiveDate: order.effectiveDate,
            inspectionDate: formatDate(order.inspectionDate),
            marketValue: order.marketValue,
            orderDate: formatDate(order.orderDate.split('T')[0]) // Drop the time part
        }));

        const today = new Date();
        const closingDate = new Date(window.extractedData['Closing Date']);
        const daysToClosing = (closingDate - today) / (1000 * 60 * 60 * 24);

        // Check if there are no appraisal orders and add the fields to the fields array as null
        if (appraisalData.length === 0) {
            // Add the fields to the fields array
            window.extractedData[`Appraisal Order 1 Market Value`] = null;
            window.extractedData[`Appraisal Order 1 Status`] = null;

        }
        
      


        // Add the extracted fields to the fields array
        extractedFields.forEach((order, index) => {
            let appraisalStatus;
            let marketValue;

            if (appraisalData.length === 0) {
                appraisalStatus = 'Not Ordered';
                marketValue = null;
            } else if (order.marketValue !== null) {
                appraisalStatus = `Rec: ${formatDate(order.effectiveDate)}`;
                marketValue = order.marketValue;
            } else if (order.inspectionDate !== null) {
                appraisalStatus = `Insp: ${order.inspectionDate}`;
                marketValue = null;
            } else if (order.orderDate !== null) {
                appraisalStatus = `Ord: ${order.orderDate}`;
                marketValue = null;
            } else if (daysToClosing < 30) {
                appraisalStatus = 'Order Appraisal';
                marketValue = null;
            } else {
                appraisalStatus = '-';
            }

            fields.push({ key: 'appraisal', val: `Appraisal Order ${index + 1} Create Date`, prop: 'createDate', label: 'Appraisal Create Date' });
            fields.push({ key: 'appraisal', val: `Appraisal Order ${index + 1} Effective Date`, prop: 'effectiveDate', label: 'Appraisal Effective Date' });
            fields.push({ key: 'appraisal', val: `Appraisal Order ${index + 1} Inspection Date`, prop: 'inspectionDate', label: 'Appraisal Inspection Date' });
            fields.push({ key: 'appraisal', val: `Appraisal Order ${index + 1} Market Value`, prop: 'marketValue', label: 'Market Value' });
            fields.push({ key: 'appraisal', val: `Appraisal Order ${index + 1} Order Date`, prop: 'orderDate', label: 'Appraisal Order Date' });


            // add appraisalstatus and marketvalue to fields array
            fields.push({ key: 'appraisal', val: `Appraisal Order ${index + 1} Status`, prop: 'appraisalStatus', label: 'Appraisal Status' });
            fields.push({ key: 'appraisal', val: `Appraisal Order ${index + 1} Market Value`, prop: 'marketValue', label: 'Appraised Value' });

            

            // Store the appraisal data and status in the global object
            window.extractedData = window.extractedData || {};
            window.extractedData[`Appraisal Order ${index + 1} Create Date`] = order.createDate;
            window.extractedData[`Appraisal Order ${index + 1} Effective Date`] = order.effectiveDate;
            window.extractedData[`Appraisal Order ${index + 1} Inspection Date`] = order.inspectionDate;
            window.extractedData[`Appraisal Order ${index + 1} Market Value`] = marketValue;
            window.extractedData[`Appraisal Order ${index + 1} Order Date`] = order.orderDate;
            window.extractedData[`Appraisal Order ${index + 1} Status`] = appraisalStatus;

            
        });

        console.log('Updated Fields:', fields);
        console.log('Stored Appraisal Data in window.extractedData:', window.extractedData);
    })
    .catch(error => {
        console.error('Error fetching appraisal orders:', error);
    });


    
    
    

    //If on the fees page inject the P/L 
    const checkInterval = setInterval(() => {
        const pageTitleDiv = document.querySelector('.f-links-section');

        if (pageTitleDiv) {
            // Check if our custom div is already added
            if (!document.querySelector('.custom-popup-link')) {
                const allPopupLinks = document.querySelectorAll('.popup-link');
                const lastPopupLink = allPopupLinks[allPopupLinks.length - 1];

                // Calculate Loan P/L
                
                if (extractedData['Lender Credits'] !== undefined && extractedData['Total Loan Amount'] !== undefined) {

                    
                    const totalLoanPL = (((extractedData['Lender Credits']*-1) / extractedData['Total Loan Amount']) + totalHoldbacksConcessions - (totalAllocatedLenderCredits / extractedData['Total Loan Amount']))*10000;
                    console.log("Total Loan P/L:", totalLoanPL);
                    window.roundedTotalLoanPL = parseFloat(totalLoanPL.toFixed(0));
                    console.log("Rounded Loan P/L:", roundedTotalLoanPL); 

                    if (lastPopupLink) {
                        const PLbgColor = roundedTotalLoanPL < 0 ? "lightpink" : "lightgreen";

                        // And then when you insert your new div:
                        if (lastPopupLink) {
                            lastPopupLink.insertAdjacentHTML('afterend', `<div class="popup-link custom-popup-link" style="background-color: ${PLbgColor}; padding: 0 10px; text-align: center; vertical-align: middle;"><p style="color: blue;">${roundedTotalLoanPL} bps</p></div>`);
                        }
                    } else console.log("lastPopupLink not found");
                } else {
                    console.error("Lender Credits or Total Loan Amount is undefined");
                }

                clearInterval(checkInterval);  // stop checking once the desired element is found
            }
        }

    }, 3000);


// Function to format numbers as currency
function formatCurrency(value) {
    return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format LTV as percentage to 2nd decimal
function formatPercentage(value) {
    return `${Number(value).toFixed(2)}`;
}

// Format Interest Rates as percentage to the 3rd decimal
function formatPercentage3(value) {
    return `${(Number(value) * 100).toFixed(3)}%`;
}

// Function to format dates as m/dd/yyyy
function formatDate(dateString) {
    const date = new Date(dateString); // Ensure the date is interpreted as UTC
    const month = String(date.getUTCMonth() + 1); // Months are zero-based, no padding
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month}/${day}/${year}`;
}

// Helper function to normalize a date to midnight
function normalizeDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

// Helper function to normalize a date to midnight and add 1 day
function normalizeDateAndAddOneDay(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    normalized.setDate(normalized.getDate() + 1); // Add 1 day
    return normalized;
}

// Add these functions after the normalizeDateAndAddOneDay function

// Modern, compact mortgage loan toolbar component
const createMortgageToolbar = (loanData, AppId) => {
    const toolbar = document.createElement('div');
    toolbar.className = 'mortgage-toolbar';
    
    // Create the main content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'toolbar-content';



    
    // Calculate dates and status
    const today = normalizeDate(new Date());
    const lockExpirationDate = normalizeDateAndAddOneDay(loanData['Lock Expiration Date']);
    const closingDate = normalizeDateAndAddOneDay(loanData['Closing Date']);
    const daysToClosing = (closingDate - today) / (1000 * 60 * 60 * 24);
    const formattedClosingDate = formatDate(loanData['Closing Date']) + " (" + Math.ceil(daysToClosing) + ")";
    const formattedLockExpirationDate = formatDate(loanData['Lock Expiration Date']) + " (" + Math.ceil((lockExpirationDate - today) / (1000 * 60 * 60 * 24)) + ")";
    
    // Create single row with 6 cards
    const cardRow = document.createElement('div');
    cardRow.className = 'toolbar-row';
    
    // Card 1: Loan Basics
    cardRow.appendChild(createMultiInfoCard(loanData['Loan Product'], [
        { 
            label: 'Purchase Price', 
            value: formatCurrency(loanData['Sales Price'] || '0'),
            status: null 
        },
        { 
            label: 'B. Loan Amount', 
            value: formatCurrency(loanData['Base Loan Amount'] || '0'),
            status: null 
        },
        { 
            label: 'T. Loan Amount', 
            value: formatCurrency(loanData['Total Loan Amount'] || '0'),
            status: null 
        }
    ]));
    
    // Card 2: Borrower Info
    cardRow.appendChild(createMultiInfoCard(loanData['Loan Purpose'], [
        { 
            label: 'LTV', 
            value: (formatPercentage(loanData['LTV']*100) + '%' || '0'),
            status: null 
        },
        { 
            label: 'Credit Score', 
            value: loanData['Credit Score'] || '0',
            status: loanData['Credit Score'] < 600 ? 'alert' : null,
            url: `https://canopymortgage.nanolos.com/loan-application//#/loan/${AppId}/financial/credit-report`
        },
        { 
            label: 'Ratios', 
            value: formatPercentage(loanData['Front Ratio']*100 || '0') + " | " + formatPercentage(loanData['Back Ratio']*100 || '0'),
            status: loanData['Front Ratio'] > 0.44 || loanData['Back Ratio'] > 0.50 ? 'alert' : null 
        }
    ]));
    
    // Card 3: Rate & Lock
    // Determine card-level status based on lock status
    const lockCardStatus = loanData['Locked'] && closingDate <= lockExpirationDate ? 'good'
        : loanData['Locked'] && lockExpirationDate < today ? 'alert'
        : loanData['Locked'] && closingDate > lockExpirationDate ? 'warning'
        : daysToClosing < 30 && !loanData['Locked'] ? 'warning'
        : null;
    
    cardRow.appendChild(createMultiInfoCard('Rate & Lock', [
        { 
            label: 'Rate', 
            value: formatPercentage3(loanData['Rate']) || '-',
            status: null 
        },
        { 
            label: 'Lock Status', 
            value: loanData['Locked'] && closingDate <= lockExpirationDate ? 'Locked' 
                : loanData['Locked'] && lockExpirationDate < today ? 'Expired' 
                : loanData['Locked'] && closingDate > lockExpirationDate ? 'Extension Needed'
                : daysToClosing < 30 && !loanData['Locked'] ? 'Lock Needed'
                : '-',
            status: loanData['Locked'] && closingDate <= lockExpirationDate ? 'good'
                : loanData['Locked'] && lockExpirationDate < today ? 'alert'
                : loanData['Locked'] && closingDate > lockExpirationDate ? 'warning'
                : daysToClosing < 30 && !loanData['Locked'] ? 'warning'
                : null
        },
        { 
            label: 'Expiration Date', 
            value: loanData['Locked'] ? formattedLockExpirationDate : '-',
            status: loanData['Locked'] && closingDate <= lockExpirationDate ? 'good'
                : loanData['Locked'] && lockExpirationDate < today ? 'alert'
                : loanData['Locked'] && closingDate > lockExpirationDate ? 'warning'
                : null
        }
    ], lockCardStatus));
    
    // Card 4: Financial
    // Determine card-level status based on reserves
    const reservesValue = loanData['Reserves'] || 0;
    const monthlyPayment = loanData['Monthly Payment'] || 0;
    const financialCardStatus = reservesValue < 0 ? 'alert' 
        : reservesValue < monthlyPayment ? 'warning' 
        : reservesValue > 0 ? 'good' : null;
    
    cardRow.appendChild(createMultiInfoCard('Assets', [
        { 
            label: 'Total Assets', 
            value: formatCurrency(loanData['Total Assets'] || '0'),
            status: null,
            url: `https://canopymortgage.nanolos.com/loan-application//#/loan/${AppId}/financial/assets`
        },
        { 
            label: 'Cash to Close', 
            value: formatCurrency(loanData['Cash To Close'] || '0'),
            status: null 
        },
        { 
            label: 'Reserves', 
            value: formatCurrency(loanData['Reserves'] || '0'),
            status: loanData['Reserves'] < 0 ? 'alert' : loanData['Reserves'] < loanData['Monthly Payment'] ? 'warning' : 'good'
        }
    ], financialCardStatus));
    
    // Card 5: Appraisal
    // Determine comparison value based on loan purpose
    const isRefinance = (loanData['Loan Purpose'] && loanData['Loan Purpose'].toLowerCase().includes('refinance') || loanData['Loan Purpose'] && loanData['Loan Purpose'].toLowerCase().includes('cashoutrefi'));
    const comparisonValue = isRefinance ? 
        (loanData['Total Loan Amount'] || 0) : 
        (loanData['Sales Price'] || 0);
    
    // Calculate appraisal difference based on loan type
    const appraisalDifference = loanData['Appraisal Order 1 Market Value'] !== null ? 
        (loanData['Appraisal Order 1 Market Value'] - comparisonValue) : null;
    
    // Determine appraisal card status with new conditions
    const appraisalStatus = loanData[`Appraisal Order 1 Status`];
    const isAppraisalOrdered = appraisalStatus !== null && appraisalStatus !== undefined;
    const isAppraisalComplete = loanData['Appraisal Order 1 Market Value'] !== null;
    
    let appraisalCardStatus = null;
    if (!isAppraisalOrdered && daysToClosing <= 30) {
        appraisalCardStatus = 'warning'; // Not ordered, closing soon
    } else if (isAppraisalOrdered && !isAppraisalComplete) {
        appraisalCardStatus = 'processing'; // Ordered but not complete
    } else if (isAppraisalComplete && appraisalDifference !== null) {
        appraisalCardStatus = appraisalDifference >= 0 ? 'good' : 'alert'; // Complete with results
    }
    
    cardRow.appendChild(createMultiInfoCard('Appraisal', [
        { 
            label: 'Status', 
            value: loanData[`Appraisal Order 1 Status`] !== null ? loanData[`Appraisal Order 1 Status`] : 'Not Ordered',
            status: loanData[`Appraisal Order 1 Status`] == null && daysToClosing <= 30 ? 'alert' : null,
            url: `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${AppId}/third-party/appraisal`
        },
        { 
            label: 'Value', 
            value: loanData['Appraisal Order 1 Market Value'] !== null ? formatCurrency(loanData['Appraisal Order 1 Market Value']) : '-',
            status: appraisalDifference !== null ? (appraisalDifference >= 0 ? 'good' : 'alert') : null
        },
        { 
            label: '+/-', 
            value: appraisalDifference !== null ? formatCurrency(appraisalDifference) : '-',
            status: appraisalDifference !== null ? (appraisalDifference >= 0 ? 'good' : 'alert') : null
        }
    ], appraisalCardStatus));
    
    // Card 6: Status & Closing
    const statusCard = document.createElement('div');
    statusCard.className = 'info-card status-card';
    statusCard.innerHTML = `
        <div class="card-title"><div class="status-main" id="loan-status">Loading...</div></div>
        <div class="card-content">
            <div class="card-info-item">
                <div class="card-info-label">Closing</div>
                <div class="card-info-value ${closingDate < today ? 'status-alert' : daysToClosing < 7 ? 'status-warning' : ''}">${formattedClosingDate || '-'}</div>
            </div>

            <div class="card-info-item">
                <div class="card-info-label">AUS</div>
                <a href="https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${AppId}/eligibility" target="_blank"><div class="card-info-value" id="aus-result">Loading...</div></a>
            </div>

            <div class="card-info-item">
                <div class="card-info-value" style="text-align:center" id="borrower-priority">Loading...</div>
            </div>

        </div>
    `;
    cardRow.appendChild(statusCard);

    // Fetch and update AUS result
    getLatestAUSResult(AppId).then(ausResult => {
        let ausResultStyled = "";

        // if ausResult is "Not Ordered", set it to "Not Ordered"
        if (ausResult === "Approve/Eligible" || ausResult === "Accept") {
            ausResultStyled = "🟩" + ausResult;
        } else if (ausResult == null) {
            ausResultStyled = "-";
        } else {
            ausResultStyled = "🔴" + ausResult;
        }

        const ausResultDiv = document.getElementById('aus-result');
        if (ausResultDiv) {
            ausResultDiv.textContent = ausResultStyled;
        }
    });
    
    // Assemble the toolbar
    contentContainer.appendChild(cardRow);
    
    // Add refresh button
    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-btn';
    refreshButton.innerHTML = '↻';
    refreshButton.title = 'Refresh Data';
    refreshButton.addEventListener('click', handleRefreshClick);
    
    toolbar.appendChild(contentContainer);
    toolbar.appendChild(refreshButton);
    
    // Update status when available
    getLoanStatus().then(result => {
        const statusElement = document.getElementById('loan-status');
        const priorityElement = document.getElementById('borrower-priority');
        const statusCard = statusElement ? statusElement.closest('.info-card') : null;
        
        if (statusElement) {
            statusElement.textContent = result.status;
            
            // Apply individual status element styling
            if (result.status.includes('🟨')) {
                statusElement.classList.add('status-warning');
            } else if (result.status.includes('🟩')) {
                statusElement.classList.add('status-good');
            } else if (result.status.includes('🔴')) {
                statusElement.classList.add('status-alert');
            } else if (result.status.includes('🟦')) {
                statusElement.classList.add('status-processing');
            }
            
            // Apply card-level styling based on emoji status (no icons)
            if (statusCard) {
                // Remove any existing card status classes
                statusCard.className = statusCard.className.replace(/card-(good|alert|warning|processing)/g, '').trim();
                
                if (result.status.includes('🟨')) {
                    statusCard.classList.add('card-warning');
                } else if (result.status.includes('🟩')) {
                    statusCard.classList.add('card-good');
                } else if (result.status.includes('🔴')) {
                    statusCard.classList.add('card-alert');
                } else if (result.status.includes('🟦')) {
                    statusCard.classList.add('card-processing');
                }
            }
        }
        
        if (priorityElement) {
            priorityElement.textContent = result.priority;
        }
    });

    const refreshingToolbar = document.getElementsByClassName('mortgage-toolbar refreshing');
    if (refreshingToolbar.length > 0) {
        refreshingToolbar[0].remove();
    }

    const mortgageToolbar = document.querySelector('.mortgage-toolbar');
if (mortgageToolbar) {
    mortgageToolbar.remove();
}

    return toolbar;
};

// Helper function to create multi-info cards with 3 data points vertically
const createMultiInfoCard = (title, items, cardStatus = null) => {
    const card = document.createElement('div');
    card.className = `info-card ${cardStatus ? `card-${cardStatus}` : ''}`;
    
    // Card title container with icon
    const cardTitleContainer = document.createElement('div');
    cardTitleContainer.className = 'card-title-container';
    
    // Add status icon if there's a card status
    if (cardStatus) {
        const statusIcon = document.createElement('div');
        statusIcon.className = `card-status-icon card-status-${cardStatus}`;
        statusIcon.innerHTML = cardStatus === 'good' ? '✓' : cardStatus === 'alert' ? '!' : cardStatus === 'warning' ? '!' : cardStatus === 'processing' ? '⏱' : '';
        cardTitleContainer.appendChild(statusIcon);
    }
    
    // Card title
    const cardTitle = document.createElement('div');
    cardTitle.className = 'card-title';
    cardTitle.textContent = title;
    cardTitleContainer.appendChild(cardTitle);
    
    card.appendChild(cardTitleContainer);
    
    // Card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    
    items.forEach(item => {
        const infoItem = document.createElement('div');
        infoItem.className = 'card-info-item';
        
        const label = document.createElement('div');
        label.className = 'card-info-label';
        label.textContent = item.label;
        
        const value = document.createElement('div');
        value.className = `card-info-value ${item.status ? `status-${item.status}` : ''}`;
        
        if (item.url) {
            const link = document.createElement('a');
            link.href = item.url;
            //link.target = '_blank';
            link.textContent = item.value;
            link.className = 'info-link';
            value.appendChild(link);
        } else {
            value.textContent = item.value;
        }
        
        infoItem.appendChild(label);
        infoItem.appendChild(value);
        cardContent.appendChild(infoItem);
    });
    
    card.appendChild(cardContent);
    return card;
};

// Inject HTML to display the extracted data
const today = normalizeDate(new Date());
const lockExpirationDate = normalizeDateAndAddOneDay(extractedData['Lock Expiration Date']);
const closingDate = normalizeDateAndAddOneDay(extractedData['Closing Date']);

// Get Lock Status
const lockStatus = extractedData['Locked'] && closingDate <= lockExpirationDate ? 'Locked' 
            : extractedData['Locked'] && lockExpirationDate < today ? 'Expired' 
            : extractedData['Locked'] && closingDate > lockExpirationDate ? 'Extension Needed'
            : '-';
console.log('Lock Status:', lockStatus);



// Calculate the difference in milliseconds
const timeDifference = closingDate.getTime() - today.getTime();
// Convert the difference to days
const dayDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // 1000 ms/s * 3600 s/h * 24 h/day
// Format the output string
const formattedDate = formatDate(extractedData['Closing Date']) + " (" + dayDifference + ")";

const checkInterval2 = setInterval(() => {
    // Check if the URL contains the word "/app/" or "/loan-application/"
    if (window.location.href.includes("/app/") || window.location.href.includes("/loan-application/")) {
        
        // create const which selects div with class "f-content" and "la-top-navigation"



        const pageTitleDiv = document.getElementById('loanFulfillment');
        const loanAppDiv = document.getElementById('loanApplication');
        const bodyElement = document.querySelector('body');

        // if on loan or loan application page, remote tool bar before adding new one
        if (pageTitleDiv || loanAppDiv) {
            // Check if our custom div is already added
            const existingDataDiv = document.querySelector('.custom-data-div');
            if (existingDataDiv) {
                console.log("Existing custom-data-div found, removing it.");
                // Remove the existing div
                existingDataDiv.remove();
            }


            // Create the new mortgage toolbar using your data
            const mortgageToolbar = createMortgageToolbar(extractedData, AppId);
            
            // Insert the toolbar at the beginning of the body
            bodyElement.insertAdjacentElement('afterbegin', mortgageToolbar);

            // Add the CSS styles
            addToolbarStyles();

            // Update the page layout for the new toolbar
            updatePageLayout();

            clearInterval(checkInterval2);
        } else {
            console.log("pageTitleDiv not found");
        }
    } else {
        console.log("URL does not contain '/app/'");
        clearInterval(checkInterval2);  // Stop checking if the URL does not match
    }
}, 3000);


})
.catch(error => {
    console.error('Error fetching or parsing data:', error);
});
   
    // Simulate async processing with a timeout
    setTimeout(() => {
        console.log("Main function processing completed.");
        mainProcessing = false; // Reset the flag after processing
    }, 3000); // Adjust the timeout as needed


}

function searchPage() {
    console.log("searchPage function called.");

    // Function to create and append the buttons
    function createButtons() {
        // Check if the f-search-container div exists
        const searchContainerDiv = document.querySelector('.f-search-container');
        
        if (!searchContainerDiv) {
            console.log("f-search-container not found.");
            return false;
        }
        
        // Check if the button container already exists
        const existingButtonsContainer = document.getElementById('pipeline-pro-button-container');
        if (existingButtonsContainer) {
            console.log("Buttons container already exists.");
            return true;
        }
        
        // Create header element
        const header = document.createElement('p');
        header.textContent = 'Open Pipeline Pro';
        header.style.fontSize = '0.85em'; // Make font smaller
        header.style.fontWeight = 'bold';
        header.style.textAlign = 'center'; // Align to the right
        header.style.marginBottom = '2px'; // Add a small space below the header
        header.style.paddingRight = '532px'; // Add padding to align with buttons
        header.style.color = '#555'; // Optional: adjust color

        // Create container for buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'pipeline-pro-button-container';
        buttonsContainer.className = 'mb-3';
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.justifyContent = 'center';
        buttonsContainer.style.width = '100%';
        buttonsContainer.style.padding = '0px 140px 0px 0px'; // Adjust padding to align buttons under header
        
        // Button definitions
        const buttons = [
            { text: 'Prospects', class: 'btn-primary' },
            { text: 'Active', class: 'btn-primary' },
            { text: 'Prospects & Active', class: 'btn-primary' },
            { text: 'Funded', class: 'btn-primary' },
            { text: 'Cancelled', class: 'btn-primary' }
        ];
        
        // Create each button
        buttons.forEach(buttonInfo => {
            const button = document.createElement('a'); // Change from button to anchor element
            button.className = `btn ${buttonInfo.class} mx-1`;
            button.textContent = buttonInfo.text;
            button.setAttribute('data-filter', buttonInfo.text.toLowerCase().replace(' & ', '-and-'));
            // Make buttons a link to the chrome extension html file
            const gridUrl = chrome.runtime.getURL(`grid.html?filter=${buttonInfo.text.toLowerCase().replace(' & ', '-and-')}`);
            button.href = gridUrl;
            button.target = '_blank'; // Add this line to open in a new tab
            button.style.color = 'white'; // Set text color to white
            button.style.fontWeight = 'normal'; // Set text to not bold
            button.style.margin = '0px 5px';

            
            // Add click event listener (primarily for styling now)
            button.addEventListener('click', function(event) {
                // event.preventDefault(); // REMOVE: Allow default link behavior
                // Remove active class from all buttons
                buttonsContainer.querySelectorAll('a').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to this button
                this.classList.add('active');
                
                // Log the filter action
                console.log(`Opening grid filtered by: ${this.getAttribute('data-filter')} in a new tab.`);
                // window.location.href = this.href; // REMOVE: Let the browser handle navigation
            });
            
            buttonsContainer.appendChild(button);
        });
        
        // Append the header and then the buttons container to the f-search-container
        searchContainerDiv.append(header);
        searchContainerDiv.append(buttonsContainer);
        console.log("Header and Buttons container appended to f-search-container.");
        return true;
    }
    
    // Try to create buttons immediately in case the element already exists
    if (createButtons()) {
        return; // Success, no need for observer
    }
    
    // Set up a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(function(mutations) {
        if (createButtons()) {
            // Success, disconnect the observer
            observer.disconnect();
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Set a timeout to eventually stop observing if element is never found
    setTimeout(() => {
        observer.disconnect();
        console.log("Stopped observing after 30 seconds.");
    }, 30000); // Stop after 30 seconds
}


// Function to apply to Nano's Main Container
function applyStyles() {
    // Select the #loan-fulfillment .f-app-container element and change its padding
    const appContainer = document.querySelector('.f-app-container');
    const loanFulfillmentDiv = document.getElementById('loan-fulfillment');
    //const loanApplicationDiv = document.getElementById('loanApplication');
    const hamburgerMenu = document.querySelector('.f-hamburger-menu'); // Select the .

    const existingDataDiv = document.querySelector('.custom-data-div');
    
    if (window.location.href.includes("/app/") && !existingDataDiv) {
        main();     
    } else if (!window.location.href.includes("/app/")){   
        // Remove the data div
        existingDataDiv.remove();
        loanFulfillmentDiv.style.padding = '';
    }

    
    // Apply styles only if the elements are found
    if (appContainer) {
        // appContainer.style.padding = '0px 45px 2em';
    } else {
        //console.log('Could not find .f-app-container element');
    }

    if (loanFulfillmentDiv && window.location.href.includes("/app/")) {
        loanFulfillmentDiv.style.padding = '90px 0px 0px 0px';
        hamburgerMenu.style.top = '90px';
    } else {
        //console.log('Could not find loan-fulfillment element');
    }

    if (loanApplicationDiv) {
        //loanApplicationDiv.style.padding = '90px 0px 0px 0px';
        
    } else {
        // console.log('Could not find loanApplication element');
    }

    // Select all #loan-fulfillment .f-margin-bottom elements and change their margin-bottom
    const marginBottomElements = document.querySelectorAll('#loan-fulfillment .f-margin-bottom');
    if (marginBottomElements.length > 0) {
       // console.log(`Found ${marginBottomElements.length} .f-margin-bottom elements`);
        marginBottomElements.forEach(element => {
            element.style.marginBottom = '20px';
        });
    } else {
       // console.log('Could not find any .f-margin-bottom elements');
    }
}


// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
           // applyStyles();
            //disconnect the observer
            observer.disconnect();

        }
    }
});

// Start observing the document body for changes
observer.observe(document.body, { childList: true, subtree: true });


/*
// Initial call to apply styles in case the elements are already present
applyStyles();
*/












// Function to extract 6-digit number from a URL
function extractSixDigitNumber(url) {
    const regex = /(\d{6})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}



let mainProcessing = false; // Flag to indicate if main() is processing
let listenerPaused = false; // Flag to indicate if the listener is paused


// Block out this code

/*  // Listen for messages from background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (mainProcessing || listenerPaused) {
        console.log("main is processing or listener is paused");
        return; 
        // Do nothing if main() is currently processing or listener is paused
    }

    if (request.url) {
        console.log("Received URL from background.js:", request.url);
        
        // Extract 6-digit number from the received URL
        const apiAppId = extractSixDigitNumber(request.url);
        
        // Extract 6-digit number from the current URL
        const currentURL = window.location.href;
        const currentAppId = extractSixDigitNumber(currentURL);
        
        // Compare the extracted numbers and call main() if they match
        if (apiAppId && currentAppId && apiAppId === currentAppId) {
            mainProcessing = true; // Set the flag before calling main()
            console.log("Match found! Calling main function in 2 seconds.");

            // Add the refreshing class to .custom-data-div
            const customDataDiv = document.querySelector('.custom-data-div');
            if (customDataDiv) {
                customDataDiv.classList.add('refreshing');
            }

            setTimeout(() => {
                main();

                // Reset the flag after main() completes
                mainProcessing = false;
                console.log("mainProcessing set to false.");



                // Resume the listener after 10 seconds
                setTimeout(() => {
                    listenerPaused = false;
                    console.log("Listener resumed after 10 seconds.");
                }, 10000); // 10 seconds
            }, 0); // Delay of 2000 milliseconds (2 seconds)

            // Pause the listener
            listenerPaused = true;
            console.log("Listener paused. listenerPaused set to true.");
        }
    }
});
*/








// Define the function that recursively searches the loan object JSON data for loan data.
function findInObject(obj, key, value) {
    if (!obj) return null;
    
    if (obj[key] === value) return obj;
  
    for (let k in obj) {
        if (typeof obj[k] === 'object') {
            const result = findInObject(obj[k], key, value);
            if (result) return result;
        }
    }
  
    return null;
  }



// Function to handle the refresh button click
function handleRefreshClick() {
    // Get the mortgage toolbar element
    const toolbar = document.querySelector('.mortgage-toolbar');
    
    if (toolbar) {
        // Add a refreshing class to the toolbar for visual feedback
        toolbar.classList.add('refreshing');
        
        // Find all cards and convert them to skeleton loaders
        const cards = toolbar.querySelectorAll('.info-card');
        cards.forEach(card => {
            // Store original content to restore later
            card.setAttribute('data-original-html', card.innerHTML);
            
            // Replace with skeleton loader
            const title = card.querySelector('.card-title')?.textContent || '';
            card.innerHTML = `
                <div class="card-title">${title}</div>
                <div class="skeleton-loader"></div>
                <div class="skeleton-loader"></div>
                <div class="skeleton-loader"></div>
            `;
            
            // Add skeleton class to card
            card.classList.add('skeleton-card');
        });
        
        // Find the refresh button and add spin animation
        const refreshButton = toolbar.querySelector('.refresh-btn');
        if (refreshButton) {
            //refreshButton.classList.add('spinning');
            refreshButton.disabled = true;
        }
        
        console.log("Refresh button clicked. Refreshing data...");
        
        // Call main() to refresh data after a brief delay to show the skeleton state
        setTimeout(() => {
            main();
            
            // main() will create a new toolbar, so we don't need to restore the old one
        }, 300);
    }
}

// Function to extract AppId from the URL
const extractAppIdFromUrl = (url) => {
    const regex = /(\d{6})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};



// Initialize currentAppId with the AppId from the current URL
let currentAppId = extractAppIdFromUrl(window.location.href);
console.log("Initial AppId:", currentAppId);

let isUrlChangeHandled = false;



// Function to handle URL changes - updated to handle back button navigation
const handleUrlChange = () => {

 

    const token = localStorage.getItem('gridtoken');
    if (!token) {
        getToken();
    }

    // Check if on search page and if div does not exist
    if (window.location.href.includes("/main/search/") && !document.querySelector('#pipeline-pro-button-container')) {
        searchPage();
    }

    if (isUrlChangeHandled) return;
    isUrlChangeHandled = true;
    
    // Check for both old and new toolbar elements
    const existingDataDiv = document.querySelector('.custom-data-div');
    const existingToolbar = document.querySelector('.mortgage-toolbar');
    
    // Extract the AppId from the current URL
    const currentURL = window.location.href;
    const regex = /(\d{6})/;
    const match = currentURL.match(regex);
    const newAppId = match ? match[1] : null;
    console.log("Current URL AppId:", newAppId);

    // IMPORTANT: Check if we're on a loan page that should have a toolbar
    const isLoanPage = (currentURL.includes("/app/") || currentURL.includes("/loan-application/"));
    
    if (isLoanPage) {
        // We're on a loan page, check if toolbar exists
        if (!existingToolbar && !existingDataDiv) {
            console.log("On loan page but toolbar missing (likely back button navigation). Creating toolbar.");
            main();
            currentAppId = newAppId;
        } else if (newAppId !== currentAppId) {
            // AppId changed, need to update the toolbar
            console.log("AppId changed. Reloading the toolbar.");
            
            // Remove existing toolbars
            if (existingToolbar) {
                existingToolbar.remove();
            }
            if (existingDataDiv) {
                existingDataDiv.remove();
            }
            
            main();
            currentAppId = newAppId;
        }
        
        // Set proper layout for loan pages
        updatePageLayoutForLoanPage();
    } else {
        // Not on a loan page, remove any existing toolbar
        if (existingToolbar || existingDataDiv) {
            console.log("Not on loan page. Removing toolbar.");
            
            if (existingToolbar) {
                existingToolbar.remove();
            }
            if (existingDataDiv) {
                existingDataDiv.remove();
            }
            
            // Reset page layout
            updatePageLayoutForNonLoanPage();
        }
    }

    // Reset the flag after a short delay to allow for subsequent URL changes
    setTimeout(() => {
        isUrlChangeHandled = false;
    }, 1000);
};

//monitor url changes if changed, call handleurlchage()
// Set up a MutationObserver to watch for URL changes
let lastUrl = window.location.href;

// Function to check URL changes
function checkUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        handleUrlChange();
    }
}

// Create observer to monitor URL changes
const observerURLChange = new MutationObserver(() => {
    checkUrlChange();
});

// Start observing changes to the document
observerURLChange.observe(document, {
    subtree: true,
    childList: true
});

// Also listen for popstate events (back/forward navigation)
window.addEventListener('popstate', () => {
    handleUrlChange();
});


// Helper function to update page layout for loan pages
function updatePageLayoutForLoanPage() {
    const appContainer = document.querySelector('f-app-container');
    const loanFulfillmentDiv = document.getElementById('loanFulfillment');
    const hamburgerMenu = document.querySelector('f-hamburger-menu');
    const loanApplicationDiv = document.getElementById('loanApplication');
    
    if (appContainer) {
        appContainer.style.padding = '0px 45px 2em';
    }
    if (loanFulfillmentDiv) {
        loanFulfillmentDiv.style.padding = '125px 0px 0px 0px';
    }
    if (hamburgerMenu) {
        hamburgerMenu.style.top = '125px';
        hamburgerMenu.style.padding = '0px 0px 200px 0px';
    }
    if (loanApplicationDiv) {
        loanApplicationDiv.style.padding = '125px 0px 0px 0px';
    }
}

// Helper function to update page layout for non-loan pages
function updatePageLayoutForNonLoanPage() {
    const appContainer = document.querySelector('f-app-container');
    const loanFulfillmentDiv = document.getElementById('loanFulfillment');
    const hamburgerMenu = document.querySelector('f-hamburger-menu');
    const loanApplicationDiv = document.getElementById('loanApplication');
    
    if (appContainer) {
        appContainer.style.padding = '1em 2em';
    }
    if (loanFulfillmentDiv) {
        loanFulfillmentDiv.style.padding = '';
    }
    if (hamburgerMenu) {
        hamburgerMenu.style.top = '0';
    }
    if (loanApplicationDiv) {
        loanApplicationDiv.style.padding = '';
    }
}

//get token from local storage
function getToken() {
    function checkAndStoreToken() {
        // 2. Get auth token from local storage, log it as "token"
        const authDataRaw = localStorage.getItem('ember_simple_auth-session');
        const authData = JSON.parse(authDataRaw);
        const token = authData && authData.authenticated && authData.authenticated.idToken;
        const idTokenPayload = authData && authData.authenticated && authData.authenticated.idTokenPayload;

        if (token && idTokenPayload) {
            const expirationTime = idTokenPayload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();

            if (expirationTime < currentTime) {
                console.log('Token is expired. Will check again in 1 second.');
                // Return false to indicate the token is expired and to continue checking
                return false;
            }

            // Token is valid and not expired
            //share token with popup.js
            chrome.runtime.sendMessage({ action: 'shareToken', token: token });
            console.log('Token shared with popup.js:', token);

            // Store the token in chrome.storage
            chrome.storage.local.set({ gridtoken: token }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error saving token to chrome.storage:', chrome.runtime.lastError);
                } else {
                    chrome.storage.local.get('gridtoken', function(result) {
                        if (chrome.runtime.lastError) {
                            console.error('Error retrieving token from chrome.storage:', chrome.runtime.lastError.message);
                        } else {
                            console.log('Retrieved token from chrome.storage:', result.gridtoken);
                        }
                    });
                }
            });
            // Return true to indicate a valid token was processed
            return true;
        } else {
            console.error('Token or idTokenPayload not found in localStorage.');
            // Return false to indicate an issue, might need to retry if it's a temporary absence
            return false;
        }
    }

    if (!checkAndStoreToken()) {
        const intervalId = setInterval(() => {
            console.log('Retrying to get fresh token...');
            if (checkAndStoreToken()) {
                clearInterval(intervalId);
                console.log('Fresh token obtained and processed.');
            }
        }, 1000);
    }
}


// Add listener that watches for a div with class f-search-container to be added to the DOM
const checkInterval3 = setInterval(() => {
    const searchContainer = document.querySelector('.f-search-container');
    const currentUrl = window.location.href;

    // Check if searchContainer exists, if the current URL contains '/main/queues/', and if the grid button has not been added
    if (searchContainer && currentUrl.includes('/main/queues/') && !document.querySelector('.myGrid')) {
        
        const myGrid = document.createElement('div');
        const gridUrl = chrome.runtime.getURL('grid.html?filter=queues');
        myGrid.innerHTML = `
            <div class="myGrid" style="max-width: fit-content; margin-left: auto; margin-right: auto;">
                <a href="${gridUrl}" target="_blank">
                <button id="grid-switch" style="margin: 10px">Pipeline Pro (beta)</button></a>
            </div>
        `;
        // Prepend the grid to the search container
        searchContainer.prepend(myGrid);
        console.log("myGrid div appended to the search container.");
        
        // Add listener for myGrid button to call openGrid function
        const myGridButton = document.getElementById('grid-switch');
        myGridButton.addEventListener('click', openGrid);
        //clear the interval
        clearInterval(checkInterval3);

    } else {
        console.log("searchContainer not found or myGrid already exists.");
    }
}, 2000);


//make function to open grid in new tab and put url in local storage
        function openGrid() {

            // Get auth token from local storage, log it as "token"
            const authDataRaw = localStorage.getItem('ember_simple_auth-session');
            const authData = JSON.parse(authDataRaw);
            const token = authData && authData.authenticated && authData.authenticated.idToken;

            if (token) {
                // Store the token in chrome.storage
                chrome.storage.local.set({ gridtoken: token }, function() {
                    if (chrome.runtime.lastError) {
                        console.log('Error saving token to chrome.storage:', chrome.runtime.lastError);
                    } else {
                        chrome.storage.local.get('gridtoken', function(result) {
                            if (chrome.runtime.lastError) {
                                console.log('Error retrieving token from chrome.storage:', chrome.runtime.lastError.message);
                            } else {
                                console.log('Retrieved token from chrome.storage:', result.gridtoken);
                            }
                        });

                    }
                });
            } else {
                console.log('Token not found in localStorage.');
            }
            
            console.log("myGrid button clicked.");
            //open the grid in a new tab
            chrome.runtime.sendMessage({ message: 'openGrid' });

            // extract the current url and store anything after the ? in a variable
            const currentUrl = window.location.href;
            if (currentUrl.includes('?')) {
                const urlParams = currentUrl.split('?')[1];
                console.log("urlParams:", urlParams);
                
                //store urlParams in local storage
                chrome.storage.local.set({ 'urlParams': urlParams }, function() {
                    console.log("urlParams stored in local storage.");
                });
            }
        }


function getLoanStatus() {
            // Extract AppId from current URL
            const regex = /(\d{6})/;
            const match = window.location.href.match(regex);
            const AppId = match ? match[1] : null;
            
            if (!AppId) {
                console.error("No AppId found in URL");
                return Promise.resolve({ status: "Unknown", priority: "-" });
            }
            
            // Get auth token from local storage
            const authDataRaw = localStorage.getItem('ember_simple_auth-session');
            const authData = JSON.parse(authDataRaw);
            const token = authData && authData.authenticated && authData.authenticated.idToken;
            
            if (!token) {
                console.error("No token found");
                return Promise.resolve({ status: "Unknown", priority: "-" });
            }
        
            // Headers to match the curl command
            const headers = {
                'accept': 'application/vnd.api+json',
                'accept-language': 'en-US,en;q=0.9',
                'Authorization': `Bearer ${token}`,
                'origin': 'https://canopymortgage.nanolos.com',
                'priority': 'u=1, i',
                'referer': 'https://canopymortgage.nanolos.com/',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'x-ember-request': 'true',
                'x-ember-response': 'true'
            };

            // First check underwriting-decisions API for suspended loans
            return fetch(`https://api.nanolos.com//nano/underwriting-decisions?appId=${AppId}`, { headers })
                .then(response => response.json())
                .then(uwDecisionData => {
                    console.log("UW Decision Data:", uwDecisionData);
                    
                    // Check if we have underwriting decisions
                    if (uwDecisionData && uwDecisionData.data && Array.isArray(uwDecisionData.data) && uwDecisionData.data.length > 0) {
                        // Sort by date descending to get the most recent decision
                        const sortedDecisions = uwDecisionData.data.sort((a, b) => 
                            new Date(b.attributes.date) - new Date(a.attributes.date)
                        );
                        
                        const latestDecision = sortedDecisions[0];
                        console.log("Latest UW Decision:", latestDecision);
                        
                        // If the most recent decision is Suspend, return suspended status
                        if (latestDecision.attributes && latestDecision.attributes.decision === "Suspend") {
                            return { status: "🔴 Suspended", priority: "-" };
                        }
                    }
                    
                    // If not suspended, continue with queues API check
                    return fetch(`https://api.nanolos.com//nano/queues?appId=${AppId}`, { headers })
                        .then(response => response.json())
                        .then(queueData => {
                            console.log("Queues API response:", queueData);
                            
                            let status = null;
                            let borrowerPriority = "-";
                            
                            if (queueData && queueData.data && Array.isArray(queueData.data)) {
                                // Check for Re-Submitted status
                                const reSubmittedQueues = queueData.data.filter(queue => 
                                    queue.relationships && 
                                    queue.relationships["queue-type"] && 
                                    queue.relationships["queue-type"].data === null && 
                                    queue.attributes && 
                                    (queue.attributes.code === "InitialReviewConditionsSubmitted" || 
                                     queue.attributes.code === "FinalConditionsSubmitted") &&
                                    queue.attributes["end-date"] === null
                                );
                                
                                if (reSubmittedQueues.length > 0) {
                                    status = "🟨 Re-Submitted";
                                }

                                
                                // Find the most recent queue with non-null queue-type
                                const activePriorityQueues = queueData.data.filter(queue => 
                                    queue.relationships && 
                                    queue.relationships["queue-type"] && 
                                    queue.relationships["queue-type"].data !== null
                                );
                                
                                if (activePriorityQueues.length > 0) {
                                    // Sort by start-date descending
                                    const sortedPriorityQueues = activePriorityQueues.sort((a, b) => 
                                        new Date(b.attributes["start-date"]) - new Date(a.attributes["start-date"])
                                    );
                                    
                                    const latestPriorityQueue = sortedPriorityQueues[0];
                                    borrowerPriority = latestPriorityQueue.attributes.code;
                                    console.log("Borrower Priority:", borrowerPriority);

                                    if (borrowerPriority === 'RestructureLoanFile') {
                                        status = '🔴 RESTRUCTURE';
                                    }

                                    switch (borrowerPriority) {
                                        case 'RestructureLoanFile':
                                            borrowerPriority = 'Restructure Loan File';
                                            break;
                                        case 'SubmitToLoanPartner':
                                            borrowerPriority = 'Submit to Loan Partner';
                                            break;
                                        case 'HotLead':
                                            borrowerPriority = 'Hot Lead';
                                            break;
                                        case 'LookingforProperty':
                                            borrowerPriority = 'Looking for Property';
                                            break;
                                        case 'RateShopping':
                                            borrowerPriority = 'Rate Shopping';
                                            break;
                                        case 'ContractPending':
                                            borrowerPriority = 'Contract Pending';
                                            break;
                                        case 'ContractReceived':
                                            borrowerPriority = 'Contract Received';
                                            break;
                                        case 'CreditWork':
                                            borrowerPriority = 'Credit Work';
                                            break;
                                        case 'WorkinProgress':
                                            borrowerPriority = 'Work in Progress';
                                            break;
                                        default:
                                            borrowerPriority = 'Unknown';
                                            break;
                                    }
                                }
                                    
                                
                            }
                            
                            // If Re-Submitted status was found, return it along with the borrower priority
                            if (status) {
                                return { status, priority: borrowerPriority };
                            }
                            
                            // If no Re-Submitted status, check app-statuses API for loan status
                            return fetch(`https://api.nanolos.com//nano/app-statuses?appId=${AppId}`, { headers })
                                .then(response => response.json())
                                .then(statusResponse => {
                                    console.log("App Statuses API response:", statusResponse);
                                    
                                    // Properly handle nested structure from the API
                                    if (!statusResponse || !statusResponse.data || !Array.isArray(statusResponse.data) || statusResponse.data.length === 0) {
                                        return { status: "Unknown", priority: borrowerPriority };
                                    }
                                    
                                    // Sort by date descending to get most recent
                                    const sortedStatuses = statusResponse.data.sort((a, b) => 
                                        new Date(b.attributes.date) - new Date(a.attributes.date)
                                    );
                                    
                                    const latestStatus = sortedStatuses[0];
                                    console.log("Latest status:", latestStatus);
                                    
                                    if (!latestStatus.relationships || 
                                        !latestStatus.relationships["app-status-type"] || 
                                        !latestStatus.relationships["app-status-type"].data) {
                                        return { status: "Unknown", priority: borrowerPriority };
                                    }
                                    
                                    const statusTypeId = latestStatus.relationships["app-status-type"].data.id;
                                    console.log("Status Type ID:", statusTypeId);
                                    
                                    // Map the status type to display value
                                    let mappedStatus;
                                    switch(statusTypeId) {
                                        case "Prospect": mappedStatus = "⬜ Prospect"; break;
                                        case "TBDApplicationDate": mappedStatus = "⬜ TBD Application Date"; break;
                                        case "ApplicationDate": mappedStatus = "⬜ Application Date"; break;
                                        case "PreQualified": mappedStatus = "⬜ Pre-Qualified"; break;
                                        case "SubmittedForPreApproval": mappedStatus = "⬜ Pre-Approval Process Started"; break;
                                        case "SubmittedForInitialReviewPreApproval": mappedStatus = "🟨 Submitted for Initial Review"; break;
                                        case "InitialReviewCompletePreApproval": mappedStatus = "🟦 Processing"; break;
                                        case "ProcessingPreApproval": mappedStatus = "🟦 Processing"; break;
                                        case "PreProcessing": mappedStatus = "🟦 Pre-Processing"; break;
                                        case "SubmittedForInitialReview": mappedStatus = "🟨 Submitted for Initial Review"; break;
                                        case "InitialReviewComplete": mappedStatus = "🟦 Processing"; break;
                                        case "Processing": mappedStatus = "🟦 Processing"; break;                                      
                                        case "SubmittedForUnderwriting": mappedStatus = "🟨 Re-Submitted"; break;
                                        case "Underwritten": mappedStatus = "🟦 Processing"; break;
                                        case "ClearToClose": mappedStatus = "🟩 Clear to Close"; break;
                                        case "ClosingDocumentsRequested": mappedStatus = "🟩 Balance / Scheduling Requested"; break;
                                        case "InstructionsSent": mappedStatus = "🟩 Released to Closer"; break;
                                        case "ClosingDocumentsPrepared": mappedStatus = "🟩 Closing Documents Prepared"; break;
                                        case "Closed": mappedStatus = "🟩 Closed"; break;
                                        case "Funded": mappedStatus = "🟪 Funded"; break;
                                        case "ShippingReceived": mappedStatus = "🟪 Shipping Received"; break;
                                        case "Shipped": mappedStatus = "🟪 Shipped"; break;
                                        case "InvestorReviewed": mappedStatus = "🟪 Investor Reviewed"; break;
                                        case "Purchased": mappedStatus = "⬛ Purchased"; break;
                                        case "Cancelled": mappedStatus = "🔴 Cancelled"; break;
                                        case "Referred": mappedStatus = "🔴 Referred"; break;
                                        default: 
                                            console.log("Unknown status type:", statusTypeId);
                                            mappedStatus = statusTypeId; // Return the actual ID if we don't recognize it
                                    }
                                    
                                    return { status: mappedStatus, priority: borrowerPriority };
                                });
                        });
                })
                .catch(error => {
                    console.error("Error fetching underwriting decisions:", error);
                    // If underwriting-decisions API fails, continue with the original flow
                    
                    // First check queues API for Re-Submitted status and borrower priority
                    return fetch(`https://api.nanolos.com//nano/queues?appId=${AppId}`, { headers })
                        .then(response => response.json())
                        .then(queueData => {
                            console.log("Queues API response:", queueData);
                            
                            let status = null;
                            let borrowerPriority = "-";
                            
                            if (queueData && queueData.data && Array.isArray(queueData.data)) {
                                // Check for Re-Submitted status
                                const reSubmittedQueues = queueData.data.filter(queue => 
                                    queue.relationships && 
                                    queue.relationships["queue-type"] && 
                                    queue.relationships["queue-type"].data === null && 
                                    queue.attributes && 
                                    (queue.attributes.code === "InitialReviewConditionsSubmitted" || 
                                     queue.attributes.code === "FinalConditionsSubmitted") &&
                                    queue.attributes["end-date"] === null
                                );
                                
                                if (reSubmittedQueues.length > 0) {
                                    status = "🟨 Re-Submitted";
                                }
                                
                                // Find the most recent queue with non-null queue-type
                                const activePriorityQueues = queueData.data.filter(queue => 
                                    queue.relationships && 
                                    queue.relationships["queue-type"] && 
                                    queue.relationships["queue-type"].data !== null
                                );
                                
                                if (activePriorityQueues.length > 0) {
                                    // Sort by start-date descending
                                    const sortedPriorityQueues = activePriorityQueues.sort((a, b) => 
                                        new Date(b.attributes["start-date"]) - new Date(a.attributes["start-date"])
                                    );
                                    
                                    const latestPriorityQueue = sortedPriorityQueues[0];
                                    borrowerPriority = latestPriorityQueue.attributes.code;
                                    console.log("Borrower Priority:", borrowerPriority);
                                }
                            }
                            
                            // If Re-Submitted status was found, return it along with the borrower priority
                            if (status) {
                                return { status, priority: borrowerPriority };
                            }
                            
                            // If no Re-Submitted status, check app-statuses API for loan status
                            return fetch(`https://api.nanolos.com//nano/app-statuses?appId=${AppId}`, { headers })
                                .then(response => response.json())
                                .then(statusResponse => {
                                    console.log("App Statuses API response:", statusResponse);
                                    
                                    // Properly handle nested structure from the API
                                    if (!statusResponse || !statusResponse.data || !Array.isArray(statusResponse.data) || statusResponse.data.length === 0) {
                                        return { status: "Unknown", priority: borrowerPriority };
                                    }
                                    
                                    // Sort by date descending to get most recent
                                    const sortedStatuses = statusResponse.data.sort((a, b) => 
                                        new Date(b.attributes.date) - new Date(a.attributes.date)
                                    );
                                    
                                    const latestStatus = sortedStatuses[0];
                                    console.log("Latest status:", latestStatus);
                                    
                                    if (!latestStatus.relationships || 
                                        !latestStatus.relationships["app-status-type"] || 
                                        !latestStatus.relationships["app-status-type"].data) {
                                        return { status: "Unknown", priority: borrowerPriority };
                                    }
                                    
                                    const statusTypeId = latestStatus.relationships["app-status-type"].data.id;
                                    console.log("Status Type ID:", statusTypeId);
                                    
                                    // Map the status type to display value
                                    let mappedStatus;
                                    switch(statusTypeId) {
                                        case "Prospect": mappedStatus = "⬜ Prospect"; break;
                                        case "TBDApplicationDate": mappedStatus = "⬜ TBD Application Date"; break;
                                        case "ApplicationDate": mappedStatus = "⬜ Application Date"; break;
                                        case "PreQualified": mappedStatus = "⬜ Pre-Qualified"; break;
                                        case "SubmittedForPreApproval": mappedStatus = "⬜ Pre-Approval Process Started"; break;
                                        case "SubmittedForInitialReviewPreApproval": mappedStatus = "🟨 Submitted for Initial Review"; break;
                                        case "InitialReviewCompletePreApproval": mappedStatus = "🟦 Processing"; break;
                                        case "ProcessingPreApproval": mappedStatus = "🟦 Processing"; break;
                                        case "PreProcessing": mappedStatus = "🟦 Pre-Processing"; break;
                                        case "SubmittedForInitialReview": mappedStatus = "🟨 Submitted for Initial Review"; break;
                                        case "InitialReviewComplete": mappedStatus = "🟦 Processing"; break;
                                        case "Processing": mappedStatus = "🟦 Processing"; break;                                      
                                        case "SubmittedForUnderwriting": mappedStatus = "🟨 Re-Submitted"; break;
                                        case "Underwritten": mappedStatus = "🟦 Processing"; break;
                                        case "ClearToClose": mappedStatus = "🟩 Clear to Close"; break;
                                        case "ClosingDocumentsRequested": mappedStatus = "🟩 Balance / Scheduling Requested"; break;
                                        case "InstructionsSent": mappedStatus = "🟩 Released to Closer"; break;
                                        case "ClosingDocumentsPrepared": mappedStatus = "🟩 Closing Documents Prepared"; break;
                                        case "Closed": mappedStatus = "🟩 Closed"; break;
                                        case "Funded": mappedStatus = "🟪 Funded"; break;
                                        case "ShippingReceived": mappedStatus = "🟪 Shipping Received"; break;
                                        case "Shipped": mappedStatus = "🟪 Shipped"; break;
                                        case "InvestorReviewed": mappedStatus = "🟪 Investor Reviewed"; break;
                                        case "Purchased": mappedStatus = "⬛ Purchased"; break;
                                        case "Cancelled": mappedStatus = "🔴 Cancelled"; break;
                                        case "Referred": mappedStatus = "🔴 Referred"; break;
                                        default: 
                                            console.log("Unknown status type:", statusTypeId);
                                            mappedStatus = statusTypeId; // Return the actual ID if we don't recognize it
                                    }
                                    
                                    return { status: mappedStatus, priority: borrowerPriority };
                                });
                        })
                        .catch(error => {
                            console.error("Error fetching loan status:", error);
                            return { status: "Unknown", priority: "-" };
                        });
                });
}

//function to get latest AUS result from

// Function to create a full-width row
const createFullWidthRow = (value, className) => {
    const section = document.createElement('section');
    section.className = 'toolbar-item full-width-row';
    
    // Create a single div that spans the whole width
    const valueDiv = document.createElement('div');
    valueDiv.className = 'full-width-value';
    valueDiv.textContent = value;
    
    if (className) {
        valueDiv.classList.add(className);
    }
    
    // Add CSS inline to ensure it spans both columns
    valueDiv.style.gridColumn = '1 / -1';
    valueDiv.style.textAlign = 'center';
    valueDiv.style.fontSize = '1.1em';
    valueDiv.style.fontWeight = 'bold';
    valueDiv.style.padding = '5px';
    valueDiv.style.margin = '2px 0';
    
    section.appendChild(valueDiv);
    return section;
};

// Add this styling to the dataDiv
const styleElement = document.createElement('style');
styleElement.textContent = `
    .full-width-row {
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        width: 100%;
        margin: 3px 0;
    }
    .full-width-value {
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #f9f9f9;
    }
`;
document.head.appendChild(styleElement);

// Add this function to inject the CSS styles
function addToolbarStyles() {
    if (document.getElementById('mortgage-toolbar-styles')) return; // Don't add twice
    
    const style = document.createElement('style');
    style.id = 'mortgage-toolbar-styles';
    style.textContent = `
        .mortgage-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 124px;
            background: #fff;
            border-bottom: 1px solid #e8eaed;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 51;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0px 12px 0px 130px;
            font-family: 'Google Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            overflow-x: auto;
        }

        .toolbar-content {
            display: flex;
            justify-content: center;
            align-items: center;
            min-width: 0;
            margin: 0 auto;
            max-width: 1300px;
        }

        .toolbar-row {
            display: flex;
            gap: 12px;
            justify-content: center;
            align-items: stretch;
            width: 100%;
        }

        .info-card {
            background: #f8f9fa;
            border: 1px solid #e8eaed;
            border-radius: 8px;
            padding: 6px 8px;
            width: 180px;
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
            transition: all 0.2s ease;
        }

        /* Card-level status styling */
        .info-card.card-good {
            background: #e8f5e8;
            border: 1px solid #34a853;
            box-shadow: 0 1px 3px rgba(52, 168, 83, 0.1);
        }

        .info-card.card-alert {
            background: #fce8e6;
            border: 1px solid #ea4335;
            box-shadow: 0 1px 3px rgba(234, 67, 53, 0.1);
        }

        .info-card.card-warning {
            background: #fef7e0;
            border: 1px solid #fbbc04;
            box-shadow: 0 1px 3px rgba(251, 188, 4, 0.1);
        }

        .info-card.card-processing {
            background: #e8f0fe;
            border: 1px solid #1a73e8;
            box-shadow: 0 1px 3px rgba(26, 115, 232, 0.1);
        }

        .card-title-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 6px;
            border-bottom: 1px solid #f1f3f4;
            padding-bottom: 2px;
        }

        .card-status-icon {
            position: absolute;
            top: -2px;
            left: -4px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            z-index: 1;
        }

        .card-status-icon.card-status-good {
            background: #34a853;
            color: white;
        }

        .card-status-icon.card-status-alert {
            background: #ea4335;
            color: white;
        }

        .card-status-icon.card-status-warning {
            background: #fbbc04;
            color: white;
        }

        .card-status-icon.card-status-processing {
            background: #1a73e8;
            color: white;
        }

        .card-title {
            font-size: 10px;
            font-weight: 600;
            color: #5f6368;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
            flex: 1;
        }

        /* Update card title colors for status cards */
        .info-card.card-good .card-title {
            color: #137333;
        }

        .info-card.card-alert .card-title {
            color: #c5221f;
        }

        .info-card.card-warning .card-title {
            color: #e37400;
        }

        .info-card.card-processing .card-title {
            color: #1557b0;
        }

        /* Status card specific - no icons */
        .status-card .card-status-icon {
            display: none;
        }

        .card-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: space-between;
        }

        .card-info-item {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
            min-height: 18px;
        }

        .card-info-label {
            font-size: 10px;
            color: #5f6368;
            font-weight: 500;
            white-space: nowrap;
            text-align: left;
            flex: 1;
        }

        .card-info-value {
            font-size: 12px;
            color: #202124;
            font-weight: 600;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: left;
            flex: 1;
        }

        .info-link {
            color: #1a73e8;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .info-link:hover {
            color: #1557b0;
            text-decoration: underline;
        }

        /* Status styling */
        .status-good { color: #137333 !important; }
        .status-warning { color: #ea8600 !important; }
        .status-alert { color: #d93025 !important; }
        .status-processing { color: #1a73e8 !important; }

        .status-main {
            font-weight: 700;
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .refresh-btn {
            background: #f8f9fa;
            border: 1px solid #dadce0;
            border-radius: 6px;
            color: #3c4043;
            cursor: pointer;
            font-size: 16px;
            height: 36px;
            width: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            margin-left: 20px;
            flex-shrink: 0;
        }

        .refresh-btn:hover {
            background: #f1f3f4;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }



        /* Responsive adjustments */
        @media (max-width: 1400px) {
            .toolbar-row {
                gap: 10px;
            }
        }

        @media (max-width: 1200px) {
            .info-card {
                width: 160px;
                padding: 6px;
            }
            .card-info-value {
                font-size: 11px;
            }
        }

        /* Skeleton loader styles */
        .skeleton-card {
            position: relative;
            overflow: hidden;
        }
        
        .skeleton-loader {
            height: 16px;
            margin: 6px 0;
            border-radius: 4px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
        }
        
        @keyframes skeleton-loading {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }
        
        .skeleton-card .card-title {
            opacity: 0.7;
        }
        
        .mortgage-toolbar.refreshing {
            background-color: #fff;
        }
    `;
    document.head.appendChild(style);
}

// Update the page layout to accommodate the toolbar
function updatePageLayout() {
    const appContainer = document.querySelector('.f-app-container');
    const loanFulfillmentDiv = document.getElementById('loanFulfillment');
    const hamburgerMenu = document.querySelector('.f-hamburger-menu');
    const loanApplicationDiv = document.getElementById('loanApplication');

    if (appContainer) {
        appContainer.style.padding = '0px 45px 2em';
    }
    if (loanFulfillmentDiv) {
        loanFulfillmentDiv.style.padding = '125px 0px 0px 0px';
    }
    if (hamburgerMenu) {
        hamburgerMenu.style.top = '125px';
        hamburgerMenu.style.padding = '0px 0px 200px 0px';
    }
    if (loanApplicationDiv) {  
        loanApplicationDiv.style.padding = '125px 0px 0px 0px';
    }
}

// Fetch the latest AUS result for the given AppId, filtered by primary-aus
async function getLatestAUSResult(AppId) {
    // Get auth token from local storage
    const authDataRaw = localStorage.getItem('ember_simple_auth-session');
    const authData = JSON.parse(authDataRaw);
    const token = authData && authData.authenticated && authData.authenticated.idToken;
    if (!token || !AppId) {
        return 'N/A';
    }
    const headers = {
        'accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${token}`,
        'origin': 'https://canopymortgage.nanolos.com',
        'priority': 'u=1, i',
        'referer': 'https://canopymortgage.nanolos.com/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'x-ember-request': 'true',
        'x-ember-response': 'true'
    };
    try {
        // Step 1: Get primary-aus from app-details
        const detailsResponse = await fetch(`https://api.nanolos.com//nano/app-details?appId=${AppId}`, { headers });
        if (!detailsResponse.ok) return 'N/A';
        const detailsData = await detailsResponse.json();
        const primaryAUS = detailsData && detailsData.data && detailsData.data[0] && detailsData.data[0].attributes && detailsData.data[0].attributes['primary-aus'];
        if (!primaryAUS) return 'N/A';

        // Step 2: Get underwriting-findings and filter by system-type
        const findingsResponse = await fetch(`https://api.nanolos.com//nano/underwriting-findings?appId=${AppId}`, { headers });
        if (!findingsResponse.ok) return 'N/A';
        const findingsData = await findingsResponse.json();
        if (!findingsData || !findingsData.data || !Array.isArray(findingsData.data) || findingsData.data.length === 0) return 'N/A';
        // Filter by system-type === primaryAUS
        const filtered = findingsData.data.filter(f => f.attributes && f.attributes['system-type'] === primaryAUS);
        if (!filtered.length) return 'N/A';
        // Sort by results-date-time descending
        const sorted = filtered.sort((a, b) => {
            const aTime = new Date(a.attributes['results-date-time']);
            const bTime = new Date(b.attributes['results-date-time']);
            return bTime - aTime;
        });
        const latest = sorted[0];
        return latest && latest.attributes && latest.attributes['recommendation-description']
            ? latest.attributes['recommendation-description']
            : 'N/A';
    } catch (e) {
        console.error('Error fetching AUS result:', e);
        return 'N/A';
    }
}