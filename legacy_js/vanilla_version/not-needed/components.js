// components.js

// Function to create a styled div for each field
export function createFieldDiv(label, value) {
    const item = document.createElement('div');
    item.textContent = `${label}: ${value}`;

    // Style the item
    item.style.border = '1px solid black';
    item.style.padding = '10px';
    item.style.margin = '10px';

    return item;
}

// Function to create the main data div
export function createDataDiv(extractedData) {
    const dataDiv = document.createElement('div');
    dataDiv.className = 'custom-data-div flash'; // Add the flash class

    // Style the div as a horizontal toolbar
    dataDiv.style.display = 'flex';
    dataDiv.style.justifyContent = 'space-between';
    dataDiv.style.padding = '10px';

    // Add each field as a separate item in the toolbar
    for (const [label, value] of Object.entries(extractedData)) {
        const item = createFieldDiv(label, value);
        dataDiv.appendChild(item);
    }

    return dataDiv;
}