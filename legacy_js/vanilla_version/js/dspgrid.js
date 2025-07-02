  //make a empty array for row data to be shared between all dsp grids
  let dspRowData = [];

  // gridoptions for dsp grids
  const gridOptionsDSPLeads = {
    rowData: dspRowData,

    
    autoSizeStrategy: {
      type: "fitGridWidth",
      defaultMinWidth: 50,
      
    },


    columnDefs: [
      {headerName: "Loan Officer", field: "loanOfficer", hide: true},
      {headerName: "Leads",
      
        children: [


      {headerName: "App", field: "app",

        suppressHeaderMenuButton: true,

        cellClass: 'small-font',
        cellRenderer: function(params) {
          // Create a container element
          var container = document.createElement('span');
  
          // Create the link element
          var link = document.createElement('a');
          link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.value}`;
          link.target = '_blank';
          link.innerText = params.value;
          link.style.textDecoration = 'none';
          link.style.fontWeight = '600';
          link.style.color = '#0040ff';
  
          // Create a text node for the borrower's first name and last name
          var borrowerName = document.createTextNode(` ${params.data.firstName} ${params.data.lastName}`);
  
          // Append the link and the text node to the container
          container.appendChild(link);
          container.appendChild(borrowerName);
  
          // Return the container element
          return container;
      }},

        {headerName: "Referral Source",
          field: "referralSource",
          cellClass: 'small-font',
          maxWidth: 200,
          suppressHeaderMenuButton: true,
          editable: true,
          cellEditor: 'agLargeTextCellEditor',
          cellEditorPopup: true,
          suppressHeaderMenuButton: true,
          suppressHeaderFilterButton: true,
          cellEditorParams: {
            rows: 2,
            cols: 50,
          },
          onCellValueChanged: function(params) {
            const appId = params.data.app; // Assuming 'app' is the field that contains the app ID
            const newValue = params.newValue;
        
            // Get the token from local storage
            chrome.storage.local.get(['gridtoken'], function(result) {
              const token = result.gridtoken;
        
              if (!token) {
                console.error('Token not found in chrome.storage.');
                return;
              }
        
              // Make a call to get the app profile values
              fetch(`https://api.nanolos.com:443/nano/app-profile-values?appId=${appId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(appProfileValues => {
                // Find the data set where "name": "ReferralSource"
                const referralSourceProfile = appProfileValues.find(value => value.name === 'ReferralSource');
        
                if (referralSourceProfile) {
                  // If it exists, extract the ID and send a PATCH or DELETE request based on the new value
                  const profileId = referralSourceProfile.id;
                  const url = `https://api.nanolos.com/nano/app-profile-values/${profileId}`;
        
                  if (newValue === null || newValue === '') {
                    // Send a DELETE request if the new value is null or empty
                    fetch(url, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      console.log('Profile value deleted');
                      toastr.success('Referral Source Deleted');
                    })
                    .catch(error => {
                      console.error('Error deleting profile value:', error);
                    });
                  } else {
                    // Send a PATCH request to update the value
                    const patchBody = {
                      name: 'ReferralSource',
                      type: 'System.String',
                      value: newValue,
                      id: profileId,
                      app: appId
                    };
        
                    fetch(url, {
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(patchBody)
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      console.log('Profile value updated:', data);
                      toastr.success('Referral Source updated:', data);
                    })
                    .catch(error => {
                      console.error('Error updating profile value:', error);
                    });
                  }
                } else {
                  // If it does not exist, send a POST request to create the value
                  const postUrl = `https://api.nanolos.com/nano/app-profile-values`;
                  const postBody = {
                    name: 'ReferralSource',
                    type: 'System.String',
                    value: newValue,
                    app: appId
                  };
        
                  fetch(postUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postBody)
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                  })
                  .then(data => {
                    console.log('Profile value created:', data);
                    toastr.success('Referral Source updated:', data);
                  })
                  .catch(error => {
                    console.error('Error creating profile value:', error);
                  });
                }
              })
              .catch(error => {
                console.error('Error fetching app profile values:', error);
              });
            });
          },
        },
        
      {headerName: "Borrower Priority",
        field: "userSpecifiedQueue",
        width: 140,
        cellClass: 'small-font', 
        editable: true,
        cellEditor: 'agSelectCellEditor',
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        cellEditorParams: {
        values: ['', 'Hot Lead', 'Rate Shopping', 'Looking for Property', 'Contract Pending', 'Contract Received', 'Credit Work', 'Unable to Pre-Qual', 'Unresponsive', 'Work in Progress', 'Default'],
      }, cellStyle: params => {
        var toggleFormatting = document.getElementById('toggle-formatting').checked;
        if (!toggleFormatting) {
          return null; // No style if formatting is toggled off
        }
        //if value is null make background rgb(252,171,171)
        if (params.value === null) {
          return { backgroundColor: 'rgb(252,171,171)',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
          };
        } else {
          return null; // No style for other values
        }
      }
        },

  
    ]},
    
    ],

      //enable sorting
      defaultColDef: {
        sortable: true,
        filter: 'agSetColumnFilter',
      },

      //filter data for userSpecifiedQueue = null
      isExternalFilterPresent: function() {
        return true;
      },
      doesExternalFilterPass: function(node) {
        return node.data.userSpecifiedQueue === null;
      },
      

    
  };

  const gridOptionsDSPApps = {
    rowData: dspRowData,
    columnDefs: [
      {headerName: "Loan Officer", field: "loanOfficer", hide: true},
      {headerName: "Applications - Need Decision",
      
        children: [


      {headerName: "App ID", field: "app",
        width: 80,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        cellRenderer: function(params) {
        var link = document.createElement('a');
        link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.value}`;
        link.target = '_blank';
        link.innerText = params.value;
        link.style.textDecoration = 'none';
        link.style.fontWeight = '600';
        link.style.color = '#0040ff';
        return link;

      }},
      {headerName: "Borrower", cellClass:'small-font',
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
         valueGetter: function(params) {
        if (!params.data) {
          return null; // Return null if params.data is undefined
        }
    
        const firstName = params.data.firstName || '';
        const lastName = params.data.lastName || '';
    
        return `${firstName} ${lastName}`;

          }
        },
        {headerName: "Referral Source",
          field: "referralSource",
          cellClass: 'small-font',
          suppressHeaderMenuButton: true,
          editable: true,
          cellEditor: 'agLargeTextCellEditor',
          cellEditorPopup: true,
          suppressHeaderMenuButton: true,
          suppressHeaderFilterButton: true,
          cellEditorParams: {
            rows: 2,
            cols: 50,
          },
          onCellValueChanged: function(params) {
            const appId = params.data.app; // Assuming 'app' is the field that contains the app ID
            const newValue = params.newValue;
        
            // Get the token from local storage
            chrome.storage.local.get(['gridtoken'], function(result) {
              const token = result.gridtoken;
        
              if (!token) {
                console.error('Token not found in chrome.storage.');
                return;
              }
        
              // Make a call to get the app profile values
              fetch(`https://api.nanolos.com:443/nano/app-profile-values?appId=${appId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(appProfileValues => {
                // Find the data set where "name": "ReferralSource"
                const referralSourceProfile = appProfileValues.find(value => value.name === 'ReferralSource');
        
                if (referralSourceProfile) {
                  // If it exists, extract the ID and send a PATCH or DELETE request based on the new value
                  const profileId = referralSourceProfile.id;
                  const url = `https://api.nanolos.com/nano/app-profile-values/${profileId}`;
        
                  if (newValue === null || newValue === '') {
                    // Send a DELETE request if the new value is null or empty
                    fetch(url, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      console.log('Profile value deleted');
                    })
                    .catch(error => {
                      console.error('Error deleting profile value:', error);
                    });
                  } else {
                    // Send a PATCH request to update the value
                    const patchBody = {
                      name: 'ReferralSource',
                      type: 'System.String',
                      value: newValue,
                      id: profileId,
                      app: appId
                    };
        
                    fetch(url, {
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(patchBody)
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      console.log('Profile value updated:', data);
                    })
                    .catch(error => {
                      console.error('Error updating profile value:', error);
                    });
                  }
                } else {
                  // If it does not exist, send a POST request to create the value
                  const postUrl = `https://api.nanolos.com/nano/app-profile-values`;
                  const postBody = {
                    name: 'ReferralSource',
                    type: 'System.String',
                    value: newValue,
                    app: appId
                  };
        
                  fetch(postUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postBody)
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                  })
                  .then(data => {
                    console.log('Profile value created:', data);
                  })
                  .catch(error => {
                    console.error('Error creating profile value:', error);
                  });
                }
              })
              .catch(error => {
                console.error('Error fetching app profile values:', error);
              });
            });
          },
        },
      {headerName: "Borrower Priority",
        field: "userSpecifiedQueue",
        width: 140,
        cellClass: 'small-font', 
        editable: true,
        cellEditor: 'agSelectCellEditor',
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        cellEditorParams: {
        values: ['', 'Hot Lead', 'Rate Shopping', 'Looking for Property', 'Contract Pending', 'Contract Received', 'Credit Work', 'Unable to Pre-Qual', 'Unresponsive', 'Work in Progress', 'Default'],
      }, cellStyle: params => {
        var toggleFormatting = document.getElementById('toggle-formatting').checked;
        if (!toggleFormatting) {
          return null; // No style if formatting is toggled off
        }
        //if value is null make background rgb(252,171,171)
        if (params.value === null) {
          return { backgroundColor: 'rgb(252,171,171)',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
          };
        } else {
          return null; // No style for other values
        }
      }
        },

  
    ]},
    
    ],

    //enable sorting
    defaultColDef: {
      sortable: true,
      filter: 'agSetColumnFilter',
    },
  };

  const gridOptionsDSPApproved = {
    rowData: dspRowData,
    columnDefs: [
      {headerName: "Loan Officer", field: "loanOfficer", hide: true},
      {headerName: "Approved - Looking for Property",
      
        children: [


      {headerName: "App ID", field: "app",
        width: 80,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        cellRenderer: function(params) {
        var link = document.createElement('a');
        link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.value}`;
        link.target = '_blank';
        link.innerText = params.value;
        link.style.textDecoration = 'none';
        link.style.fontWeight = '600';
        link.style.color = '#0040ff';
        return link;

      }},
      {headerName: "Borrower", cellClass:'small-font',
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
         valueGetter: function(params) {
        if (!params.data) {
          return null; // Return null if params.data is undefined
        }
    
        const firstName = params.data.firstName || '';
        const lastName = params.data.lastName || '';
    
        return `${firstName} ${lastName}`;

          }
        },
        {headerName: "Referral Source",
          field: "referralSource",
          cellClass: 'small-font',
          suppressHeaderMenuButton: true,
          editable: true,
          cellEditor: 'agLargeTextCellEditor',
          cellEditorPopup: true,
          suppressHeaderMenuButton: true,
          suppressHeaderFilterButton: true,
          cellEditorParams: {
            rows: 2,
            cols: 50,
          },
          onCellValueChanged: function(params) {
            const appId = params.data.app; // Assuming 'app' is the field that contains the app ID
            const newValue = params.newValue;
        
            // Get the token from local storage
            chrome.storage.local.get(['gridtoken'], function(result) {
              const token = result.gridtoken;
        
              if (!token) {
                console.error('Token not found in chrome.storage.');
                return;
              }
        
              // Make a call to get the app profile values
              fetch(`https://api.nanolos.com:443/nano/app-profile-values?appId=${appId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(appProfileValues => {
                // Find the data set where "name": "ReferralSource"
                const referralSourceProfile = appProfileValues.find(value => value.name === 'ReferralSource');
        
                if (referralSourceProfile) {
                  // If it exists, extract the ID and send a PATCH or DELETE request based on the new value
                  const profileId = referralSourceProfile.id;
                  const url = `https://api.nanolos.com/nano/app-profile-values/${profileId}`;
        
                  if (newValue === null || newValue === '') {
                    // Send a DELETE request if the new value is null or empty
                    fetch(url, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      console.log('Profile value deleted');
                    })
                    .catch(error => {
                      console.error('Error deleting profile value:', error);
                    });
                  } else {
                    // Send a PATCH request to update the value
                    const patchBody = {
                      name: 'ReferralSource',
                      type: 'System.String',
                      value: newValue,
                      id: profileId,
                      app: appId
                    };
        
                    fetch(url, {
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(patchBody)
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      console.log('Profile value updated:', data);
                    })
                    .catch(error => {
                      console.error('Error updating profile value:', error);
                    });
                  }
                } else {
                  // If it does not exist, send a POST request to create the value
                  const postUrl = `https://api.nanolos.com/nano/app-profile-values`;
                  const postBody = {
                    name: 'ReferralSource',
                    type: 'System.String',
                    value: newValue,
                    app: appId
                  };
        
                  fetch(postUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postBody)
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                  })
                  .then(data => {
                    console.log('Profile value created:', data);
                  })
                  .catch(error => {
                    console.error('Error creating profile value:', error);
                  });
                }
              })
              .catch(error => {
                console.error('Error fetching app profile values:', error);
              });
            });
          },
        },
      {headerName: "Borrower Priority",
        field: "userSpecifiedQueue",
        width: 140,
        cellClass: 'small-font', 
        editable: true,
        cellEditor: 'agSelectCellEditor',
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        cellEditorParams: {
            values: ['', 'Hot Lead', 'Rate Shopping', 'Looking for Property', 'Contract Pending', 'Contract Received', 'Credit Work', 'Unable to Pre-Qual', 'Unresponsive', 'Work in Progress', 'Default'],
              }, cellStyle: params => {
            var toggleFormatting = document.getElementById('toggle-formatting').checked;
            if (!toggleFormatting) {
              return null; // No style if formatting is toggled off
            }
            //if value is null make background rgb(252,171,171)
            if (params.value === null) {
              return { backgroundColor: 'rgb(252,171,171)',
                        border: '1px solid #ccc',
                        cursor: 'pointer',
              };
            } else {
              return null; // No style for other values
            }
          }
        },
        {headerName: "Address",
          field: "streetAddress",
          cellClass: 'small-font', 
          suppressHeaderMenuButton: true,
          suppressHeaderFilterButton: true,
          cellStyle: params => {
              var toggleFormatting = document.getElementById('toggle-formatting').checked;
              if (!toggleFormatting) {
                return null; // No style if formatting is toggled off
              }
              //if value is null make background rgb(252,171,171)
              if (params.value === null) {
                return { backgroundColor: 'rgb(252,171,171)',
                          border: '1px solid #ccc',
                          cursor: 'pointer',
                };
              } else {
                return null; // No style for other values
              }
            }
          },

    ]},
    
    ],

    //enable sorting
    defaultColDef: {
      sortable: true,
      filter: 'agSetColumnFilter',
    },

      //filter data for userSpecifiedQueue = null
      isExternalFilterPresent: function() {
        return true;
      },
      doesExternalFilterPass: function(node) {
        return node.data.streetAddress === null;
      },


  };

  const gridOptionsDSPNotSubmitted = {
    rowData: dspRowData,
    columnDefs: [
      {headerName: "Loan Officer", field: "loanOfficer", hide: true},
      {headerName: "Under Contract - Not Submitted",
      
        children: [


      {headerName: "App ID", field: "app",
        width: 80,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        cellRenderer: function(params) {
        var link = document.createElement('a');
        link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.value}`;
        link.target = '_blank';
        link.innerText = params.value;
        link.style.textDecoration = 'none';
        link.style.fontWeight = '600';
        link.style.color = '#0040ff';
        return link;

      }},
      {headerName: "Borrower", cellClass:'small-font',
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
         valueGetter: function(params) {
        if (!params.data) {
          return null; // Return null if params.data is undefined
        }
    
        const firstName = params.data.firstName || '';
        const lastName = params.data.lastName || '';
    
        return `${firstName} ${lastName}`;

          }
        },
        {headerName: "Referral Source",
          field: "referralSource",
          cellClass: 'small-font',
          suppressHeaderMenuButton: true,
          editable: true,
          cellEditor: 'agLargeTextCellEditor',
          cellEditorPopup: true,
          suppressHeaderMenuButton: true,
          suppressHeaderFilterButton: true,
          cellEditorParams: {
            rows: 2,
            cols: 50,
          },
          onCellValueChanged: function(params) {
            const appId = params.data.app; // Assuming 'app' is the field that contains the app ID
            const newValue = params.newValue;
        
            // Get the token from local storage
            chrome.storage.local.get(['gridtoken'], function(result) {
              const token = result.gridtoken;
        
              if (!token) {
                console.error('Token not found in chrome.storage.');
                return;
              }
        
              // Make a call to get the app profile values
              fetch(`https://api.nanolos.com:443/nano/app-profile-values?appId=${appId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(appProfileValues => {
                // Find the data set where "name": "ReferralSource"
                const referralSourceProfile = appProfileValues.find(value => value.name === 'ReferralSource');
        
                if (referralSourceProfile) {
                  // If it exists, extract the ID and send a PATCH or DELETE request based on the new value
                  const profileId = referralSourceProfile.id;
                  const url = `https://api.nanolos.com/nano/app-profile-values/${profileId}`;
        
                  if (newValue === null || newValue === '') {
                    // Send a DELETE request if the new value is null or empty
                    fetch(url, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      console.log('Profile value deleted');
                    })
                    .catch(error => {
                      console.error('Error deleting profile value:', error);
                    });
                  } else {
                    // Send a PATCH request to update the value
                    const patchBody = {
                      name: 'ReferralSource',
                      type: 'System.String',
                      value: newValue,
                      id: profileId,
                      app: appId
                    };
        
                    fetch(url, {
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(patchBody)
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      console.log('Profile value updated:', data);
                    })
                    .catch(error => {
                      console.error('Error updating profile value:', error);
                    });
                  }
                } else {
                  // If it does not exist, send a POST request to create the value
                  const postUrl = `https://api.nanolos.com/nano/app-profile-values`;
                  const postBody = {
                    name: 'ReferralSource',
                    type: 'System.String',
                    value: newValue,
                    app: appId
                  };
        
                  fetch(postUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postBody)
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                  })
                  .then(data => {
                    console.log('Profile value created:', data);
                  })
                  .catch(error => {
                    console.error('Error creating profile value:', error);
                  });
                }
              })
              .catch(error => {
                console.error('Error fetching app profile values:', error);
              });
            });
          },
        },
        {headerName: "Address",
          field: "streetAddress",
          cellClass: 'small-font', 
          suppressHeaderMenuButton: true,
          suppressHeaderFilterButton: true,
          cellStyle: params => {
              var toggleFormatting = document.getElementById('toggle-formatting').checked;
              if (!toggleFormatting) {
                return null; // No style if formatting is toggled off
              }
              //if value is null make background rgb(252,171,171)
              if (params.value === null) {
                return { backgroundColor: 'rgb(252,171,171)',
                          border: '1px solid #ccc',
                          cursor: 'pointer',
                };
              } else {
                return null; // No style for other values
              }
            }
          },
        {headerName: "Underwriter", field: "underwriter",}

    ]},
    
    ],

    //enable sorting
    defaultColDef: {
      sortable: true,
      filter: 'agSetColumnFilter',
    },

      //filter data for userSpecifiedQueue = null
      isExternalFilterPresent: function() {
        return true;
      },
      doesExternalFilterPass: function(node) {
        //return data where underwriter is null and address is not null
        return node.data.underwriter === null && node.data.streetAddress !== null;
      },
  };
  
  const gridOptionsDSPActive = {
    rowData: dspRowData,
    columnDefs: [
      {headerName: "Loan Officer", field: "loanOfficer", hide: true},
      {headerName: "Active",
      
        children: [


          {headerName: "App", field: "app",

            suppressHeaderMenuButton: true,
    
            cellClass: 'small-font',
            cellRenderer: function(params) {
              // Create a container element
              var container = document.createElement('span');
      
              // Create the link element
              var link = document.createElement('a');
              link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.value}`;
              link.target = '_blank';
              link.innerText = params.value;
              link.style.textDecoration = 'none';
              link.style.fontWeight = '600';
              link.style.color = '#0040ff';
      
              // Create a text node for the borrower's first name and last name
              var borrowerName = document.createTextNode(` ${params.data.firstName} ${params.data.lastName}`);
      
              // Append the link and the text node to the container
              container.appendChild(link);
              container.appendChild(borrowerName);
      
              // Return the container element
              return container;
          }},
        {headerName: "Referral Source",
          field: "referralSource",
          cellClass: 'small-font',
          suppressHeaderMenuButton: true,
          editable: true,
          cellEditor: 'agLargeTextCellEditor',
          cellEditorPopup: true,
          suppressHeaderMenuButton: true,
          suppressHeaderFilterButton: true,
          cellEditorParams: {
            rows: 2,
            cols: 50,
          },
          onCellValueChanged: function(params) {
            const appId = params.data.app; // Assuming 'app' is the field that contains the app ID
            const newValue = params.newValue;
        
            // Get the token from local storage
            chrome.storage.local.get(['gridtoken'], function(result) {
              const token = result.gridtoken;
        
              if (!token) {
                console.error('Token not found in chrome.storage.');
                return;
              }
        
              // Make a call to get the app profile values
              fetch(`https://api.nanolos.com:443/nano/app-profile-values?appId=${appId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
              })
              .then(appProfileValues => {
                // Find the data set where "name": "ReferralSource"
                const referralSourceProfile = appProfileValues.find(value => value.name === 'ReferralSource');
        
                if (referralSourceProfile) {
                  // If it exists, extract the ID and send a PATCH or DELETE request based on the new value
                  const profileId = referralSourceProfile.id;
                  const url = `https://api.nanolos.com/nano/app-profile-values/${profileId}`;
        
                  if (newValue === null || newValue === '') {
                    // Send a DELETE request if the new value is null or empty
                    fetch(url, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      console.log('Profile value deleted');
                    })
                    .catch(error => {
                      console.error('Error deleting profile value:', error);
                    });
                  } else {
                    // Send a PATCH request to update the value
                    const patchBody = {
                      name: 'ReferralSource',
                      type: 'System.String',
                      value: newValue,
                      id: profileId,
                      app: appId
                    };
        
                    fetch(url, {
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(patchBody)
                    })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      return response.json();
                    })
                    .then(data => {
                      console.log('Profile value updated:', data);
                    })
                    .catch(error => {
                      console.error('Error updating profile value:', error);
                    });
                  }
                } else {
                  // If it does not exist, send a POST request to create the value
                  const postUrl = `https://api.nanolos.com/nano/app-profile-values`;
                  const postBody = {
                    name: 'ReferralSource',
                    type: 'System.String',
                    value: newValue,
                    app: appId
                  };
        
                  fetch(postUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postBody)
                  })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                  })
                  .then(data => {
                    console.log('Profile value created:', data);
                  })
                  .catch(error => {
                    console.error('Error creating profile value:', error);
                  });
                }
              })
              .catch(error => {
                console.error('Error fetching app profile values:', error);
              });
            });
          },
        },
        {headerName: "Address",
          field: "streetAddress",
          cellClass: 'small-font', 
          suppressHeaderMenuButton: true,
          suppressHeaderFilterButton: true,
          cellStyle: params => {
              var toggleFormatting = document.getElementById('toggle-formatting').checked;
              if (!toggleFormatting) {
                return null; // No style if formatting is toggled off
              }
              //if value is null make background rgb(252,171,171)
              if (params.value === null) {
                return { backgroundColor: 'rgb(252,171,171)',
                          border: '1px solid #ccc',
                          cursor: 'pointer',
                };
              } else {
                return null; // No style for other values
              }
            }
          },
        {headerName: "Status", field: "status",}

    ]},
    
    ],

    //enable sorting
    defaultColDef: {
      sortable: true,
      filter: 'agSetColumnFilter',
    },

      //filter data for userSpecifiedQueue = null
      isExternalFilterPresent: function() {
        return true;
      },
      doesExternalFilterPass: function(node) {
        //return data where underwriter is null and address is not null
        return node.data.underwriter === null && node.data.streetAddress !== null;
      },
  };