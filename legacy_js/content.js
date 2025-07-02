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
const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24)); // 1000 ms/s * 3600 s/h * 24 h/day
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


            // Create a new div with the custom-data-div class
            const dataDiv = document.createElement('div');
            dataDiv.className = 'custom-data-div';

// Function to create a section
const createSection = (text1, topbox, text2, midbox, text3, bottombox, condition1, condition2, condition3, topboxUrl, midboxUrl, bottomboxUrl) => {
    const section = document.createElement('section');
    section.className = 'toolbar-item';

    const text1Div = document.createElement('div');
    text1Div.className = 'text1';
    text1Div.textContent = text1;

    const topboxDiv = document.createElement('div');
    topboxDiv.className = 'topbox';
    if (topboxUrl) {
        const topboxLink = document.createElement('a');
        topboxLink.href = topboxUrl;
        topboxLink.target = '_blank'; // Open in new tab
        topboxLink.textContent = topbox;
        topboxDiv.appendChild(topboxLink);
    } else {
        topboxDiv.textContent = topbox;
    }

    const text2Div = document.createElement('div');
    text2Div.className = 'text2';
    text2Div.textContent = text2;

    const midboxDiv = document.createElement('div');
    midboxDiv.className = 'midbox';
    if (midboxUrl) {
        const midboxLink = document.createElement('a');
        midboxLink.href = midboxUrl;
        midboxLink.target = '_blank'; // Open in new tab
        midboxLink.textContent = midbox;
        midboxDiv.appendChild(midboxLink);
    } else {
        midboxDiv.textContent = midbox;
    }

    const text3Div = document.createElement('div');
    text3Div.className = 'text3';
    text3Div.textContent = text3;

    const bottomboxDiv = document.createElement('div');
    bottomboxDiv.className = 'bottombox';
    if (bottomboxUrl) {
        const bottomboxLink = document.createElement('a');
        bottomboxLink.href = bottomboxUrl;
        bottomboxLink.target = '_blank'; // Open in new tab
        bottomboxLink.textContent = bottombox;
        bottomboxDiv.appendChild(bottomboxLink);
    } else {
        bottomboxDiv.textContent = bottombox;
    }

    // Apply condition classes to each div
    if (condition1) {
        topboxDiv.classList.add(condition1);
    }
    if (condition2) {
        midboxDiv.classList.add(condition2);
    }
    if (condition3) {
        bottomboxDiv.classList.add(condition3);
    }

    section.appendChild(text1Div);
    section.appendChild(topboxDiv);
    section.appendChild(text2Div);
    section.appendChild(midboxDiv);
    section.appendChild(text3Div);
    section.appendChild(bottomboxDiv);

    return section;
};

            const today = normalizeDate(new Date());
            const closingDate = normalizeDate(window.extractedData['Closing Date']);
            const daysToClosing = (closingDate - today) / (1000 * 60 * 60 * 24);



                // Create and append sections with custom data and formatting
                // Purchase Price, Loan Amount, LTV
                dataDiv.appendChild(createSection(
                    'Purchase Price', 
                    formatCurrency(extractedData['Sales Price'] || '0'), 
                    'B. Loan Amount', 
                    formatCurrency(extractedData['Base Loan Amount'] || '0'),
                    'LTV', 
                    (formatPercentage(extractedData['LTV']*100) + '%' || '0'),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
                ));

                // Loan Product, Credit Score, Ratios
                dataDiv.appendChild(createSection(
                    'Loan Product', 
                    extractedData['Loan Product'] || 'N/A',
                    'Credit Score', 
                    extractedData['Credit Score'] || '0',
                    'Ratios', 
                    formatPercentage(extractedData['Front Ratio']*100 || '0') + "   |   " + formatPercentage(extractedData['Back Ratio']*100 || '0'),
                    'loan-product-font-size', // Condition for topbox
                    extractedData['Credit Score'] < 600 ? 'alert_ns' : null, // Condition for midbox
                    extractedData['Front Ratio'] > 0.44 || extractedData['Back Ratio'] > 0.50 ? 'alert_ns' : null, // Condition for bottombox
                    null,
                    `https://canopymortgage.nanolos.com/loan-application//#/loan/${AppId}/financial/credit-report`,
                    null
                ));

                // Rate, Lock Status, Expiration Date
                dataDiv.appendChild(createSection(
                    'Rate', 
                    formatPercentage3(extractedData['Rate']) || '-', 
                    'Lock Status', 
                        extractedData['Locked'] && closingDate <= lockExpirationDate ? 'Locked' 
                        : extractedData['Locked'] && lockExpirationDate < today ? 'Expired' 
                        : extractedData['Locked'] && closingDate > lockExpirationDate ? 'Extension Needed'
                        : '-', 
                    'Expiration Date', 
                    extractedData['Locked'] ? formatDate(extractedData['Lock Expiration Date']) : '-',

                    null, // No condition for topbox
                        extractedData['Locked'] && closingDate <= lockExpirationDate ? 'good_ns'
                        : extractedData['Locked'] && lockExpirationDate < today ? 'alert_ns'
                        : extractedData['Locked'] && closingDate > lockExpirationDate ? 'warning_ns'
                    : null,
                    extractedData['Locked'] && closingDate <= lockExpirationDate ? 'good_ns'
                    : extractedData['Locked'] && lockExpirationDate < today ? 'alert_ns'
                    : extractedData['Locked'] && closingDate > lockExpirationDate ? 'warning_ns'
                    : null, // Alert if lock expires before closing date
                    null,
                    null,
                    null
                ));

                // Cash to Close, Reserves, Total Assets
                dataDiv.appendChild(createSection(
                    'Total Assets', 
                    formatCurrency(extractedData['Total Assets'] || '0'), 
                    'Cash to Close', 
                    formatCurrency(extractedData['Cash To Close'] || '0'), 
                    'Reserves', 
                    formatCurrency(extractedData['Reserves'] || '0'),
                    null, // Example conditions
                    null, // Example conditions
                    extractedData['Reserves'] < 0 ? 'alert_ns' : extractedData['Reserves'] < extractedData['Monthly Payment']  ? 'warning_ns' : 'good_ns', // Example conditions
                    `https://canopymortgage.nanolos.com/loan-application//#/loan/${AppId}/financial/assets`,
                    null,
                    null
                ));

                // Appraisal Status, Market Value, Over/Under
                dataDiv.appendChild(createSection(
                    'Appraisal Status', 
                    extractedData[`Appraisal Order 1 Status`] !== null ? extractedData[`Appraisal Order 1 Status`] : 'Not Ordered', 
                    'Value', 
                    extractedData['Appraisal Order 1 Market Value'] !== null ? formatCurrency(extractedData['Appraisal Order 1 Market Value']) : '-',
                    '+/-', 
                    extractedData['Appraisal Order 1 Market Value'] !== null ? formatCurrency(extractedData['Appraisal Order 1 Market Value'] - extractedData['Sales Price']) : '-',
                    extractedData[`Appraisal Order 1 Status`] == null && daysToClosing <= 30 ? 'alert_ns' : '', // Condition for topbox
                    null, // No condition for midbox
                    extractedData['Appraisal Order 1 Market Value'] !== null ? (extractedData['Appraisal Order 1 Market Value'] - extractedData['Sales Price']) >= 0 ? 'good_ns' : 'alert_ns' : '-',
                    `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${AppId}/third-party/appraisal`,
                    null,
                    null
                ));
                
                // Closing Date, blank, blank
                dataDiv.appendChild(createSection(
                    'Closing Date', 
                    formattedDate || '-', 
                    '', 
                    '-', 
                    '', 
                    '-',
                    closingDate < today ? 'alert_ns'   // Check if closing date is in the past 
                    : daysToClosing < 7 ? 'warning_ns' // Check if closing date is within 7 days
                    : null, 
                    null, // No condition for midbox
                    null, // No condition for bottombox
                    null,
                    null,
                    null
                ));

                /*
                // email all parties button
                dataDiv.appendChild(createSection(
                    '', 
                    'Email All Parties', 
                    '', 
                    '', 
                    '', 
                    '',
                    null, 
                    null, // No condition for midbox
                    null, // No condition for bottombox
                    `mailto:lance.alexander@nortstarlending.com?subject=John%20Smith%20-%20Loan%20update%20today()&body=Sales%20Price%3A%20%24%7BformatCurrency(extractedData%5B'Sales%20Price'%5D)%7D%0AAppraisal%20Status%3A%20%24%7BextractedData%5B'Appraisal%20Order%201%20Status'%5D%7D%0AClosing%20Date%3A%20%24%7BformatDate(extractedData%5B'Closing%20Date'%5D)%7D`,
                    null,
                    null
                ));
                */

            // Insert the toolbar before main loan-fulfillment div.
            //pageTitleDiv.insertAdjacentElement('beforebegin', dataDiv);
            
            // Insert the div after the opening body tag
            bodyElement.insertAdjacentElement('afterbegin', dataDiv);


            

            // add a div which contains a refresh button then append it to the dataDiv  
            const refreshDiv = document.createElement('div');
            refreshDiv.className = 'refresh-div';
            refreshDiv.innerHTML = '<button class="refresh-button">Refresh</button>';
            dataDiv.appendChild(refreshDiv);

            // listen for click event on the refresh button
            const refreshButton = document.querySelector('.refresh-button');
            refreshButton.addEventListener('click', handleRefreshClick);

            



            // make changes to nano css
            const appContainer = document.querySelector('f-app-container');
            const loanFulfillmentDiv = document.getElementById('loanFulfillment');
            const hamburgerMenu = document.querySelector('.f-hamburger-menu');
            const loanApplicationDiv = document.getElementById('loanApplication');

            if (appContainer) {
                appContainer.style.padding = '0px 45px 2em';
            } else {
                console.log('called from Main() Could not find f-app-container element');
            }
            if (loanFulfillmentDiv) {
                loanFulfillmentDiv.style.padding = '90px 0px 0px 0px';
            } else {
                console.log('Could not find loan-fulfillment element');
            }
            if (hamburgerMenu) {
                hamburgerMenu.style.top = '90px';
                hamburgerMenu.style.padding = '0px 0px 200px 0px';
            } else {
                console.log('Could not find hamburger-menu element');
            }
            if (loanApplicationDiv) {  
                loanApplicationDiv.style.padding = '90px 0px 0px 0px'; 
            }
        
                


            clearInterval(checkInterval2);  // Stop checking once the desired element is found
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
    // after click, add the refreshing class to the data div
    const dataDiv = document.querySelector('.custom-data-div');
    const refreshDiv = document.querySelector('.refresh-div');
    if (dataDiv) {
        dataDiv.classList.add('refreshing');
    }
    // then call main()
    console.log("Refresh button click.");
    refreshDiv.style.display = 'none';
    main();

    // remove listener after click
    const refreshButton = document.querySelector('.refresh-button');
    refreshButton.removeEventListener('click', handleRefreshClick);

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



// Function to handle URL changes
const handleUrlChange = () => {

   
    const token = localStorage.getItem('gridtoken');
    if (!token) {
        getToken();
        }

        //check if on search page and if div does not exist
        if (window.location.href.includes("/main/search/") && !document.querySelector('#pipeline-pro-button-container')) {
            searchPage();
        }
        


    if (isUrlChangeHandled) return;

    isUrlChangeHandled = true;
    
    const existingDataDiv = document.querySelector('.custom-data-div');
    const appContainer = document.querySelector('f-app-container');
    const loanFulfillmentDiv = document.getElementById('loanFulfillment');
    const hamburgerMenu = document.querySelector('f-hamburger-menu');



    // Extract the AppId from the new URL
    const newURL = window.location.href;
    const regex = /(\d{6})/;
    const match = newURL.match(regex);
    const newAppId = match ? match[1] : null;
    console.log("New AppId:", newAppId);

    // Check if the URL contains "/app/" and the AppId has changed
    if (window.location.href.includes("/app/") && newAppId !== currentAppId) {
        console.log("AppId changed. Reloading the page.");
        if (existingDataDiv) {
            existingDataDiv.classList.add('refreshing');
        }
        main();
        //handleRefreshClick();
        currentAppId = newAppId; // Update the stored AppId
    }

    // Check if the URL does not contain "/app/"
    if (!window.location.href.includes("/app/") && !window.location.href.includes("/loan-application/")) {
        if (existingDataDiv) {
            existingDataDiv.style.display = 'none';
        }

        if (appContainer) {
            appContainer.style.padding = '1em 2em';
        }

        if (loanFulfillmentDiv) {
            loanFulfillmentDiv.style.padding = '';
        }

        if (hamburgerMenu) {
            hamburgerMenu.style.top = '0';
        }
    } else {
        // set currentURL to the new URL
        if (existingDataDiv) {
            existingDataDiv.style.display = 'flex';
        }

        if (appContainer) {
            appContainer.style.padding = '0px 45px 2em';
        }

        if (loanFulfillmentDiv) {
            loanFulfillmentDiv.style.padding = '90px 0px 0px 0px';
        }

        if (hamburgerMenu) {
            hamburgerMenu.style.top = '90px';
            hamburgerMenu.style.padding = '0px 0px 200px 0px';
        }
    }




        // Reset the flag after a short delay to allow for subsequent URL changes
        setTimeout(() => {
            isUrlChangeHandled = false;
        }, 1000);
};

// Listen for URL changes
window.addEventListener('popstate', handleUrlChange);
window.addEventListener('hashchange', handleUrlChange);

// Initial check
handleUrlChange();

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