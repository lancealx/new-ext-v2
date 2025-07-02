document.addEventListener('DOMContentLoaded', function() {
    const customDataDiv = document.getElementById('customDataDiv');

    // Example data to populate the side panel
    const data = [
        { text1: 'Purchase Price', topbox: '$585,000.00', text2: 'B. Loan Amount', midbox: '$516,262.00', text3: 'LTV', bottombox: '88.54%' },
        { text1: 'Loan Product', topbox: 'Conventional 30 Year Fixed', text2: 'Credit Score', midbox: '759', text3: 'Ratios', bottombox: '29.08 | 41.32' },
        { text1: 'Rate', topbox: '6.500%', text2: 'Lock Status', midbox: 'Locked', text3: 'Expiration Date', bottombox: '9/09/2024' },
        { text1: 'Total Assets', topbox: '$116,172.09', text2: 'Cash to Close', midbox: '$95,515.90', text3: 'Reserves', bottombox: '$20,656.19' },
        { text1: 'Appraisal Status', topbox: 'Rec: 08/13/2024', text2: 'Value', midbox: '$755,000.00', text3: '+/-', bottombox: '$170,000.00' },
        { text1: 'Closing Date', topbox: '9/04/2024 (5)', text2: '', midbox: '-', text3: '', bottombox: '-' }
    ];

    data.forEach(item => {
        const section = document.createElement('section');
        section.className = 'toolbar-item';

        const text1Div = document.createElement('div');
        text1Div.className = 'text1';
        text1Div.textContent = item.text1;

        const topboxDiv = document.createElement('div');
        topboxDiv.className = 'topbox';
        topboxDiv.textContent = item.topbox;

        const text2Div = document.createElement('div');
        text2Div.className = 'text2';
        text2Div.textContent = item.text2;

        const midboxDiv = document.createElement('div');
        midboxDiv.className = 'midbox';
        midboxDiv.textContent = item.midbox;

        const text3Div = document.createElement('div');
        text3Div.className = 'text3';
        text3Div.textContent = item.text3;

        const bottomboxDiv = document.createElement('div');
        bottomboxDiv.className = 'bottombox';
        bottomboxDiv.textContent = item.bottombox;

        section.appendChild(text1Div);
        section.appendChild(topboxDiv);
        section.appendChild(text2Div);
        section.appendChild(midboxDiv);
        section.appendChild(text3Div);
        section.appendChild(bottomboxDiv);

        customDataDiv.appendChild(section);
    });
});