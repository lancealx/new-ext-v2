// background.js
console.log('Service worker registered successfully.');

// Listen for web requests

/*
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        const url = details.url;
        if (url.includes("people") || url.includes("manual-price-adjustments") || url.includes("loans") || url.includes("properties") || url.includes("computed-app-details")) {
            // Log the found URL to the console
            console.log("Found URL:", url);

            // Send the URL to content.js
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs.length > 0 && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, { url: url });
                } else {
                    console.error("No active tab found or tab ID is undefined.");
                }
            });
        }
    },
    { urls: ["<all_urls>"] }
);


chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed and ready to create Gmail drafts!');
  });
  */