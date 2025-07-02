agGrid.LicenseManager.setLicenseKey('Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-073076}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{Northstar_Mortgage_Advisors}_is_granted_a_{Single_Application}_Developer_License_for_the_application_{Northstar_Extension}_only_for_{1}_Front-End_JavaScript_developer___All_Front-End_JavaScript_developers_working_on_{Northstar_Extension}_need_to_be_licensed___{Northstar_Extension}_has_not_been_granted_a_Deployment_License_Add-on___This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{6_December_2025}____[v3]_[0102]_MTc2NDk3OTIwMDAwMA==d2bd34c51787e7ec616c0687f6a2190c');

//import { themeBalham } from "ag-grid-community"; // or themeBalham, themeAlpine


const themes = {
  quartz: agGrid.themeQuartz,
  balham: agGrid.themeBalham,
  alpine: agGrid.themeAlpine,
};

const theme = agGrid.themeBalham;


class SumStatusBarComponent {
  init(params) {
      this.params = params;

      this.eGui = document.createElement('div');
      this.eGui.className = 'ag-status-name-value';

      var label = document.createElement('span');
      label.textContent = 'Total Loan Amount: ';
      this.eGui.appendChild(label);

      this.eSum = document.createElement('span');
      this.eSum.className = 'ag-status-name-value-value';
      this.eGui.appendChild(this.eSum);

      this.updateSum();

      // Add event listeners to update the sum when the grid data changes
      params.api.addEventListener('filterChanged', this.updateSum.bind(this));
      params.api.addEventListener('rowDataUpdated', this.updateSum.bind(this));
  }

  getGui() {
      return this.eGui;
  }

  destroy() {
      if (!this.params.api.isDestroyed()) {
          this.params.api.removeEventListener('filterChanged', this.updateSum);
          this.params.api.removeEventListener('rowDataUpdated', this.updateSum);
      }
  }

  updateSum() {
      const displayedRowNodes = [];
      this.params.api.forEachNodeAfterFilter(node => displayedRowNodes.push(node));

      const totalLoanAmount = displayedRowNodes.reduce((sum, node) => {
          if (!node.data) {
              return sum; // Skip nodes without data
          }
          // Ensure loanAmount is treated as a number
          const loanAmount = parseFloat(node.data.loanAmount) || 0;
          return sum + loanAmount;
      }, 0);

      this.eSum.textContent = '$' + totalLoanAmount.toLocaleString();
  }
}

class CustomInnerHeader {
  agParams;
  eGui;

init(agParams) {
    const eGui = (this.eGui = document.createElement('div'));
    eGui.classList.add('customInnerHeader');
    const textNode = document.createElement('span');

    textNode.textContent = agParams.displayName;

    if (agParams.icon) {
        const icon = document.createElement('i');
        icon.classList.add('fa', `${agParams.icon}`);
        eGui.appendChild(icon);
    }

    eGui.appendChild(textNode);
}

getGui() {
    return this.eGui;
}
}

//Custom Group Cell Renderer - Shows status icon and count of children
class CustomGroupCellRenderer {
  eGui;
  eGroupStatus;
  eValueContainer;
  node;
  agGroupCellRendererInstance;

  onClick = () => {
    this.node.setExpanded(!this.node.expanded);
  };

  onExpandedChanged = (params) => {
    this.updateGroupStatusIcon(params.node.expanded);
  };

  init(params) {
    this.node = params.node;

    // Check if the grouping is by 'currentStatus' using field
    const isGroupedByCurrentStatus = params.column && params.column.getColDef().field === 'currentStatus';

    if (!isGroupedByCurrentStatus) {
      // Use agGroupCellRenderer if not grouped by 'currentStatus'
      const cellRendererInstances = params.api.getCellRendererInstances({ rowNodes: [this.node] });
      this.agGroupCellRendererInstance = cellRendererInstances.find(instance => instance instanceof agGrid.Component);
      if (this.agGroupCellRendererInstance) {
        this.agGroupCellRendererInstance.init(params);
        this.eGui = this.agGroupCellRendererInstance.getGui();
        return;
      }
    }

    this.eGui = document.createElement('div');
    this.eGui.style.display = 'flex';
    this.eGui.style.alignItems = 'center';

    // Add indentation based on group level
    const level = params.node.level || 0;
    this.eGui.style.paddingLeft = `${12 + level * 20}px`;
    this.eGui.style.paddingTop = `5px`;

    if (this.node.group) {
      this.eGroupStatus = document.createElement('i');
      this.eGroupStatus.classList.add('fa', 'fa-chevron-right');
      this.eGroupStatus.style.cursor = 'pointer';
      this.eGroupStatus.style.marginRight = '10px';

      this.eGroupStatus.addEventListener('click', this.onClick);

      this.eGui.appendChild(this.eGroupStatus);

      this.node.addEventListener('expandedChanged', this.onExpandedChanged);
      this.updateGroupStatusIcon(this.node.expanded);
    }

    // Render status icon based on params.value
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';

    const icon = document.createElement('span');
    icon.style.marginRight = '5px';
    icon.style.fontSize = '15px';
    icon.style.verticalAlign = 'top';

    switch (params.value) {
      case 'Processing':
      case 'Pre-Processing':
        icon.innerHTML = '🟦';
        break;
      case 'Re-Submitted':
      case 'Underwritten':
      case 'Submitted for Underwriting':
      case 'Submitted for Initial Review':
      case 'Initial Review Complete':
      case 'Initial Review Complete (Pre-Approval)':
      case 'Initial Review Conditions Submitted':
      case 'Final Conditions Submitted':
        icon.innerHTML = '🟨';
        break;
      case 'Prospect':
      case 'Pre-Approval Process Started':
      case 'Pre-Qualified':
      
      case 'Application Date':
        icon.innerHTML = '⬜';
        icon.style.color = 'darkgrey';
        break;
      case 'Released to Closer':
      case 'Clear to Close':
      case 'Closing Documents Requested':
      case 'Closing Documents Prepared':
      case 'Balance / Scheduling Requested':
      case 'Closed':
        icon.innerHTML = '🟩';
        break;
      case 'Funded':
      case 'Shipped':
      case 'Shipping Received':
      case 'Investor Reviewed':
        icon.innerHTML = '🟪';
        break;
      case 'Purchased':
        icon.innerHTML = '⬛';
        break;
      case 'Suspended':
      case 'Cancelled':
        icon.innerHTML = '🔴';
        break;
      default:
        icon.innerHTML = '';
        break;
    }

    const value = document.createElement('span');
    value.innerText = `${params.value} (${params.node.allChildrenCount})`;

    container.appendChild(icon);
    container.appendChild(value);
    this.eGui.appendChild(container);

    // Listen for filter changes to update the count
    params.api.addEventListener('filterChanged', () => {
      this.updateCount(params);
    });
  }

  getGui() {
    return this.eGui;
  }

  refresh(params) {
    if (this.agGroupCellRendererInstance) {
      return this.agGroupCellRendererInstance.refresh(params);
    }

    this.updateCount(params);
    return true;
  }

  updateCount(params) {
    const container = this.eGui.querySelector('div');
    const value = container.querySelector('span:nth-child(2)');
    value.innerText = `${params.value} (${params.node.allChildrenCount})`;

    const icon = container.querySelector('span:nth-child(1)');
    switch (params.value) {
      case 'Processing':
      case 'Pre-Processing':
        icon.innerHTML = '🟦';
        break;
      case 'Re-Submitted':
      case 'Underwritten':
      case 'Submitted for Underwriting':
      case 'Submitted for Initial Review':
      case 'Initial Review Complete':
      case 'Initial Review Complete (Pre-Approval)':
      case 'Initial Review Conditions Submitted':
      case 'Final Conditions Submitted':
        icon.innerHTML = '🟨';
        break;
      case 'Prospect':
      case 'Pre-Approval Process Started':
      case 'Pre-Qualified':
      
      case 'Application Date':
        icon.innerHTML = '⬜';
        icon.style.color = 'darkgrey';
        break;
      case 'Released to Closer':
      case 'Clear to Close':
      case 'Closing Documents Requested':
      case 'Closing Documents Prepared':
      case 'Balance / Scheduling Requested':
      case 'Closed':
        icon.innerHTML = '🟩';
        break;
      case 'Funded':
      case 'Shipped':
      case 'Shipping Received':
      case 'Investor Reviewed':
        icon.innerHTML = '🟪';
        break;
      case 'Purchased':
        icon.innerHTML = '⬛';
        break;
      case 'Suspended':
      case 'Cancelled':
        icon.innerHTML = '🔴';
        break;
      default:
        icon.innerHTML = '';
        break;
    }
  }

  updateGroupStatusIcon(expanded) {
    if (expanded) {
      this.eGroupStatus.classList.remove('fa-chevron-right');
      this.eGroupStatus.classList.add('fa-chevron-down');
    } else {
      this.eGroupStatus.classList.remove('fa-chevron-down');
      this.eGroupStatus.classList.add('fa-chevron-right');
    }
  }

  destroy() {
    if (this.eGroupStatus) {
      this.node.removeEventListener('expandedChanged', this.onExpandedChanged);
      this.eGroupStatus.removeEventListener('click', this.onClick);
    }
    if (this.agGroupCellRendererInstance) {
      this.agGroupCellRendererInstance.destroy();
    }
  }
}


// Define the loanDetailsAndNotes component
class loanDetailsAndNotes {
  init(params) {
    this.params = params;

    this.eGui = document.createElement('div');
    this.eGui.style.width = '100%';
    this.eGui.style.height = '600px'; // Or adjust as needed
    this.eGui.style.padding = '24px'; // Add padding
    this.eGui.style.maxWidth = '900px'; // Set max width

    // Create a flex container for layout
    const flexContainer = document.createElement('div');
    flexContainer.style.display = 'flex';
    flexContainer.style.height = '100%'; // Ensure flex container fills height
    flexContainer.style.alignItems = 'flex-start'; // Align items at the top

    // Create a container for the button
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginRight = '15px'; // Add some space between button and grid

    // Create the "Add Note" button
    const addButton = document.createElement('button');
    addButton.textContent = 'Add Note +';
    addButton.className = 'btn btn-primary btn-sm'; // Bootstrap styling
    buttonContainer.appendChild(addButton);

    // Create a container for the grid
    const gridContainer = document.createElement('div');
    gridContainer.style.flexGrow = '1'; // Allow grid to take remaining width
    gridContainer.style.height = '100%'; // Make grid container fill height
    
    // Append button and grid containers to the flex container
    flexContainer.appendChild(buttonContainer);
    flexContainer.appendChild(gridContainer);

    // Append the flex container to the main eGui element
    this.eGui.appendChild(flexContainer);
    
    // Event listener for the add button to open the modal
    addButton.addEventListener('click', () => {
      const currentAppId = this.params.data.app; // Capture appId for the current row
      console.log('Add Note button clicked for app:', currentAppId);
      const addNotesModalElement = document.getElementById('addNotesModal');
      
      if (addNotesModalElement) {
        const modal = bootstrap.Modal.getOrCreateInstance(addNotesModalElement);
        const saveBtn = addNotesModalElement.querySelector('#save-note');
        const subjectInput = addNotesModalElement.querySelector('#note-subject');
        const contentTextArea = addNotesModalElement.querySelector('#note-text-area');

        // Clear previous inputs
        if(subjectInput) subjectInput.value = '';
        if(contentTextArea) contentTextArea.value = '';

        // --- Define the handler for the modal's save button --- 
        const saveHandler = (event) => {
          event.preventDefault(); // Prevent potential form submission
          console.log('Save note clicked for app:', currentAppId);

          const subject = subjectInput ? subjectInput.value : '';
          const content = contentTextArea ? contentTextArea.value : '';
          const token = window.token; // Assume token is globally available
          const currentTimeISO = new Date().toISOString();

          if (!token) {
            console.error('Token not found');
            toastr.error('Authentication token not found. Cannot save note.');
            return;
          }
          if (!content) {
              toastr.warning('Note content cannot be empty.');
              return;
          }

          // Construct the payload matching the curl command structure EXACTLY
          const payload = {
            data: {
              attributes: {
                "condition-id": null,
                "content": `<div>${content}</div>`,
                "created": currentTimeISO,
                "modified": currentTimeISO,
                "status-change": null,
                "subject": subject
              },
              relationships: {
                "app": {
                  "data": {
                    "type": "apps",
                    "id": String(currentAppId)
                  }
                },
                "app-queue": {
                  "data": null
                },
                "note-category": {
                  "data": {
                    "type": "note-categories",
                    "id": "22"
                  }
                }
              },
              "type": "notes"
            }
          };

          // Construct headers exactly as in the curl example
          const headers = {
            'accept': 'application/vnd.api+json',
            'appid': String(currentAppId),
            'authorization': `Bearer ${token}`,
            'content-type': 'application/vnd.api+json'
          };

          console.log('Sending payload:', JSON.stringify(payload));
          console.log('With headers:', headers);

          // Perform the fetch request
          fetch('https://api.nanolos.com/nano/notes', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
          })
          .then(response => {
            console.log('Save Note API Response Status:', response.status);
            if (!response.ok) {
              return response.text().then(text => { 
                console.error('Save Note API Error Response:', text);
                throw new Error(`HTTP error ${response.status}: ${text}`); 
              });
            }
            return response.json(); 
          })
          .then(data => {
            console.log('Note saved successfully:', data);
            toastr.success('Note saved successfully!');
            modal.hide(); // Close the modal on success
            // Optionally, refresh the notes in the detail grid
            this.fetchData(this.params); 
          })
          .catch(error => {
            console.error('Error saving note:', error);
            toastr.error(`Failed to save note: ${error.message}`);
          });
        };
        // --- End of saveHandler definition ---

        // Remove existing listener before adding a new one to prevent duplicates
        // A common way is to replace the button with its clone
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        // Add the click listener to the new button instance
        newSaveBtn.addEventListener('click', saveHandler);

        modal.show(); // Show the modal
      } else {
        console.error('Add Notes Modal element not found!');
      }
    });

    const detailGridOptions = {
      onFirstDataRendered: function(params) {
        var detailGridOptions = params.api;
        detailGridOptions.setFilterModel({
          user: {
            type: 'notEqual',
            filter: 'Automated Server Process',
          }
        });

        // Sort by date descending
        detailGridOptions.applyColumnState({
          state: [{colId: "created", sort: "desc"}],
          applyOrder: true,
          defaultState: {sort: null},
        });
      },
      columnDefs: [
        { headerName: "Date",
          field: "created",
          colId: "created",
          maxWidth: 100,
          valueFormatter: function (params) {
            // Use the existing formatDateToMMDDYY utility function
            return formatDateToMMDDYY(params.value);
          },
        },
        { headerName: "User",
          filter: 'agTextColumnFilter',
          field: "user",
          width: 120,
        },
        { headerName: "Message",
          field: "content",
          flex: 1, // Let message take remaining space
          wrapText: true,
          autoHeight: true,
          width: 380,
        },
      ],
      defaultColDef: {
        sortable: true,
        filter: true,
      },
      // Use the parent theme
      theme: params.theme,
    };

    // Create the detail grid inside the gridContainer
    this.detailGridApi = agGrid.createGrid(gridContainer, detailGridOptions);

    // Fetch the data
    this.fetchData(params);
  }

  fetchData(params) {
    const token = window.token; // Assuming token is available globally
    if (!token) {
      console.error('Token not found.');
      return;
    }

    fetch(`https://api.nanolos.com/nano/notes?appId=${params.data.app}`, {
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
    .then(data => {
      // Strip HTML tags from content
      const processedData = data.map(note => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(note.content, 'text/html');
        note.content = doc.body.textContent || "";
        return note;
      });

      // Get users from local storage and map user IDs to names
      chrome.storage.local.get(['users'], (result) => {
        const users = result.users;
        let finalNotes = processedData;

        if (users) {
          const userMap = new Map(users.map(user => [user.id, `${user.firstName} ${user.lastName}`]));
          finalNotes = processedData.map(note => {
            return {
              ...note,
              user: userMap.get(note.user) || note.user // Replace ID with name, fallback to ID
            };
          });
        } else {
          console.error('Users not found in chrome.storage.');
        }

        // Set the row data for the detail grid
        if (this.detailGridApi) {
              this.detailGridApi.setGridOption('rowData', finalNotes);
              console.log('Fetched and processed app notes:', finalNotes);
        }

      });
    })
    .catch(error => {
      console.error('Error fetching app notes:', error);
      // Optionally show an error message in the detail grid
      if (this.detailGridApi) {
        this.detailGridApi.setGridOption('rowData', [{ content: 'Error loading notes.' }]);
      }
    });
  }

  getGui() {
    return this.eGui;
  }

  destroy() {
    // Clean up the detail grid when the detail row is closed
    if (this.detailGridApi) {
      this.detailGridApi.destroy();
    }
  }
}


  
  // Grid API: Access to Grid API methods
  let gridApi;



const gridOptions = {

  //getRowHeight: (params) => 32,
  theme: theme,
  suppressCutToClipboard: true,
  cellSelection: true,

  //rowGroupPanelShow: "always",
  groupDefaultExpanded: 0,
  suppressGroupChangesColumnVisibility: true,
  groupDefaultExpanded: -1,

  groupDisplayType: "groupRows",

  
  groupRowRenderer: CustomGroupCellRenderer,
  onFilterChanged: function(params) {
    gridApi.refreshCells({ force: true });
  },
  


  getRowId: params => {
    // Ensure params.data exists and has the 'id' property
    // This 'id' should match the 'id' used in your applyTransactionAsync update items
    return params.data && params.data.id ? params.data.id : undefined;
  },

  
  onFirstDataRendered: (params) => {
    //applyFilters();
    
  },
  
  autoGroupColumnDef: {
    cellRendererParams: {
      innerRenderer: function(params) {
        // Manually format the value inside the group cell
        if (!params.value) return '';
        const [year, month, day] = params.value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return params.value;
        
        const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const formattedDay = date.getDate().toString().padStart(2, '0');
        const formattedYear = date.getFullYear().toString().slice(-2);
        return `${formattedMonth}/${formattedDay}/${formattedYear}`;
      }
    }
  },
 



  //on state updated, check column filter model, if empty, do nothing, if not empty change clear filter button to active
  onFilterChanged: function() {
    var filterModel = gridApi.getFilterModel();
    var clearFilterButton = document.getElementById('clear-filters');
    //var prospectsFilter = document.getElementById('prospects-filter');
    //var activeFilter = document.getElementById('active-filter');
    //var fundedFilter = document.getElementById('funded-filter');

    if (Object.keys(filterModel).length === 0) {
      clearFilterButton.classList.remove('btn-danger');
      clearFilterButton.classList.add('btn-outline-primary');
      /* add checked property to prospect filter
      prospectsFilter.checked = true;
      activeFilter.checked = true;
      fundedFilter.checked = true;
      applyFilters();
      */
    } else {
      clearFilterButton.classList.add('btn-danger');
      clearFilterButton.classList.remove('btn-outline-primary');
    }
  },

  //enable sorting
  //enableCharts: true,
  autoSizeStrategy: {
    type: 'fitCellContents'
  },



  // MASTER DETAIL SETUP
  masterDetail: true,
  detailRowAutoHeight: true,
  detailCellRenderer: loanDetailsAndNotes,
  //detailRowHeight: 500,

    





  
      columnDefs: [


            {headerName: "",
             maxWidth: 30,
             pinned:"left", 
             cellRenderer: 'agGroupCellRenderer',
             floatingFilter: false,
             suppressHeaderMenuButton: true,
             suppressHeaderFilterButton: true,
             floatingFilterComponentParams: {
               suppressFloatingFilterButton: true,
             },
            },
            {headerName: "Notes",
              hide: true,
              field: 'notes',
              wrapText: true, // Wrap Cell Text
              autoHeight: true, // Auto Height Cells
              editable: true,
              filter: 'agSetColumnFilter',
              width: 300,
              pinned: 'left',
              cellClass: 'small-font',
              columnGroupShow: 'open',
              editable: true,
              cellRenderer: function(params) {
                return params.value ? params.value : '';
              }
    
            },
            {headerName: "App ID",
              field: "app",
              width: 100,
              minWidth: 80,
              pinned: 'left',
              cellRenderer: function(params) {
                var container = document.createElement('div');
          
                // Create the calendar reminder button
                var button = document.createElement('button');
                button.innerHTML = '<i class="fa fa-calendar"></i>'; // Font Awesome icon
                button.className = 'calendar-button';
                button.title = 'Set calendar reminder';
                button.addEventListener('click', function() {
                  const url = createGoogleCalendarEventURL(params);
                  window.open(url, '_blank');
                });
                container.appendChild(button);
          
                // Create the app ID link
                var link = document.createElement('a');
                link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.value}`;
                link.target = '_blank';
                link.innerText = params.value;
                link.style.textDecoration = 'none';
                link.style.fontWeight = '600';
                link.style.color = '#0040ff';
                container.appendChild(link);
          
                // Add suspended icon if applicable
                if (params.data && params.data.isSuspended) {
                  var icon = document.createElement('span');
                  icon.innerHTML = '⚠️'; // You can use any icon or image here
                  icon.style.marginLeft = '5px';
                  icon.title = 'Loan is suspended'; // Add tooltip
                  container.appendChild(icon);
                }
          
                return container;
              }
            },
            {headerName: "Closing Date",
              field: "closingDate",
              colId: "closingDate",
              filter: 'agDateColumnFilter',
              width: 100,
              editable: true,
              cellEditor: 'agDateCellEditor', // <-- Keep enabled
              cellEditorParams: {
                browserDatePicker: true, // Move browserDatePicker here
              },
              pinned: 'left',
              cellClass: 'small-font',
              //cellDataType: 'dateString', // Explicitly define data type as a date string (YYYY-MM-DD)
              headerComponentParams: {
                icon: "fa-edit",
              },
              valueFormatter: function (params) { // Formatter for DISPLAY (Keep robust version)
                if (!params.value) return '';
                let date;
                if (params.value instanceof Date) {
                  date = params.value;
                } else if (typeof params.value === 'string') {
                  const parts = params.value.split('-');
                  if (parts.length === 3) {
                    date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                  }
                }
                if (!date || isNaN(date)) return '';
                const formattedMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
                const formattedDay = String(date.getUTCDate()).padStart(2, '0');
                const formattedYear = String(date.getUTCFullYear()).slice(-2);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
                const diffTime = dateOnly.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return `${formattedMonth}/${formattedDay}/${formattedYear} (${diffDays})`;
              },
              // valueGetter: function (params) { ... }, // <-- REMOVE THIS ENTIRE FUNCTION
              comparator: function (valueA, valueB, nodeA, nodeB, isInverted) { // Keep robust version
                 const getDateObject = (value) => {
                    if (!value) return null;
                    if (value instanceof Date) return value;
                    if (typeof value === 'string') {
                        const parts = value.split('-');
                        if (parts.length === 3) {
                          const date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                          return isNaN(date) ? null : date;
                        }
                    }
                    return null;
                 };
                 const dateA = getDateObject(valueA);
                 const dateB = getDateObject(valueB);
                 if (dateA === null && dateB === null) return 0;
                 if (dateA === null) return isInverted ? -1 : 1;
                 if (dateB === null) return isInverted ? 1 : -1;
                 return dateA.getTime() - dateB.getTime();
              },
              filterParams: { // Keep robust version
                filters: [
                  {
                    filter: 'agDateColumnFilter',
                    browserDatePicker: true
                  }
                ],
                comparator: function (filterLocalDateAtMidnight, cellValue) {
                  
                  // cellValue is expected as "YYYY-MM-DD"
                  if (!cellValue) return -1;
                  let cellDate;
                  if (cellValue instanceof Date) {
                    cellDate = cellValue;
                  } else if (typeof cellValue === 'string') {
                    const parts = cellValue.split('-');
                    if (parts.length === 3) {
                      // Create a local date (not UTC)
                      cellDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    }
                  }
                  if (!cellDate || isNaN(cellDate)) return -1;
                
                  // Remove time from both dates
                  const cellDay = cellDate.getDate(), cellMonth = cellDate.getMonth(), cellYear = cellDate.getFullYear();
                  const filterDay = filterLocalDateAtMidnight.getDate(), filterMonth = filterLocalDateAtMidnight.getMonth(), filterYear = filterLocalDateAtMidnight.getFullYear();
                  const cmp = (() => {
                    if (cellYear < filterYear) return -1;
                    if (cellYear > filterYear) return 1;
                    if (cellMonth < filterMonth) return -1;
                    if (cellMonth > filterMonth) return 1;
                    if (cellDay < filterDay) return -1;
                    if (cellDay > filterDay) return 1;
                    return 0;
                  })();
                  /*
                  console.log(
                    "cellValue:", cellValue,
                    "| cellDate:", cellDate.toDateString(),
                    "| filterDate:", filterLocalDateAtMidnight.toDateString(),
                    "| comparator result:", cmp
                  );
                  */
                  return cmp;
                  if (cellYear < filterYear) return -1;
                  if (cellYear > filterYear) return 1;
                  if (cellMonth < filterMonth) return -1;
                  if (cellMonth > filterMonth) return 1;
                  if (cellDay < filterDay) return -1;
                  if (cellDay > filterDay) return 1;
                  return 0;
                },
              },
              onCellValueChanged: function(params) { // Keep previous robust version
                const fieldName = params.colDef.field;
                if (fieldName === 'closingDate') {
                  const appId = params.data.app;
                  let newDateValue = params.newValue;
                  let dateStringForApi;
                  
                  // Ensure consistent date format
                  if (newDateValue instanceof Date) {
                    // If it's a Date object, format it as YYYY-MM-DD
                    const year = newDateValue.getFullYear();
                    const month = String(newDateValue.getMonth() + 1).padStart(2, '0');
                    const day = String(newDateValue.getDate()).padStart(2, '0');
                    dateStringForApi = `${year}-${month}-${day}`;
                  } else if (typeof newDateValue === 'string') {
                     // If it's already a string, pass it through (will be validated by formatClosingDate)
                     dateStringForApi = newDateValue;
                  } else if (newDateValue === null || newDateValue === undefined || newDateValue === '') {
                     // If it's empty, set to null
                     dateStringForApi = null;
                  } else {
                     console.error("Unexpected date value type:", newDateValue);
                     toastr.error('Invalid date value entered.');
                     return;
                  }
                  const formattedDate = formatClosingDate(dateStringForApi);
                  if (dateStringForApi && !formattedDate) {
                    toastr.error('Invalid date format. Please use YYYY-MM-DD.');
                     return;
                  }
                  console.log(`Value from Editor/Input: ${newDateValue}`);
                  console.log(`Formatted Closing Date for API: ${formattedDate}`);
                  chrome.storage.local.get(['gridtoken'], function(result) {
                    const token = result.gridtoken;
                    if (!token) {
                      console.error('Token not found in chrome.storage.');
                      toastr.error('Authentication token not found.');
                      return;
                    }
                    const getUrl = `https://api.nanolos.com/nano/apps/${appId}`;
                    console.log(`GET URL: ${getUrl}`);
                    fetch(getUrl, {
                      method: 'GET',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' }
                    })
                    .then(response => {
                      if (!response.ok) { return response.text().then(text => { throw new Error(`Failed to fetch app details. Status: ${response.status}, Message: ${text}`); }); }
                      return response.json();
                    })
                    .then(appDataJsonApi => {
                      console.log('GET Response (assuming JSON:API):', appDataJsonApi);
                      if (!appDataJsonApi || !appDataJsonApi.data || !appDataJsonApi.data.attributes) { throw new Error('Invalid app data structure received from GET request.'); }
                      appDataJsonApi.data.attributes['closing-date'] = formattedDate;
                      console.log('PATCH Payload (modified JSON:API):', JSON.stringify(appDataJsonApi, null, 2));
                      return fetch(getUrl, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' },
                        body: JSON.stringify(appDataJsonApi)
                      });
                    })
                    .then(response => {
                      console.log(`PATCH Response Status: ${response.status}`);
                      if (!response.ok) {
                        return response.text().then(text => {
                          console.error(`PATCH Response Text: ${text}`);
                          let errorDetail = text; try { const errorJson = JSON.parse(text); if (errorJson.errors && errorJson.errors.length > 0) { errorDetail = errorJson.errors.map(e => e.detail || e.title).join(', '); } } catch (e) {}
                          throw new Error(`HTTP error! status: ${response.status}, message: ${errorDetail}`);
                        });
                      }
                      return response.text().then(text => { try { return text ? JSON.parse(text) : {}; } catch (e) { console.warn("PATCH response OK but not JSON.", text); return {}; } });
                    })
                    .then(data => {
                      console.log('Closing date updated successfully:', data);
                      //params.node.setDataValue(params.colDef.field, formattedDate); // Explicitly set string
                      params.api.refreshCells({ rowNodes: [params.node], columns: [params.colDef.colId], force: true }); // Refresh just the cell
                      toastr.success('Closing Date Updated');
                    })
                    .catch(error => {
                      console.error('Error updating closing date:', error);
                      toastr.error(`Failed to update closing date: ${error.message}`);
                      // Revert on failure
                       params.node.setDataValue(params.colDef.field, params.oldValue);
                       params.api.refreshCells({ rowNodes: [params.node], columns: [params.colDef.colId], force: true });
                    });
                  });
                }
              }, // End onCellValueChanged
            }, // End closingDate Column Definition
            {headerName: "Borrower",
              colId: 'borrowerName',
                //filter: 'agTextColumnFilter',
                //floatingFilter: true,
                pinned: 'left',
                valueGetter: function(params) {
                  if (!params.data) {
                    return null; // Return null if params.data is undefined
                  }
          
                  const firstName = params.data.firstName || '';
                  const lastName = params.data.lastName || '';
          
                  return `${firstName} ${lastName}`;
                },
              filter: true
            },  
            {headerName: "Status",
              colId: 'currentStatus',
              cellClass: 'small-font',
              field: "currentStatus",
              filter: "agSetColumnFilter",
              pinned: 'left',
              width: 100,           
              valueGetter: function(params) {
                if (!params.data) {
                  return null; // Return null if params.data is undefined
                }
                if(params.data.queueType === 'Restructure Loan File') {
                  return 'Restructure';
                }
                if(params.data.isSuspended === true) {
                  return 'Suspended';
                }

                if(params.data.currentStatus === 'Submitted for Underwriting' ) {
                  return 'Re-Submitted';
                }

              
                if (params.data.nanoQueue === 'InitialReviewConditionsSubmitted' && 
                  params.data.queueEndDate === null &&
                  ![
                    'Clear to Close',
                    'Closing Documents Prepared',
                    'Closed',
                    'Released to Closer',
                    'Funded',
                    'Balance / Scheduling Requested'
                  ].includes(params.data.currentStatus)
                ) {
                  return 'Re-Submitted';
                }

                if (params.data.nanoQueue === 'FinalConditionsSubmitted' &&
                  params.data.queueEndDate === null &&
                  ![
                    'Clear to Close',
                    'Closing Documents Prepared',
                    'Closed',
                    'Released to Closer',
                    'Funded',
                    'Balance / Scheduling Requested'
                  ].includes(params.data.currentStatus)
                ) {
                  return 'Re-Submitted';  
                }
                
                if(params.data.currentStatus === 'Underwritten' || params.data.currentStatus === 'Initial Review Complete (Pre-Approval)' || params.data.currentStatus === 'Initial Review Complete (Pre-Approval)') {
                  return 'Processing';
                }
                return params.data.currentStatus;
              },


              // Create custom sort order for status column
              comparator: function (status1, status2) {
                const statusOrder = {
                    'Prospect': 1,
                    'Pre-Qualified': 2,
                    'Application Date': 3,
                    'Pre-Approval Process Started': 4,
                    'Pre-Processing': 5,
                    'Submitted for Initial Review': 6,
                    'Submitted for Pre-Approval': 7,
                    'Initial Review Complete (Pre-Approval)': 8,
                    'Initial Review Complete': 9,
                    'Initial Review Conditions Submitted': 10,
                    'Processing': 11,
                    'Submitted for Underwriting': 12,
                    'Underwritten': 13,
                    'Re-Submitted': 14,
                    'Clear to Close': 15,
                    'Balance / Scheduling Requested': 16,
                    'Released to Closer': 17,
                    'Closing Documents Requested': 18,
                    'Closing Documents Prepared': 19,
                    'Instructions Sent': 20,
                    'Closed': 21,
                    'Funded': 22,
                    'Shipped': 23,
                    'Shipping Received': 24,
                    'Investor Reviewed': 25,
                    'Purchased': 26,
                    'Cancelled': 27,
                    'Suspended': 28,
                    'Restructure': 29,
                    
                };
            
                // Ensure status1 and status2 are strings before comparison
                const statusStr1 = typeof status1 === 'string' ? status1 : (status1?.value || '');
                const statusStr2 = typeof status2 === 'string' ? status2 : (status2?.value || '');
            
                const order1 = statusOrder[statusStr1] !== undefined ? statusOrder[statusStr1] : Number.MAX_SAFE_INTEGER;
                const order2 = statusOrder[statusStr2] !== undefined ? statusOrder[statusStr2] : Number.MAX_SAFE_INTEGER;
            
                return order1 - order2;
              },
              // Put colored icon before status text
              cellRenderer: function (params) {
                const container = document.createElement('div');
                const status = document.createElement('span');
                status.innerText = params.value;
                container.appendChild(status);
            
                const icon = document.createElement('span');
                icon.style.marginLeft = '5px';
                icon.style.fontSize = '15px';
                icon.style.verticalAlign = 'top';
            
                switch (params.value) {
                  case 'Processing':
                  case 'Pre-Processing':
                    icon.innerHTML = '🟦';
                    break;
                  case 'Re-Submitted':
                  case 'Underwritten':
                  case 'Submitted for Underwriting':
                  case 'Submitted for Initial Review':
                  case 'Initial Review Complete':
                  case 'Initial Review Complete (Pre-Approval)':
                  case 'Initial Review Conditions Submitted':
                  case 'Final Conditions Submitted':
                    icon.innerHTML = '🟨';
                    break;
                  case 'Prospect':
                  case 'Pre-Approval Process Started':
                  case 'Pre-Qualified':
                  
                  case 'Application Date':
                    icon.innerHTML = '⬜';
                    icon.style.color = 'darkgrey';
                    break;
                  case 'Released to Closer':
                  case 'Clear to Close':
                  case 'Closing Documents Requested':
                  case 'Closing Documents Prepared':
                  case 'Balance / Scheduling Requested':
                  case 'Closed':
                    icon.innerHTML = '🟩';
                    break;
                  case 'Funded':
                  case 'Shipped':
                  case 'Shipping Received':
                  case 'Investor Reviewed':
                    icon.innerHTML = '🟪';
                    break;
                  case 'Purchased':
                    icon.innerHTML = '⬛';
                    break;
                  case 'Suspended':
                  case 'Cancelled':
                  case 'Restructure':
                    icon.innerHTML = '🔴';
                    break;
                  default:
                    icon.innerHTML = '';
                    break;
                }
            
                container.prepend(icon);
                return container;
              },
              filterParams: {
                applyMiniFilterWhileTyping: true,
                cellRenderer: function(params) {
                  const icon = document.createElement('span');
                  icon.style.fontSize = '15px';
                  icon.style.verticalAlign = 'top';
            
                  switch (params.value) {
                    case 'Processing':
                    case 'Pre-Processing':
                      icon.innerHTML = '🟦';
                      break;
                    case 'Re-Submitted':
                    case 'Underwritten':
                    case 'Submitted for Underwriting':
                    case 'Submitted for Initial Review':
                    case 'Initial Review Complete':
                    case 'Initial Review Complete (Pre-Approval)':
                    case 'Initial Review Conditions Submitted':
                    case 'Final Conditions Submitted':
                      icon.innerHTML = '🟨';
                      break;
                    case 'Prospect':
                    case 'Pre-Approval Process Started':
                    case 'Pre-Qualified':

                    case 'Application Date':
                      icon.innerHTML = '⬜';
                      icon.style.color = 'darkgrey';
                      break;
                    case 'Released to Closer':
                    case 'Clear to Close':
                    case 'Closing Documents Prepared':
                    case 'Closing Documents Requested':
                    case 'Balance / Scheduling Requested':
                    case 'Closed':
                      icon.innerHTML = '🟩';
                      break;
                    case 'Funded':
                    case 'Shipped':
                    case 'Shipping Received':
                    case 'Investor Reviewed':
                      icon.innerHTML = '🟪';
                      break;
                    case 'Purchased':
                      icon.innerHTML = '⬛';
                      break;
                    case 'Suspended':
                    case 'Cancelled':
                    case 'Restructure':
                      icon.innerHTML = '🔴';
                    break;
                    default:
                      icon.innerHTML = '';
                      break;
                  }
            
                  const container = document.createElement('div');
                  container.appendChild(icon);
            
                  const status = document.createElement('span');
                  status.innerText = params.value;
                  container.appendChild(status);
            
                  return container;
                }
              },
              //⬛🟩🟦🟨
            },


                //spacer
        // { headerName: "", field: "spacer1", width:1, suppressSizeToFit: true, suppressColumnsToolPanel:true, suppressFilterToolPanel:true, suppressHeaderMenuButton: true, filter:false, cellClass: 'spacer-cell',},
  
        { headerName: "Lock",
          colId: 'lockGroup',
          marryChildren: true,
          children: [
            {headerName: "Status",
              colId: 'lockStatus',
              columnGroupShow: 'open',
              filter: 'agSetColumnFilter', 
              width: 80, 
              cellClass: 'left-border',
              valueGetter: function(params) {
                if (!params.data) {
                  return null; // Return null if params.data is undefined
                }

                // --- Helper Functions (defined locally for clarity) ---
                const formatDate = (date) => {
                  if (!date || isNaN(date)) return null;
                  const year = date.getFullYear();
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const day = date.getDate().toString().padStart(2, '0');
                  return `${year}-${month}-${day}`;
                };

                const parseDate = (dateString) => {
                  if (!dateString || typeof dateString !== 'string') return null;
                  const parts = dateString.split('-');
                  if (parts.length !== 3) return null;
                  const date = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]); // Assumes YYYY-MM-DD string
                  return isNaN(date) ? null : date;
                };

                // --- Get Raw Values ---
                const lockExpirationDateValue = params.data.lockExpirationDate; // Expect string 'YYYY-MM-DD...' or null
                const closingDateValue = params.data.closingDate; // Expect string 'YYYY-MM-DD...' OR Date object OR null

                // --- Get Closing Date as 'YYYY-MM-DD' String ---
                let closingDateString = null;
                if (closingDateValue instanceof Date) {
                    closingDateString = formatDate(closingDateValue); // Format Date object
                } else if (typeof closingDateValue === 'string') {
                    closingDateString = closingDateValue.split('T')[0]; // Extract date part if string
                }

                // We need a valid closing date to calculate status
                if (!closingDateString) {
                    return null;
                }

                // --- Get Lock Expiration as 'YYYY-MM-DD' String ---
                const lockExpirationDateString = lockExpirationDateValue ? lockExpirationDateValue.split('T')[0] : null;

                // --- Parse Strings to Date objects for comparison ---
                const lockExpirationDate = lockExpirationDateString ? parseDate(lockExpirationDateString) : null;
                const closingDate = parseDate(closingDateString); // Use the guaranteed string

                // Check if parsing was successful
                if (!closingDate) {
                    console.warn("Could not parse closingDateString:", closingDateString);
                    return null;
                }
                 if (lockExpirationDateString && !lockExpirationDate) {
                     console.warn("Could not parse lockExpirationDateString:", lockExpirationDateString);
                     // Decide how to handle - maybe treat as not locked? Or return null?
                     // Let's proceed assuming lock is null if parse failed.
                 }


                // --- Normalize Dates to Midnight for comparison ---
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                closingDate.setHours(0, 0, 0, 0);
                if (lockExpirationDate) {
                  lockExpirationDate.setHours(0, 0, 0, 0);
                }

                // --- Logic for Status ---
                const formattedCurrentDate = formatDate(currentDate);
                const formattedClosingDate = formatDate(closingDate);
                const formattedLockExpirationDate = lockExpirationDate ? formatDate(lockExpirationDate) : null;

                // Using direct time comparison for clarity where possible
                const closingTime = closingDate.getTime();
                const currentTime = currentDate.getTime();
                const lockExpirationTime = lockExpirationDate ? lockExpirationDate.getTime() : null;

                if (lockExpirationTime !== null && lockExpirationTime >= closingTime) {
                  return 'Locked';
                }
                if (lockExpirationTime !== null && lockExpirationTime < currentTime) {
                  return 'Expired';
                }
                if (lockExpirationTime !== null && lockExpirationTime >= currentTime && lockExpirationTime < closingTime) {
                  return 'Expires Before Closing';
                }
                // Need lock if no lock AND closing date is within 31 days from now AND closing date is today or later
                if (lockExpirationTime === null && (closingTime - currentTime) < (31 * 24 * 60 * 60 * 1000) && closingTime >= currentTime) {
                  return 'Need Lock';
                }

                return null; // Default if none of the conditions are met
              },
              //add url to "Not Locked" when loan is "Not Locked"
              cellRenderer: function(params) {
  
                if (params.value === 'Not Locked') {
                  var container = document.createElement('div');
                  var link = document.createElement('a');
                  link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.data.app}`+'/fees';
                  link.target = '_blank';
                  link.innerText = params.value;
                  container.appendChild(link);
                  //add cell style
                  
                  return container;
                } else if (params.value === 'Locked') {
                  var span = document.createElement('span');
                  span.innerHTML = 'Locked';
                  span.style.color = 'darkgreen';
                  span.style.backgroundColor = 'rgb(233 255 233)';
                  span.style.padding = '2px 6px 3px 6px';
                  span.style.borderRadius = '1px';
                  span.style.fontWeight = '600';
                  span.style.fontSize = 'x-small';
                  span.style.border = '1px solid green';
                  span.title = 'Locked';
  
                  return span;
  
                } else if (params.value === 'Expired') {
                  var link = document.createElement('a');
                  link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.data.app}/fees`;
                  link.target = '_blank';
                  link.title = 'Expired';
                
                  var span = document.createElement('span');
                  span.innerHTML = 'Expired';
                  span.style.color = 'darkred';
                  span.style.backgroundColor = 'rgb(255 246 246)';
                  span.style.padding = '2px 6px 3px 6px';
                  span.style.borderRadius = '1px';
                  span.style.fontWeight = '500';
                  span.style.fontSize = 'x-small';
                  span.style.border = '1px solid red';
                  link.style.textDecoration = 'none';
                
                  link.appendChild(span);
                
                  return link;
                } else if (params.value === 'Expires Before Closing') {
                  var link = document.createElement('a');
                  link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.data.app}/fees`;
                  link.target = '_blank';
                  link.title = 'Expires Before Closing';
                
                  var span = document.createElement('span');
                  span.innerHTML = 'Expires';
                  span.style.color = '#651919';
                  span.style.backgroundColor = 'rgb(255 255 216)';
                  span.style.padding = '2px 6px 3px 6px';
                  span.style.borderRadius = '1px';
                  span.style.fontWeight = '500';
                  span.style.border = '1px solid rgb(159 108 0)';
                  span.style.fontSize = 'x-small';
                  link.style.textDecoration = 'none';
                  link.appendChild(span);
                
                  return link;
                } else if (params.value === 'Need Lock') {
                  var link = document.createElement('a');
                  link.href = `https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${params.data.app}/fees`;
                  link.target = '_blank';
                  link.title = 'Closing within 30 days, please lock.';
                
                  var span = document.createElement('span');
                  span.innerHTML = 'Needed';
                  span.style.color = 'rgb(0 53 255)';
                  span.style.backgroundColor = 'rgb(216 234 255)';
                  span.style.padding = '3px 6px 3px 4px';
                  span.style.borderRadius = '1px';
                  span.style.fontWeight = '500';
                  span.style.border = '1px solid rgb(78 142 255)';
                  span.style.fontSize = 'x-small';
                  link.style.textDecoration = 'none';
                  link.appendChild(span);
                
                  return link;
                }
                return params.value;
              },
              
  
  
            },
            { headerName: "Expiration",
              columnGroupShow: 'open',
              field: "lockExpirationDate", 
              width: 100,
              filter: 'agDateColumnFilter',
              cellClass: 'small-font',
            
              valueFormatter: function (params) {
                if (params.value) {
                  // Parse the date string in the format YYYY-MM-DD
                  const [year, month, day] = params.value.split('-');
                  const date = new Date(year, month - 1, day); // Month is 0-based in JavaScript Date
              
                  const today = new Date();
                  // Clear the time part of the current date
                  today.setHours(0, 0, 0, 0);
              
                  const diffTime = date.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
                  return `${month}/${day}/${year.slice(-2)} (${diffDays})`;
                }
                return '';
              },
              comparator: function (date1, date2, nodeA, nodeB, isInverted) {
                if (!date1 && !date2) {
                  return 0; // Both are blank
                }
                if (!date1) {
                  return isInverted ? -1 : 1; // Blank dates go to the bottom
                }
                if (!date2) {
                  return isInverted ? 1 : -1; // Blank dates go to the bottom
                }
              
                const parseDate = (dateString) => {
                  const [year, month, day] = dateString.split('-');
                  return new Date(year, month - 1, day);
                };
              
                const parsedDate1 = parseDate(date1);
                const parsedDate2 = parseDate(date2);
              
                return parsedDate1 - parsedDate2; // Normal date comparison
              }
            ,
            filterParams: {
              comparator: function (filterDateRaw, cellValue) {
                if (!cellValue) return -1;
            
                const parseDate = (dateString) => {
                  const [year, month, day] = dateString.split('-');
                  return new Date(year, month - 1, day);
                };
            
                const cellDate = parseDate(cellValue);
                const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const filterDate = normalizeDate(filterDateRaw);
                const cellDateNormalized = normalizeDate(cellDate);
            
                if (cellDateNormalized < filterDate) {
                  return -1;
                }
                if (cellDateNormalized > filterDate) {
                  return 1;
                }
            
                return 0;
              }
            },
            },
            { headerName: "Rate", 
              field: "rate", width: 70,
              columnGroupShow: 'open',
              cellClass: 'right-border',
            },
          ],
        },
        { headerName: "Disclosures",
          children: [
          { headerName: "Initial Sent",
            filter: 'agSetColumnFilter',
            field: "initialDisclosuresSent",
            cellClass: 'left-border',
            cellStyle: params => {
              var toggleFormatting = document.getElementById('toggle-formatting').checked;
              if (!toggleFormatting){
                return;
              }
              if (params.data && params.data.initialDisclosuresSent === null) {
                return{ backgroundColor: 'rgb(252,171,171)',
                        //cursor: 'pointer',
                };
              }
            },
            
            valueFormatter: function (params) {
              // Format date for display, blank fields show as empty string
              return formatDateToMMDDYY(params.value);
          },
          filterParams: {
            values: (params) => {
              const uniqueValues = new Set();
          
              params.api.forEachNode(node => {
                if (node.data) {
                  const rawValue = node.data.initialDisclosuresSent;
                  const formattedValue = formatDateToMMDDYY(rawValue);
                  // If blank, we represent it as '(Blank)' in both filter and getter
                  uniqueValues.add(formattedValue || '(Blank)');
                }
              });
          
              params.success(Array.from(uniqueValues));
            },
          },
          valueGetter: function (params) {
              // For filtering, return '(Blank)' if there's no date
              return params.data?.initialDisclosuresSent
                  ? formatDateToMMDDYY(params.data.initialDisclosuresSent)
                  : '(Blank)';
          }
          },
          { headerName: "Initial Signed", 
            field: "initialDisclosuresSigned",
            cellStyle: params => {
              var toggleFormatting = document.getElementById('toggle-formatting').checked;
              if (!toggleFormatting){
                return;
              }
              if (params.data && params.data.initialDisclosuresSigned === null) {
                return{ backgroundColor: 'rgb(252,171,171)',
                        //cursor: 'pointer',
                };
              }
            },
            valueFormatter: function (params) {
              // Format date for display, blank fields show as empty string
              return formatDateToMMDDYY(params.value);
          },
          filterParams: {

              values: (params) => {
                  const uniqueValues = new Set();
  
                  params.api.forEachNode(node => {
                      const rawValue = node.data.initialDisclosuresSigned;
                      const formattedValue = formatDateToMMDDYY(rawValue);
                      // If blank, we represent it as '(Blank)' in both filter and getter
                      uniqueValues.add(formattedValue || '(Blank)');
                  });
  
                  params.success(Array.from(uniqueValues)); 
              },

          },
          valueGetter: function (params) {
              // For filtering, return '(Blank)' if there's no date
              return params.data?.initialDisclosuresSigned
                  ? formatDateToMMDDYY(params.data.initialDisclosuresSigned)
                  : '(Blank)';
          }
          },
          { headerName: "CD Sent",
            field: "closingDisclosureSent",
            cellStyle: params => {
              var toggleFormatting = document.getElementById('toggle-formatting').checked;
              if (!toggleFormatting){
                return;
              }
              
              if (params.data && params.data.closingDisclosureSent === null) {
                return{ backgroundColor: 'rgb(252,171,171)',
                        //cursor: 'pointer',
                };
              }
            },
            valueFormatter: function (params) {
              // Format date for display, blank fields show as empty string
              return formatDateToMMDDYY(params.value);
          },
          filterParams: {
            treeList: true,
              values: (params) => {
                  const uniqueValues = new Set();
  
                  params.api.forEachNode(node => {
                      const rawValue = node.data.closingDisclosureSent;
                      const formattedValue = formatDateToMMDDYY(rawValue);
                      // If blank, we represent it as '(Blank)' in both filter and getter
                      uniqueValues.add(formattedValue || '(Blank)');
                  });
  
                  params.success(Array.from(uniqueValues)); 
              },

          },
          valueGetter: function (params) {
              // For filtering, return '(Blank)' if there's no date
              return params.data?.closingDisclosureSent
                  ? formatDateToMMDDYY(params.data.closingDisclosureSent)
                  : '(Blank)';
          }
          },
          { headerName: "CD Signed",
            field: "closingDisclosureSigned",
            cellClass: 'right-border',
            cellStyle: params => {
              var toggleFormatting = document.getElementById('toggle-formatting').checked;
              if (!toggleFormatting){
                return;
              }
              if (params.data && params.data.closingDisclosureSigned === null) {
                return{ backgroundColor: 'rgb(252,171,171)',
                        //cursor: 'pointer',
                };
              }
            },
            valueFormatter: function (params) {
              // Format date for display, blank fields show as empty string
              return formatDateToMMDDYY(params.value);
            },
            filterParams: {
                values: (params) => {
                    const uniqueValues = new Set();
    
                    params.api.forEachNode(node => {
                        const rawValue = node.data.closingDisclosureSigned;
                        const formattedValue = formatDateToMMDDYY(rawValue);
                        // If blank, we represent it as '(Blank)' in both filter and getter
                        uniqueValues.add(formattedValue || '(Blank)');
                    });
    
                    params.success(Array.from(uniqueValues)); 
                },

            },
            valueGetter: function (params) {
                // For filtering, return '(Blank)' if there's no date
                return params.data?.closingDisclosureSigned
                    ? formatDateToMMDDYY(params.data.closingDisclosureSigned)
                    : '(Blank)';
            }
          }
          ],
        },
        { headerName: "Appraisal",
          marryChildren: true,
          children: [
            { headerName: "Ordered", 
              field: "appraisalOrdered", 
              width: 100,
              cellClass: 'left-border',
              cellClass: 'small-font',
              valueFormatter: function (params) {
                // Format date for display, blank fields show as empty string
                return formatDateToMMDDYY(params.value);
            },
            filterParams: {
              treeList: true,
                values: (params) => {
                    const uniqueValues = new Set();
    
                    params.api.forEachNode(node => {
                        const rawValue = node.data.initialDisclosuresSent;
                        const formattedValue = formatDateToMMDDYY(rawValue);
                        // If blank, we represent it as '(Blank)' in both filter and getter
                        uniqueValues.add(formattedValue || '(Blank)');
                    });
    
                    params.success(Array.from(uniqueValues)); 
                },
  
            },
            valueGetter: function (params) {
                // For filtering, return '(Blank)' if there's no date
                return params.data?.appraisalOrdered
                    ? formatDateToMMDDYY(params.data.appraisalOrdered)
                    : '(Blank)';
            }
            },
            { headerName: "Completed", 
              field: "appraisalCompleted", 
              width: 100,
              cellClass: 'small-font',
              valueFormatter: function (params) {
                // Format date for display, blank fields show as empty string
                return formatDateToMMDDYY(params.value);
            },
            filterParams: {
              treeList: true,
                values: (params) => {
                    const uniqueValues = new Set();
    
                    params.api.forEachNode(node => {
                        const rawValue = node.data.appraisalCompleted;
                        const formattedValue = formatDateToMMDDYY(rawValue);
                        // If blank, we represent it as '(Blank)' in both filter and getter
                        uniqueValues.add(formattedValue || '(Blank)');
                    });
    
                    params.success(Array.from(uniqueValues)); 
                },
  
            },
            valueGetter: function (params) {
                // For filtering, return '(Blank)' if there's no date
                return params.data?.appraisalCompleted
                    ? formatDateToMMDDYY(params.data.appraisalCompleted)
                    : '(Blank)';
            }
            },
            { headerName: "Value",
              field: 'appraisedValue',
              width: 60,
              cellClass: 'small-font',
              floatingFilter: false,
              suppressHeaderMenuButton: true,
              suppressHeaderFilterButton: true,
              valueFormatter: function(params) {
                return params.value ? '$' + params.value.toLocaleString() : '';
              },
              floatingFilterComponentParams: {
                suppressFloatingFilterButton: true,
              },
            },
            { headerName: "+/-",
              colId: 'appraisal-value-diff',
              cellClass: 'right-border',
              cellClass: 'small-font',
              floatingFilter: false,
              suppressHeaderMenuButton: true,
              suppressHeaderFilterButton: true,
              floatingFilterComponentParams: {
                suppressFloatingFilterButton: true,
              },
              width: 60, 
              valueGetter: function(params) {
                //if appraisedValue is null or undefined, return 0, otherwise return the difference between appraisedValue and salesPrice
                if (params.data?.appraisedValue === null || params.data?.appraisedValue === undefined) {  
                  return 0;
                } else if (params.data?.loanPurpose === 'Purchase') {
                  return params.data?.appraisedValue - params.data?.salesPrice;
                } else {
                  return params.data?.appraisedValue - params.data?.loanAmount;
                }
              },
              //format background to light red and text to dark red if value is negative
              cellStyle: params => {
                if (params.value < 0) {
                  return { backgroundColor: 'rgb(252,171,171)', color: 'rgb(139,0,0)'};

                } else if (params.value > 0) {
                  return { backgroundColor: 'rgb(171,252,171)', color: 'rgb(0, 39, 0)'};
                } 
              },
            },
            { headerName: "Appraisal Deadline", field: "appraisalDeadline", filter: true, hide: true 
            },
          ],
        },
        { headerName: "Street Address", 
          field: "streetAddress", 
          filter: 'agMultiColumnFilter', 
        },

        
        {headerName: "Referral Source_old",
          //minWidth: 100,
          field: "referralSource",
          filter: 'agMultiColumnFilter',
          maxWidth: 250,
          cellClass: 'small-font',
          //editable: true,
          //cellEditor: 'agLargeTextCellEditor',
          //cellEditorPopup: true,
          hide: true,
          
          cellEditorParams: {
            rows: 2,
            cols: 50,
          },
          headerComponentParams: {
            icon: "fa-edit",
          },
          /*
          cellRenderer: function(params) {
            if (params.value === null || params.value === undefined) {
              // Create a container div
              const container = document.createElement('div');
              //container.style.display = 'flex';
              //container.style.alignItems = 'center';
              //container.style.justifyContent = 'center';
        
              // Create the Font Awesome icon element
              const icon = document.createElement('i');
              icon.classList.add('fa', 'fa-edit');
              icon.style.color = 'rgb(237, 100, 100)'; // Optional: Set the icon color
              icon.style.cursor = 'pointer'; // Make the icon clickable
        
              // Add click event listener to simulate double-click
              icon.addEventListener('click', function() {
                const cellElement = params.eGridCell;
                const dblClickEvent = new MouseEvent('dblclick', {
                  bubbles: true,
                  cancelable: true,
                  view: window
                });
        
                // Dispatch two consecutive dblclick events
                cellElement.dispatchEvent(dblClickEvent);
                cellElement.dispatchEvent(dblClickEvent);
              });
        
              // Append the icon to the container
              container.appendChild(icon);
        
              return container;
            } else {
              return params.value;
            }
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
                      // Redraw the grid to reflect the changes
                      redrawDataGridOnChange();
                      toastr.success('Referral Source Deleted');
                    })
                    .catch(error => {
                      console.error('Error deleting profile value:', error);
                      toastr.error('Error updating Referral Source!', error);
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
                      // Redraw the grid to reflect the changes
                      redrawDataGridOnChange();
                      toastr.success('Referral Source Updated', data);
                    })
                    .catch(error => {
                      console.error('Error updating profile value:', error);
                      toastr.error('Error updating Referral Source!', error);
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
                    // Redraw the grid to reflect the changes
                    redrawDataGridOnChange();
                    toastr.success('Referral Source added:', data);
                  })
                  .catch(error => {
                    console.error('Error creating profile value:', error);
                    toastr.error('Error adding Referral Source!', error);
                  });
                }
              })
              .catch(error => {
                console.error('Error fetching app profile values:', error);
                toastr.error('Error updating Referral Source!', error);
              });
            });
          }
            */
        },
        

        {headerName: "Referral Source",
          //minWidth: 100,
          field: "referralSource",
          filter: 'agMultiColumnFilter',
          width: 250,
          cellClass: 'small-font',
          //editable: true,
          //cellEditor: 'agLargeTextCellEditor',
          //cellEditorPopup: true,
          
          cellEditorParams: {
            rows: 2,
            cols: 50,
          },
          headerComponentParams: {
            icon: "fa-edit",
          },
          cellRenderer: function(params) {
            // 1. Always create the container and icon
            const container = document.createElement('div');
            // Add some basic styling for alignment if needed
            //container.style.display = 'flex';
            //container.style.alignItems = 'center'; 
            //container.style.paddingRight = '8px'; // Add space between icon and text

            const icon = document.createElement('i');
            icon.classList.add('fa-solid', 'fa-edit');
            icon.style.color = 'rgb(237, 100, 100)'; 
            icon.style.cursor = 'pointer'; 
            icon.title = 'Edit Referral Source'; // Tooltip
            icon.style.marginRight = '4px'; // Add space between icon and text

            // 2. Add click listener to the icon
            icon.addEventListener('click', function() {
              // get the appId from the params.data
              const appId = params.data.app;
              // open url https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/249079/contacts
             // window.open(`https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${appId}/contacts`, '_blank');

              const modalElement = document.getElementById('referral-source-editor');
              const modalTitleElement = document.getElementById('referral-source-editor-title'); // Get the title element

              if (modalElement && modalTitleElement && params.data) { // Check if elements and row data exist
                // Get the appId from the params.data (assuming 'app' is the field name)
                const appId = params.data.app; 

                if (appId !== null && appId !== undefined) {
                   // Update the modal title
                   modalTitleElement.textContent = `Referral Source - ${appId}`;
                   
                   // Store the appId on the modal element itself for later access
                   modalElement.dataset.appId = appId; // Use data-* attribute for clean storage
                   modalElement.agGridRowNode = params.node;
                   console.log(`Stored appId ${appId} on modal element.`);

                   // Get the Bootstrap Modal instance and show it
                   const bsModal = bootstrap.Modal.getOrCreateInstance(modalElement);
                   bsModal.show();
                } else {
                    console.error('App ID not found in row data:', params.data);
                    alert('Could not determine the Application ID for this row.'); // User feedback
                }

              } else {
                 if (!modalElement) console.error('Bootstrap modal element with ID "referral-source-editor" not found.');
                 if (!modalTitleElement) console.error('Modal title element with ID "exampleModalLabel" not found.');
                 if (!params.data) console.error('Row data (params.data) not available in cellRenderer click listener.');
              }
            });
            
            // 3. Append the icon to the container
            container.appendChild(icon);

            // 4. If a value exists, create a text node/span and append it
            if (params.value !== null && params.value !== undefined) {
              const valueSpan = document.createElement('span');
              valueSpan.textContent = params.value; // Use textContent for safety
              container.appendChild(valueSpan); // Append the value after the icon
            }
            
            // 5. Always return the container
            return container;
          }, // End of cellRenderer,


          
        },

        
        { headerName: "Old Borrower Priority", 
          field: "userSpecifiedQueue",
          width: 140,
          cellClass: 'small-font',
          editable: true,
          hide: true,
          //make cell dropdown editable
          cellEditor: 'agSelectCellEditor',
          headerComponentParams: {
            icon: "fa-edit",
          },
          cellEditorParams: {
            values: ['', 'Hot Lead', 'Rate Shopping', 'Looking for Property', 'Contract Pending', 'Contract Received', 'Credit Work', 'Unable to Pre-Qual', 'Unresponsive', 'Work in Progress', 'Default'],
          },
          // value getter, ignore leading spaces if they exist, then return the value
          valueGetter: function(params) {
            if (!params.data) {
              return null; // Return null if params.data is undefined
            }
            return params.data.userSpecifiedQueue ? params.data.userSpecifiedQueue.trim() : null;
          },
          // value setter, ignore leading spaces if they exist, then set the value
          valueSetter: function(params) {
            if (!params.data) {
              return false; // Return false if params.data is undefined
            }
            params.data.userSpecifiedQueue = params.newValue ? params.newValue.trim() : null;
            return true;
          },
          


          // cell renderer display value followed by a dropdown icon to indicate it is editable make arrow float right.
          // add the classes ag-icon ag-icon-small-down to the dropdown icon to make it look like a dropdown

          cellRenderer: function(params) {
            var container = document.createElement('div');
            var value = document.createElement('span');
            value.innerText = params.value;
            container.appendChild(value);
          
            var dropdown = document.createElement('span');
            dropdown.classList.add('ag-icon', 'ag-icon-small-down');
            dropdown.style.marginTop = '5px';
            dropdown.style.float = 'right';
            dropdown.style.cursor = 'pointer'; // Make the icon clickable
          
            // Add click event listener to simulate double-click
            dropdown.addEventListener('click', function() {
              const cellElement = params.eGridCell;
              const dblClickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window
              });
          
              // Dispatch two consecutive dblclick events
              cellElement.dispatchEvent(dblClickEvent);
              //cellElement.dispatchEvent(dblClickEvent);
            });
          
            container.appendChild(dropdown);
          
            return container;
          },

          // create comparator to sort the values in the dropdown
          comparator: function (valueA, valueB) {
            const priorityOrder = {
              '(Blanks)': 0, // Ensure (Blanks) is at the top
              'Hot Lead': 1,
              'Rate Shopping': 2,
              'Looking for Property': 3,
              'Contract Pending': 4,
              'Contract Received': 5,
              'Credit Work': 6,
              'Unable to Pre-Qual': 7,
              'Unresponsive': 8,
              'Work in Progress': 9,
              'Default': 10,
            };

            const orderA = priorityOrder[valueA] !== undefined ? priorityOrder[valueA] : Number.MAX_SAFE_INTEGER;
            const orderB = priorityOrder[valueB] !== undefined ? priorityOrder[valueB] : Number.MAX_SAFE_INTEGER;

            return orderA - orderB;
          },

          // style the cell to look like a dropdown box so the user knows it can be edited
          cellStyle: params => {

            var toggleFormatting = document.getElementById('toggle-formatting').checked;
            if (!toggleFormatting) {
              return null; // No style if formatting is toggled off
            }
          
            switch (params.value) {
              case 'Looking for Property':
                return { backgroundColor: 'lemonchiffon', cursor: 'pointer', };
              case 'Contract Pending':
                return { backgroundColor: 'lemonchiffon', cursor: 'pointer', };
              case null:
                return { backgroundColor: 'rgb(251, 207, 163)',
                };
              default:
                return {cursor: 'pointer'}; // No style for other values
            }
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
                const referralSourceProfile = appProfileValues.find(value => value.name === 'NorthstarBorrowerPriority');
        
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

                      // Redraw the grid to reflect the changes
                      redrawDataGridOnChange();
                      
                      toastr.success('Borrower Priority Deleted');
                    })
                    .catch(error => {
                      console.error('Error deleting profile value:', error);
                      toastr.error('Error updating Borrower Priority!', error);
                    });
                  } else {
                    // Send a PATCH request to update the value
                    const patchBody = {
                      name: 'NorthstarBorrowerPriority',
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

                      // Redraw the grid to reflect the changes
                      redrawDataGridOnChange();

                      toastr.success('Borrower Priority Updated', data);
                    })
                    .catch(error => {
                      console.error('Error updating profile value:', error);
                      toastr.error('Error updating Borrower Priority!', error);
                    });
                  }
                } else {
                  // If it does not exist, send a POST request to create the value
                  const postUrl = `https://api.nanolos.com/nano/app-profile-values`;
                  const postBody = {
                    name: 'NorthstarBorrowerPriority',
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
                    
                    // Redraw the grid to reflect the changes
                    redrawDataGridOnChange();

                    toastr.success('Borrower Priority added:', data);
                  })
                  .catch(error => {
                    console.error('Error creating profile value:', error);
                  });
                }
              })
              .catch(error => {
                console.error('Error fetching app profile values:', error);
                toastr.error('Error updating Borrower Priority!', error);
              });
            });
          }
        },
        { headerName: "Nano Queue", 
          field: "nanoQueue",
          width: 140,
          cellClass: 'small-font',
          hide: true,
        },

        { headerName: "Borrower Priority", 
          field: "queueType",
          width: 140,
          cellClass: 'small-font',
          editable: true,
          pinned: 'left',
          //make cell dropdown editable
          cellEditor: 'agSelectCellEditor',
          headerComponentParams: {
            icon: "fa-edit",
          },
          cellEditorParams: {
            values: ['Hot Lead', 'Rate Shopping', 'Looking for Property', 'Contract Pending', 'Contract Received', 'Restructure Loan File', 'Submit To Loan Partner', 'Credit Work', 'Unable to Pre-Qual', 'Unresponsive', 'Work in Progress'],
          },

          // value setter, ignore leading spaces if they exist, then set the value
          valueGetter: function(params) {
            // First check if data exists
            if (!params.data) {
                return null;
            }

            if (params.data.isSuspended) {
              return 'Suspended';
            } else {
              // Handle the switch cases
            // Handle the switch cases
            switch (params.data.queueType) {
                case null : return '';
                case '1': return 'Looking for Property';
                case '2': return 'Rate Shopping';
                case '3': return 'Hot Lead';
                case '4': return 'Unresponsive';
                case '5': return 'Credit Work';
                case '6': return 'Work in Progress';
                case '7': return 'Contract Pending';
                case '8': return 'Contract Received';
                case '9': return 'Unable to Pre-Qual';
                case '10': return 'Restructure Loan File';
                case '11': return 'Submit To Loan Partner';
                case 'InitialReviewConditionsSubmitted': return 'Initial Review Conditions Submitted';
                case 'FinalConditionsSubmitted': return 'Final Conditions Submitted';
                //case 'FinalConditionsSubmitted': return 'Submit To Loan Partner';
                //case '1664': return 'Initial Review Conditions Submitted';
                //default: return 'ACTIVE LOAN';
                default: return params.data.queueType;
            }
          }
            
        },
          


          // cell renderer display value followed by a dropdown icon to indicate it is editable make arrow float right.
          // add the classes ag-icon ag-icon-small-down to the dropdown icon to make it look like a dropdown

          cellRenderer: function(params) {
            var container = document.createElement('div');
            var value = document.createElement('span');
            value.innerText = params.value;
            container.appendChild(value);
          
            var dropdown = document.createElement('span');
            dropdown.classList.add('ag-icon', 'ag-icon-small-down');
            dropdown.style.marginTop = '5px';
            dropdown.style.float = 'right';
            dropdown.style.cursor = 'pointer'; // Make the icon clickable
          
            // Add click event listener to simulate a double-click then a single click where the cursor is at the current mouse location
            dropdown.addEventListener('click', function() {
              const cellElement = params.eGridCell;
              const dblClickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              cellElement.dispatchEvent(dblClickEvent);
            });
          
            container.appendChild(dropdown);
          
            return container;
          },

          // create comparator to sort the values in the dropdown
          comparator: function (valueA, valueB) {
            const priorityOrder = {
              '(Blanks)': 0, // Ensure (Blanks) is at the top
              'Hot Lead': 1,
              'Rate Shopping': 2,
              'Looking for Property': 3,
              'Contract Pending': 4,
              'Contract Received': 5,
              'Credit Work': 6,
              'Unable to Pre-Qual': 7,
              'Unresponsive': 8,
              'Work in Progress': 9,
              'Restructure Loan File': 10,
              'Submit to Loan Partner': 11,
              'Suspended': 12,
            };

            const orderA = priorityOrder[valueA] !== undefined ? priorityOrder[valueA] : Number.MAX_SAFE_INTEGER;
            const orderB = priorityOrder[valueB] !== undefined ? priorityOrder[valueB] : Number.MAX_SAFE_INTEGER;

            return orderA - orderB;
          },

          // style the cell to look like a dropdown box so the user knows it can be edited
          cellStyle: params => {

            var toggleFormatting = document.getElementById('toggle-formatting').checked;
            if (!toggleFormatting) {
              return null; // No style if formatting is toggled off
            }
          
            switch (params.value) {
              case 'Looking for Property':
                return { backgroundColor: 'lemonchiffon', cursor: 'pointer', };
              case 'Contract Pending':
                return { backgroundColor: 'lemonchiffon', cursor: 'pointer', };
              case null:
                return { backgroundColor: 'rgb(251, 207, 163)',
                };
              default:
                return {cursor: 'pointer'}; // No style for other values
            }
          },
          onCellValueChanged: function(params) {
            const appId = params.data.app;
            const newValue = params.newValue;
            const token = window.token;

            // Determine the queue type code based on the selected value
            let queueTypeId;
            let queueCode;
            switch (newValue) {
                case 'Looking for Property': queueTypeId = '1'; queueCode = 'LookingforProperty'; break;
                case 'Rate Shopping': queueTypeId = '2'; queueCode = 'RateShopping'; break;
                case 'Hot Lead': queueTypeId = '3'; queueCode = 'HotLead'; break;
                case 'Unresponsive': queueTypeId = '4'; queueCode = 'Unresponsive'; break;
                case 'Credit Work': queueTypeId = '5'; queueCode = 'CreditWork'; break;
                case 'Work in Progress': queueTypeId = '6'; queueCode = 'WorkinProgress'; break;
                case 'Contract Pending': queueTypeId = '7'; queueCode = 'ContractPending'; break;
                case 'Contract Received': queueTypeId = '8'; queueCode = 'ContractReceived'; break;
                case 'Unable to Pre-Qual': queueTypeId = '9'; queueCode = 'UnabletoPreQual'; break;
                case 'Restructure Loan File': queueTypeId = '10'; queueCode = 'RestructureLoanFile'; break;
                case 'Submit To Loan Partner': queueTypeId = '11'; queueCode = 'SubmitToLoanPartner'; break;
                default: queueTypeId = null; queueCode = null; // Or handle the default case as needed
            }

            if (!token) {
                console.error('Token not found in chrome.storage.');
                toastr.error('Token not found. Please refresh the grid.');
                return;
            }

            const postUrl = `https://api.nanolos.com/nano/queues?appId=${appId}`;

            // Construct the POST request body
            const postBody = {
              data: {
                attributes: {
                  code: queueCode,
                  "end-date": null,
                  "start-date": new Date().toISOString()
                },
                relationships: {
                  app: {
                    data: {
                      type: "apps",
                      id: appId
                    }
                  },
                  "queue-type": {
                    data: {
                      type: "queue-types",
                      id: queueTypeId
                    }
                  }
                },
                type: "queues"
              }
            };

            fetch(postUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/vnd.api+json',
                    'accept': 'application/vnd.api+json',
                    'appid': appId
                },
                body: JSON.stringify(postBody)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Queue entry created successfully:', data);
                //redrawDataGridOnChange();
                toastr.success('Prospect Queue updated successfully.');
            })
            .catch(error => {
                console.error('Error creating queue entry:', error);
                toastr.error('Error updating Prospect Queue.');
            });
        }
        },
        { headerName: "Queue Start", 
          field: "queueStartDate",
          width: 100,
          cellClass: 'small-font',
          hide: true,
        },
        { headerName: "Queue End", 
          field: "queueEndDate",
          width: 100,
          cellClass: 'small-font',
          hide: true,
        },
        {headerName: "Biz Hrs",
          field: "businessTimeElapsed", // Point to the NEW pre-calculated field
          width: 80,
          filter: false,          // Disable filtering on this calculated string
          sortable: false,        // Disable sorting on this calculated string (or define custom comparator)
          // No valueGetter needed
          cellDataType: 'text',    // Good practice to hint the data type
          hide: true,
        },

  
        //spacer
        // { headerName: "", field: "spacer1", width:1, suppressSizeToFit: true, suppressColumnsToolPanel:true, suppressFilterToolPanel:true, suppressHeaderMenuButton: true, filter:false, cellClass: 'spacer-cell',},
        //sales price
        {headerName: "Sales Price",
          width: 100,
          field: "salesPrice", filter: true,
          valueFormatter: function(params) {
            return params.value ? '$' + params.value.toLocaleString() : '';
          },
        },
        {headerName: "Loan Amount",
          //autofit width
          width: 100,
          field: "loanAmount", filter: true, 
          valueFormatter: function(params) {
            return params.value ? '$' + params.value.toLocaleString() : '';
          },
        },
        { headerName: "Loan Product", field: "loanProduct" },
        {headerName: "Conditions",
          width: 100,
          children: [
            { headerName: "Bor", 
              field: "borrowerOutstandingConditionCount", 
              width: 50,
              hide: true,          
              floatingFilter: false,
              suppressHeaderMenuButton: true,
              suppressHeaderFilterButton: true,
              floatingFilterComponentParams: {
                suppressFloatingFilterButton: true,
              },
            },
            { headerName: "3rd", 
              field: "criticalThirdPartyOutstandingConditionCount", 
              width: 50, 
              hide: true,
              floatingFilter: false,
              suppressHeaderMenuButton: true,
              suppressHeaderFilterButton: true,
              floatingFilterComponentParams: {
                suppressFloatingFilterButton: true,
              },
            },
            { headerName: "LO", 
              field: "loanOfficerConditionCount", 
              width: 50, 
              hide: true,
              floatingFilter: false,
              suppressHeaderMenuButton: true,
              suppressHeaderFilterButton: true,
              floatingFilterComponentParams: {
                suppressFloatingFilterButton: true,
              },
            },
            { headerName: "Total",
              colId: 'totalConditions',
              width: 100, 
              floatingFilter: false,
              suppressHeaderMenuButton: true,
              suppressHeaderFilterButton: true,
              floatingFilterComponentParams: {
                suppressFloatingFilterButton: true,
              },
              
              cellRenderer: function(params) {
                var container = document.createElement('div');
                var link = document.createElement('a');
                link.href = `https://flow.nanolos.com/admin1_2/CheckListClientDetailsPop.aspx?page=Checklist&appid=${params.data.app}`;
                link.target = '_blank';
                link.innerText = params.value;
                container.appendChild(link);
                return container;
              },
              valueGetter: function(params) {
                if (!params.data) {
                  return null; // Return null if params.data is undefined
                }
        
                const borrowerCount = params.data.borrowerOutstandingConditionCount || 0;
                const thirdPartyCount = params.data.criticalThirdPartyOutstandingConditionCount || 0;
                const loanOfficerCount = params.data.loanOfficerConditionCount || 0;
        
                return borrowerCount + thirdPartyCount + loanOfficerCount;
              }
            }
          ]  
        },
        { headerName: "Team Members",
          children: [
            { 
              headerName: "Loan Officer",
              colId: "teamloanOfficer",
              field: "loanOfficer",
              cellClass: 'small-font',
              filter: 'agMultiColumnFilter',
            },
            { headerName: "LOA", 
              field: "loanOfficerAssistant", 
              cellClass: 'small-font',
              filter: 'agMultiColumnFilter',
            },
            { headerName: "Processor", 
              field: "processor",  
              cellClass: 'small-font',
              filter: 'agMultiColumnFilter',
            },
            { headerName: "Underwriter", 
              field: "underwriter",  
              cellClass: 'small-font',
              filter: 'agMultiColumnFilter',
            },
            { headerName: "Closer", 
              field: "closer",  
              cellClass: 'small-font',
              filter: 'agMultiColumnFilter',
            },
            { headerName: "Funder", 
              field: "funder",  
              cellClass: 'small-font',
              filter: 'agMultiColumnFilter',
            },
          ],
        },
        {headerName: "Referral Sources",
          children: [
            { headerName: "Corporate Partner", field: "corporatePartner", filter: 'agMultiColumnFilter',},
            { headerName: "Builder", field: "builder", filter: 'agMultiColumnFilter', },
            { headerName: "Buyer's Agent", field: "buyersAgent", filter: 'agMultiColumnFilter', },
            { headerName: "Seller's Agent", field: "sellersAgent", filter: 'agMultiColumnFilter', },
          ]
        },
        {headerName:"App Created",
          colId: 'appCreated', 
          field: 'appCreationDate',
          width: 100,
          filter: 'agDateColumnFilter',
          cellClass: 'small-font',
          valueFormatter: function(params) {
            if (!params.value) return '';
            const date = new Date(params.value);
            if (isNaN(date)) return '';
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            return `${month}/${day}/${year}`;
          },
          comparator: function(date1, date2, nodeA, nodeB, isDescending) {
            if (!date1 && !date2) return 0;
            if (!date1) return isDescending ? -1 : 1;
            if (!date2) return isDescending ? 1 : -1;
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            const comp = d1.getTime() - d2.getTime();
            return isDescending ? -comp : comp;
          },
          filterParams: {
            browserDatePicker: true,
            comparator: function(filterDateRaw, cellValue) {
              if (!cellValue) return -1;
              const cellDate = new Date(cellValue);
              const filterDate = new Date(filterDateRaw);
              if (isNaN(cellDate) || isNaN(filterDate)) return -1;
              
              // Normalize dates to midnight UTC
              const normalizedCellDate = new Date(Date.UTC(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()));
              const normalizedFilterDate = new Date(Date.UTC(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate()));
              
              if (normalizedCellDate < normalizedFilterDate) return -1;
              if (normalizedCellDate > normalizedFilterDate) return 1;
              return 0;
            }
          }
        },
        { headerName: "Closing Deadline", field: "closingDeadline", filter: true },
        { headerName: "Final Inspection Ordered", field: "finalInspectionOrdered", filter: true },
        { headerName: "Final Inspection Completed", field: "finalInspectionCompleted", filter: true },
        { headerName: "Has Credit Card", field: "hasCreditCard", filter: true },
        { headerName: "Has Related App", field: "hasRelatedApp", filter: true },
        { headerName: "Is Brokered", field: "isBrokered", filter: true },
        { headerName: "Loan Purpose", field: "loanPurpose", filter: true },
        { headerName: "Risk Level Codes", field: "riskLevelCodes", filter: true, hide: false, maxWidth: 200 },
        { headerName: "State", field: "state", filter: true },
        { headerName: "Time In Queue", field: "timeInQueue", filter: true },
        { headerName: "Is Suspended", field: "isSuspended", filter: true },
        {headerName: "App Queue", 
          field: "appQueue", 
          filter: true, 
          width: 100, 
          cellClass: 'small-font',
        },
        { headerName: "Team",
          colId: 'team',
          filter: true,
          valueGetter: function(params) {
            // Create a set of loan officers in the Stallings Team
            const stallingsTeam = new Set([
              'David Stallings', 
              'David Alexander', 
              'Clayton Tyrel', 
              'Stephen Shields', 
              'Danya Davis', 
              'Ashley Kupfer', 
              'Alisha Thomas', 
              'Richard Matos',
              'Bobby Hughes',
              'Heather Gravley',
              'Armond Knowles',
              'Anthony Rogerson',
              'Cole Harmon'
            ]);
            const xanderTeam = new Set([
              'John Alexander', 
              'Zinna Swann', 
              'Kicha Gaskin'
            ]);
        
            // Check if the loan officer is in the Stallings Team
            if (stallingsTeam.has(params.data.loanOfficer)) {
              return 'Stallings Team';
            } else if (xanderTeam.has(params.data.loanOfficer)) {
              return 'Xander Team';
            }
            return null;
          }
         },

        //hidden columns
        
        { headerName: "Underwriting Organization", field: "underwritingOrganization", filter: true, hide: true }, 
        { headerName: "Warehouse Bank", field: "warehouseBank", filter: true, hide: true },
        { headerName: "Closing Medium", field: "closingMedium", filter: true, hide: true },
        { headerName: "Condition Description", field: "conditionDescription", filter: true, hide: true },
        { headerName: "Disclosure Medium", field: "disclosureMedium", filter: true, hide: true },
        { headerName: "Delivery Date", field: "deliveryDate", filter: true, hide: true },
        { headerName: "Final Underwriting Waived", field: "finalUnderwritingWaived", filter: true, hide: true },
        { headerName: "Financing Approval Deadline", field: "financingApprovalDeadline", filter: true, hide: true },
        { headerName: "Business Days", field: "businessDays", filter: true, hide: true },
        
        { headerName: "Processing Organization", field: "processingOrganization", filter: true, hide:true},
        { headerName: "Brand Organization", field: "brocessingOrganization", filter: true, hide:true},
        { headerName: "Funding Date", field: "fundingDate", filter: true, hide: true },
        { headerName: "Rush Description", field: "rushDescription", filter: true, hide: true },
        { headerName: "Is Rushed", field: "isRushed", filter: true, hide: true },
        { headerName: "Risk Level", field: "riskLevel", filter: true, hide: true },
        { headerName: "Investor", field: "investor", filter: true, hide: true },
        { headerName: "Investor Loan Number", field: "investorLoanNumber", filter: true, hide: true },
        { headerName: "Investor Lock Expiration Date", field: "investorLockExpirationDate", filter: true, hide: true },
        { headerName: "Is Restricted", field: "isRestricted", filter: true, hide: true },
        { headerName: "Ordered", field: "ordered", filter: true, hide: true },
        { headerName: "Received", field: "received", filter: true, hide: true },
        { headerName: "Condition Code", field: "conditionCode", filter: true, hide: true },
        { headerName: "Condition", field: "condition", filter: true,  },
        { headerName: "Analyzed", field: "analyzed", filter: true, hide: true },
        { headerName: "Has Unsigned Disclosure", field: "hasUnsignedDisclosure", filter: true, hide: true },
        { headerName: "Classification", field: "classification", filter: true, hide: true },
  
      ],
      rowData: [],
  
      defaultColDef: {
        sortable: true,
        enableRowGroup: true,
        floatingFilter: true,
        filter: 'agMultiColumnFilter',
        suppressHeaderMenuButton: true,
        headerComponentParams: {
          innerHeaderComponent: CustomInnerHeader,
        },
      },
    
  
    sideBar: {
      toolPanels: [
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
          toolPanelParams: {
            suppressRowGroups: false,
            suppressValues: true,
            suppressPivots: true,
            suppressPivotMode: true,
            suppressColumnFilter: false, 
            suppressColumnSelectAll: false,
            suppressColumnExpandAll: false,
          },
        },
        {
          id: "filters",
          labelDefault: "Filters",
          labelKey: "filters",
          iconKey: "filter",
          toolPanel: "agFiltersToolPanel",
        },
        //custom side bar with Stats? Settings?

      ],
    },
  
  
    //Allow user to select cells
    cellSelection: true,
    groupDisplayType: "groupRows",
    //rowGroupPanelShow: "always",
    groupDefaultExpanded: 0,


  
    // Status Bar Configuration
    statusBar: {
      statusPanels: [
        {
          key: 'aUniqueString',
          statusPanel: 'agAggregationComponent',
          align: 'left',
          statusPanelParams: {
            aggFuncs: ['sum'],
            field: 'loanAmount',
            displayName: 'Total Loan Amount'
          }
      },
        { statusPanel: 'agTotalAndFilteredRowCountComponent' },
        //{ statusPanel: 'agFilteredRowCountComponent' },
        //{ statusPanel: 'agTotalRowCountComponent' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' },
        {
          statusPanel: SumStatusBarComponent,
          align: 'left'
        }
  
      ]
      
    },
  
  
  


  
      // Conditional formatting for Rows
      rowClassRules: {
        'ctc-row': function(params) {
            var toggleFormattingElement = document.getElementById('toggle-formatting');
            if (!toggleFormattingElement) {
                console.error('Toggle formatting element not found.');
                return false;
            }

            var toggleFormatting = toggleFormattingElement.checked;
            if (!toggleFormatting || !params.data) {
                return false;
            }

            return params.data.currentStatus === 'Clear to Close' || 
            params.data.currentStatus === 'Closing Documents Prepared' ||
            params.data.currentStatus === 'Closed' || 
            params.data.currentStatus === 'Released to Closer' || 
            params.data.currentStatus === 'Funded' || 
            params.data.currentStatus === 'Balance / Scheduling Requested';
        },

        //conditional formatting for rows with suspended status = true or queueType = 10
        'suspended-row': function(params) {
         var toggleFormattingElement = document.getElementById('toggle-formatting');
            if (!toggleFormattingElement) {
                console.error('Toggle formatting element not found.');
                return false;
            }

            var toggleFormatting = toggleFormattingElement.checked;
            if (!toggleFormatting || !params.data) {
                return false;
            }
            return params.data.isSuspended || params.data.queueType === '10';

        }

      },
  
  
      rowSelection: {
          mode: 'multiRow',
          checkboxes: false,
          headerCheckbox: false,
          enableClickSelection: true,
      },
  
    //Close Grid Options
    };


  // Create Grids:
  gridApi = agGrid.createGrid(document.querySelector("#myGrid"), gridOptions);
 // gridApiDSPLeads = agGrid.createGrid(document.querySelector("#dspGrid-leads"), gridOptionsDSPLeads);
 // gridApiDSPApps = agGrid.createGrid(document.querySelector("#dspGrid-apps"), gridOptionsDSPApps);
//  gridApiDSPApproved = agGrid.createGrid(document.querySelector("#dspGrid-approved"), gridOptionsDSPApproved);
 // gridApiDSPNotSubmitted = agGrid.createGrid(document.querySelector("#dspGrid-notsubmitted"), gridOptionsDSPNotSubmitted);
//  gridApiDSPActive = agGrid.createGrid(document.querySelector("#dspGrid-active"), gridOptionsDSPActive);



  
//          *********************** Listeners and Buttons ************************



  /*
    Search All MEGA
  */
    document.addEventListener('DOMContentLoaded', function() {
      const filterTextBox = document.getElementById('filter-text-box');
      if (filterTextBox) {
          let timeoutId;
          filterTextBox.addEventListener('input', function() {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                  gridApi.setGridOption(
                      "quickFilterText",
                      document.getElementById("filter-text-box").value,
                  );
              }, 300); // Adjust the delay (in milliseconds) as needed
          });
      }
  });


  /*
    Search All DSP
  */
    document.addEventListener('DOMContentLoaded', function() {
      // Add event listener to the filter text box input
      const filterTextBox = document.getElementById('dsp-text-box');
      if (filterTextBox) {
        filterTextBox.addEventListener('input', function() {
          gridApiDSPLeads.setGridOption(
            "quickFilterText",
            document.getElementById("dsp-text-box").value,
          );
          gridApiDSPApps.setGridOption(
            "quickFilterText",
            document.getElementById("dsp-text-box").value,
          );
          gridApiDSPApproved.setGridOption(
            "quickFilterText",
            document.getElementById("dsp-text-box").value,
          );
          gridApiDSPNotSubmitted.setGridOption(
            "quickFilterText",
            document.getElementById("dsp-text-box").value,
          );
          gridApiDSPActive.setGridOption(
            "quickFilterText",
            document.getElementById("dsp-text-box").value,
          );
        });
      }
    }
    );


  /*
    CLEAR FILTERS BUTTON
  */
  document.getElementById('clear-filters').addEventListener('click', clearFiltersHandler);
  function clearFiltersHandler() {
    // Remove the event listener
    document.getElementById('clear-filters').removeEventListener('click', clearFiltersHandler);
    var clearFilterButton = document.getElementById('clear-filters');
    var groupByButton = document.getElementById('group-by-select');
  
    clearFilterButton.classList.remove('btn-danger');
    clearFilterButton.classList.add('btn-outline-primary');
    groupByButton.selectedIndex = 0;
  

    // Clear search box
    document.getElementById("filter-text-box").value = '';

    //close master detail rows
    gridApi.forEachNodeAfterFilterAndSort(function(node) {
      if (node.data && node.data.isMasterDetail) {
        gridApi.closeDetailRow(node);
      }
    });



    // Clear existing sorts
    gridApi.applyColumnState({
      defaultState: { sort: null },
    });

    // Apply default sort state for closingDate
    gridApi.applyColumnState({
      state: [{ colId: 'closingDate', sort: 'asc' }],
      
    });

    // Reset closing-date-filter dropdown
    document.getElementById('closing-date-filter').value = 'all';
    document.getElementById('group-by-select').value = 'all';

    // Clear filter button background color
    clearFilterButton.style.backgroundColor = '';

    // Clear quick filter
    gridApi.setGridOption(
      "quickFilterText",
    );

    // Clear filters
    gridApi.setFilterModel(null);

    // Clear groupings

    //if group columns is empty do nothing, otherwise set it to empty array
    if (gridApi.getRowGroupColumns().length > 0) {
      gridApi.setRowGroupColumns([]);
    }

    //close all open master detail rows 
    gridApi.forEachNode(function(node) {
      if (node.expanded) {
        node.setExpanded(false);
        console.log('closed master detail row');
      }
    });

    

    
    // Re-enable the button listener
    document.getElementById('clear-filters').addEventListener('click', clearFiltersHandler);

    // check prospects, active and funded boxes
    document.getElementById('prospects-filter').checked = true;
    document.getElementById('onhold-filter').checked = true;
    document.getElementById('active-filter').checked = true;
    document.getElementById('funded-filter').checked = true;

    
}


  /*
    Toggle Formatting switch
  */ 
  document.getElementById('toggle-formatting').addEventListener('change', function() {
    gridApi.redrawRows();
  });


  
  //listens for the grid to be grouped, then remove the z-index attribute from .ag-theme-balham .ag-pinned-left-cols-container, .ag-pinned-left-header
  gridApi.addEventListener('columnRowGroupChanged', function(params) {
    var pinnedLeftColsContainer = document.querySelector('.ag-theme-balham .ag-pinned-left-cols-container');
    var pinnedLeftHeader = document.querySelector('.ag-theme-balham .ag-pinned-left-cols-container');
    if (params.columns.length > 0 && pinnedLeftColsContainer && pinnedLeftHeader) {

      // remove z-index from pinned left cols container and header
      pinnedLeftColsContainer.style.zIndex = '0';
      pinnedLeftHeader.style.zIndex = '0';
    } else {
      pinnedLeftColsContainer.style.zIndex = '1';
      pinnedLeftHeader.style.zIndex = '1';
    }
   
  });
  
  

  /*
      BUTTON - Refresh Data
  */
  document.getElementById('refresh-button').addEventListener('click', refreshDataHandler);
  function refreshDataHandler() {
    const refreshbutton = document.getElementById('refresh-button');
    const refreshspinner = document.getElementById('refresh-spinner');
    refreshbutton.style.display = 'none';
    refreshspinner.style.display = 'inline-block';

    gridApi.setGridOption('loading', true);
    gridApi.setGridOption('rowData', []);

    chrome.storage.local.get(['urlParams', 'gridtoken', 'users', 'loanProducts', 'corporatePartners', 'usersTimestamp', 'loanProductsTimestamp', 'corporatePartnersTimestamp'], function (result) {
        const urlParams = result.urlParams || '';
        const token = result.gridtoken;
        window.token = token;
        const cachedUsers = result.users || [];
        const cachedLoanProducts = result.loanProducts || [];
        const cachedCorporatePartners = result.corporatePartners || [];
        const usersTimestamp = result.usersTimestamp || 0;
        const loanProductsTimestamp = result.loanProductsTimestamp || 0;
        const corporatePartnersTimestamp = result.corporatePartnersTimestamp || 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // Handle URL params
        const urlParamsArray = urlParams.split('&');
        const updatedUrlParams = urlParamsArray.map(param => {
            if (param.includes('organizationId=ALL')) {
                return 'organizationId=';
            }
            return param;
        }).join('&');

        if (!token) {
            console.error('Token not found in chrome.storage.');
            document.getElementById('refresh-data').addEventListener('click', refreshDataHandler);
            return;
        }

        // Fetch and cache helper function
        const fetchAndCache = (url, key) => {
            console.log(`Fetching ${key} from API`);
            return fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                if (!response.ok) {
                    return Promise.reject(`Failed to fetch ${key}. Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                chrome.storage.local.set({ [key]: data, [`${key}Timestamp`]: now });
                console.log(`Fetched and cached ${key}:`, data);
                return data;
            })
            .catch(error => {
                console.error(`Error fetching ${key}:`, error);
                return [];
            });
        };

        // Handle cached data promises
        const usersPromise = (now - usersTimestamp < oneDay && cachedUsers.length > 0)
            ? (console.log('Using cached users data'), Promise.resolve(cachedUsers))
            : fetchAndCache('https://api.nanolos.com/nano/users', 'users');

        const loanProductsPromise = (now - loanProductsTimestamp < oneDay && cachedLoanProducts.length > 0)
            ? (console.log('Using cached loanProducts data'), Promise.resolve(cachedLoanProducts))
            : fetchAndCache('https://api.nanolos.com/nano/loan-products', 'loanProducts');

        const corporatePartnersPromise = (now - corporatePartnersTimestamp < oneDay && cachedCorporatePartners.length > 0)
            ? (console.log('Using cached corporatePartners data'), Promise.resolve(cachedCorporatePartners))
            : fetchAndCache('https://api.nanolos.com/nano/corporate-partners', 'corporatePartners');

        // Main API call

        //if id="all-data" checked, set api url to https://api.nanolos.com/nano/app-queue-details?pageSize=50000, otherwise use the updatedUrlParams
        let apiUrl; // Declare once outside the if/else blocks
        if (document.getElementById('all-data').checked) {
            console.log('Loading all data from API without filters.');
            window.allDataMode = true;
            apiUrl = `https://api-read-only.nanolos.com//nano/app-queue-details?allActions=false&classification=Active%2CCancelled%20Borrower%2CCancelled%20Prospect%2CFunded%2COn%20Hold%2CPre-Approval%20Path%2CProspect%2CQuick%20Pre-Qual&includeConditions=false&includeNotes=false&includeUnsignedDisclosures=false&organizationId=&pageSize=50000&queryGroup=AssortedClassifications&queueGroupId=LoanOfficer&queueIds=ClearToCloseStatus%2CClosedStatus%2CClosingDocumentsPreparedStatus%2CClosingDocumentsRequestedStatus%2CCompletedPreApproval%2CFinalConditionsSubmitted%2CInitialReviewCompletePreApprovalStatus%2CInitialReviewCompleteStatus%2CInitialReviewConditionsSubmitted%2CInstructionsSentStatus%2CPreProcessingStatus%2CProcessingPreApprovalStatus%2CProcessingStatus%2CSubmittedForInitialReviewPreApprovalStatus%2CSubmittedForInitialReviewStatus%2CSubmittedForPreApprovalStatus%2CSubmittedForUnderwritingStatus%2CUnderwrittenStatus&roleId=1&userId=ALL`;
        } else {
            window.allDataMode = false;
            //console.log('Loading filtered data from API with URL params:', updatedUrlParams);
            //apiUrl = `https://api.nanolos.com/nano/app-queue-details?pageSize=50000${updatedUrlParams ? '&' + updatedUrlParams : ''}`;

            //extract the filter from the current url params example /grid.html?filter=prospects
            const filter = window.location.search.split('=')[1];
            console.log('Filter:', filter);

            //check if url params include filter= write switch case to handle different filters
            switch (filter) {
                case 'prospects':
                  console.log('Loading prospects data from API.');
                    apiUrl = `https://api-read-only.nanolos.com/nano/app-queue-details?pageSize=50000&classification=Prospect&organizationId=&queryGroup=AssortedClassifications&queueGroupId=LoanOfficer&roleId=1&userId=ALL`;
                    //change page title to Prospects
                    document.title = 'Prospects';
                    break;
                case 'active':
                    console.log('Loading active data from API.');
                    apiUrl = `https://api-read-only.nanolos.com//nano/app-queue-details?pageSize=50000&allActions=false&classification=Active%2COn%20Hold%2CPre-Approval%20Path%2CQuick%20Pre-Qual&includeConditions=false&includeNotes=false&includeUnsignedDisclosures=false&organizationId=&queryGroup=AssortedClassifications&queueGroupId=LoanOfficer&queueIds=ClearToCloseStatus%2CClosedStatus%2CClosingDocumentsPreparedStatus%2CClosingDocumentsRequestedStatus%2CCompletedPreApproval%2CFinalConditionsSubmitted%2CInitialReviewCompletePreApprovalStatus%2CInitialReviewCompleteStatus%2CInitialReviewConditionsSubmitted%2CInstructionsSentStatus%2CPreProcessingStatus%2CProcessingPreApprovalStatus%2CProcessingStatus%2CSubmittedForInitialReviewPreApprovalStatus%2CSubmittedForInitialReviewStatus%2CSubmittedForPreApprovalStatus%2CSubmittedForUnderwritingStatus%2CUnderwrittenStatus&roleId=1&userId=ALL`;
                    //change page title to Active
                    document.title = 'Active';
                    break;
                case 'prospects-and-active':
                    console.log('Loading prospects and active data from API.');
                    apiUrl = `https://api-read-only.nanolos.com/nano/app-queue-details?pageSize=50000&allActions=false&classification=Active%2COn%20Hold%2CPre-Approval%20Path%2CProspect%2CQuick%20Pre-Qual&includeConditions=false&includeNotes=false&includeUnsignedDisclosures=false&organizationId=&queryGroup=AssortedClassifications&queueGroupId=LoanOfficer&queueIds=ClearToCloseStatus%2CClosedStatus%2CClosingDocumentsPreparedStatus%2CClosingDocumentsRequestedStatus%2CCompletedPreApproval%2CFinalConditionsSubmitted%2CInitialReviewCompletePreApprovalStatus%2CInitialReviewCompleteStatus%2CInitialReviewConditionsSubmitted%2CInstructionsSentStatus%2CPreProcessingStatus%2CProcessingPreApprovalStatus%2CProcessingStatus%2CSubmittedForInitialReviewPreApprovalStatus%2CSubmittedForInitialReviewStatus%2CSubmittedForPreApprovalStatus%2CSubmittedForUnderwritingStatus%2CUnderwrittenStatus&roleId=1&userId=ALL`;
                    //change page title to Prospects and Active
                    document.title = 'Prospects and Active';
                    break;
                case 'funded':
                    console.log('Loading funded data from API.');
                    apiUrl = `https://api-read-only.nanolos.com/nano/app-queue-details?pageSize=50000&allActions=false&classification=Funded&includeConditions=false&includeNotes=false&includeUnsignedDisclosures=false&organizationId=&queryGroup=AssortedClassifications&queueGroupId=LoanOfficer&queueIds=ClearToCloseStatus%2CClosedStatus%2CClosingDocumentsPreparedStatus%2CClosingDocumentsRequestedStatus%2CCompletedPreApproval%2CFinalConditionsSubmitted%2CInitialReviewCompletePreApprovalStatus%2CInitialReviewCompleteStatus%2CInitialReviewConditionsSubmitted%2CInstructionsSentStatus%2CPreProcessingStatus%2CProcessingPreApprovalStatus%2CProcessingStatus%2CSubmittedForInitialReviewPreApprovalStatus%2CSubmittedForInitialReviewStatus%2CSubmittedForPreApprovalStatus%2CSubmittedForUnderwritingStatus%2CUnderwrittenStatus&roleId=1&userId=ALL`;
                    //change page title to Funded
                    document.title = 'Funded';
                    break;
                case 'cancelled':
                    console.log('Loading cancelled data from API.');
                    apiUrl = `https://api-read-only.nanolos.com/nano/app-queue-details?pageSize=50000&allActions=false&classification=Cancelled%20Borrower%2CCancelled%20Prospect&includeConditions=false&includeNotes=false&includeUnsignedDisclosures=false&organizationId=&queryGroup=AssortedClassifications&queueGroupId=LoanOfficer&queueIds=ClearToCloseStatus%2CClosedStatus%2CClosingDocumentsPreparedStatus%2CClosingDocumentsRequestedStatus%2CCompletedPreApproval%2CFinalConditionsSubmitted%2CInitialReviewCompletePreApprovalStatus%2CInitialReviewCompleteStatus%2CInitialReviewConditionsSubmitted%2CInstructionsSentStatus%2CPreProcessingStatus%2CProcessingPreApprovalStatus%2CProcessingStatus%2CSubmittedForInitialReviewPreApprovalStatus%2CSubmittedForInitialReviewStatus%2CSubmittedForPreApprovalStatus%2CSubmittedForUnderwritingStatus%2CUnderwrittenStatus&roleId=1&userId=ALL`;
                    //change page title to Cancelled
                    document.title = 'Cancelled';
                    break;
                case 'queues':
                    console.log('Loading queues data from API.');
            apiUrl = `https://api-read-only.nanolos.com/nano/app-queue-details?pageSize=50000${updatedUrlParams ? '&' + updatedUrlParams : ''}`;
                    //change page title to Queues
                    document.title = 'Custom Selection';
                    break;
                default:
                    // Handle cases where updatedUrlParams doesn't match known filters
                    console.warn(`Unhandled URL parameters for filtering: ${updatedUrlParams}. Falling back to default URL construction.`);
                    // Option 1: Fallback to original URL construction (if applicable)
                    // apiUrl = `https://api.nanolos.com/nano/app-queue-details?pageSize=50000${updatedUrlParams ? '&' + updatedUrlParams : ''}`;
                    
                    // Option 2: Fallback to the 'all data' URL as a safe default
                     apiUrl = `https://api.nanolos.com/nano/app-queue-details?pageSize=50000&classification=Active%2COn%20Hold%2CPre-Approval%20Path%2CProspect%2CQuick%20Pre-Qual&organizationId=&queryGroup=AssortedClassifications&queueGroupId=LoanOfficer&roleId=1&userId=ALL`;
                    //change page title to All Loans
                    document.title = 'All Loans';
                     break;
            }
        }

        // apiUrl = 'data.json'; // For testing purposes, use local JSON file instead of API call

        

        fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/vnd.api+json'
            }
        })
        .then(response => {
            console.log('API Response Status:', response.status);
            return response.json();
        })
        .then(apiResponse => {
            console.log('API Response Data:', apiResponse);
            Promise.all([usersPromise, loanProductsPromise, corporatePartnersPromise])
            .then(([users, loanProducts, corporatePartners]) => {
                console.log('Users Data:', users);
                console.log('Loan Products Data:', loanProducts);
                console.log('Corporate Partners Data:', corporatePartners);

                // Extract data from JSON:API response
                const records = apiResponse.data.map(record => {
                    // First spread the attributes with proper key transformation
                    const transformedAttributes = Object.entries(record.attributes).reduce((acc, [key, value]) => {
                        // Convert kebab-case to camelCase
                        const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
                        acc[camelKey] = value;
                        return acc;
                    }, {});

                    // Now handle all relationships
                    const relationships = Object.entries(record.relationships).reduce((acc, [key, value]) => {
                        // Convert kebab-case to camelCase for relationship keys
                        const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
                        
                        // Extract the ID if relationship data exists
                        acc[camelKey] = value?.data?.id || null;
                        
                        // Store the relationship type if needed
                        acc[`${camelKey}Type`] = value?.data?.type || null;
                        
                        return acc;
                    }, {});

                    return {
                        ...transformedAttributes,
                        ...relationships,
                        app: record.relationships.app?.data?.id,
                        id: record.id
                    };
                });

                // Create lookup maps
                const loanProductMap = new Map(loanProducts.map(product => [
                    String(product.id), 
                    product.nickname || 'N/A'
                ]));

                const corporatePartnerMap = new Map(corporatePartners.map(partner => [
                    String(partner.id),
                    partner.companyName || 'N/A'
                ]));

                // Process records with user and loan product information
                const processedRecords = records.map(record => {
                    const findUser = (userId) => {
                        if (!userId) return null;
                        const user = users.find(u => u.id === userId);
                        return user ? `${user.firstName} ${user.lastName}` : null;
                    };

                    return {
                        ...record,
                        // Map user relationships to full names
                        loanOfficer: findUser(record.loanOfficer),
                        loanOfficerAssistant: findUser(record.loanOfficerAssistant),
                        processor: findUser(record.processor),
                        underwriter: findUser(record.underwriter),
                        closer: findUser(record.closer),
                        funder: findUser(record.funder),
                        // Map loan product to nickname
                        loanProduct: loanProductMap.get(String(record.loanProduct)),
                        // Map corporate partner ID to company name
                        corporatePartner: corporatePartnerMap.get(String(record.corporatePartner)),
                        // Preserve organization relationships
                        brandOrganization: record.brandOrganization,
                        processingOrganization: record.processingOrganization,
                        underwritingOrganization: record.underwritingOrganization,
                        // Preserve other important relationships
                        county: record.county,
                        queueType: record.queueType
                    };
                });
  
                // Handle deduplication
                const dedupedData = dedupeRowData(processedRecords);
                window.dedupedData = dedupedData;

                console.log('Deduplicated Data:', dedupedData.length, 'records found.');
                console.log('all data:', dedupedData);

                // CHANGE: Load the grid immediately with basic data
                gridApi.setGridOption('rowData', dedupedData);
                gridApi.setGridOption('loading', false);
                updateLoanOfficerDropdown(dedupedData);
                
                // Add the status message to the refresh button's parent
                let statusElement;
                const refreshBtnContainer = document.getElementById('refresh-button').parentElement;
                
                if (document.getElementById('status-message')) {
                    statusElement = document.getElementById('status-message');
                } else {
                    statusElement = document.createElement('div');
                    statusElement.id = 'status-message';
                    statusElement.style.margin = '5px 0';
                    statusElement.style.fontSize = '0.9em';
                    statusElement.style.color = '#666';
                    statusElement.style.display = 'inline-block';
                    statusElement.style.marginLeft = '10px';
                    refreshBtnContainer.appendChild(statusElement);
                }
                statusElement.textContent = 'Loading queue data...';

                             


                // Fetch all queue records in the background
                const allQueuesUrl = `https://api-read-only.nanolos.com/nano/queues`;
                fetch(allQueuesUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => {
                    console.log('All Queues Response Status:', response.status);
                    return response.json();
                })
                .then(allQueuesResponse => {
                    console.log('All Queues Response Data length:', allQueuesResponse?.length || 0);
                    
                    // Check if allQueuesResponse is an array
                    if (Array.isArray(allQueuesResponse) && allQueuesResponse.length > 0) {
                        console.log('Active Queues:', allQueuesResponse.length);

                        // 1. Filter for queues with non-null queueType
                        const queueTypeQueues = allQueuesResponse.filter(queue => queue.queueType !== null);
                        console.log('Queues with non-null queueType:', queueTypeQueues.length);

                        // 2. Filter for queues with null queueType (nano queues)
                        const nanoQueues = allQueuesResponse.filter(queue => queue.queueType === null);
                        console.log('Nano Queues (null queueType):', nanoQueues.length);

                        // Process queues with queueType (standardize format)
                        const processedQueueTypeQueues = queueTypeQueues.map(queue => ({
                            queueType: queue.queueType,
                            app: queue.app,
                            startDate: queue.startDate,
                            endDate: queue.endDate
                        }));

                        // Process nano queues (standardize format)
                        const processedNanoQueues = nanoQueues.map(queue => ({
                            code: queue.code,
                            app: queue.app,
                            startDate: queue.startDate,
                            endDate: queue.endDate
                        }));

                        // Create maps for the most recent queue of each type per app
                        const appToQueueTypeMap = new Map();
                        const appToNanoQueueMap = new Map();

                        // Find most recent queue with queueType for each app
                        processedQueueTypeQueues.forEach(queue => {
                            if (!queue.app) return; // Skip if no app ID
                            
                            const appId = queue.app;
                            if (appToQueueTypeMap.has(appId)) {
                                const existingQueue = appToQueueTypeMap.get(appId);
                                if (new Date(queue.startDate) > new Date(existingQueue.startDate)) {
                                    appToQueueTypeMap.set(appId, queue);
                                }
                            } else {
                                appToQueueTypeMap.set(appId, queue);
                            }
                        });

                        // Find most recent nano queue for each app
                        processedNanoQueues.forEach(queue => {
                            if (!queue.app) return; // Skip if no app ID
                            
                            const appId = queue.app;
                            if (appToNanoQueueMap.has(appId)) {
                                const existingQueue = appToNanoQueueMap.get(appId);
                                if (new Date(queue.startDate) > new Date(existingQueue.startDate)) {
                                    appToNanoQueueMap.set(appId, queue);
                                }
                            } else {
                                appToNanoQueueMap.set(appId, queue);
                            }
                        });

                        console.log('App to QueueType Map size:', appToQueueTypeMap.size);
                        console.log('App to NanoQueue Map size:', appToNanoQueueMap.size);

                        // Prepare updates for ag-Grid
                        const updatedDedupedData = dedupedData.map(record => {
                            const queueTypeData = appToQueueTypeMap.get(record.app);
                            const nanoQueueData = appToNanoQueueMap.get(record.app);
                            
                            let formattedQueueStartDate = null;
                            let formattedQueueEndDate = null;
                            
                            // Format dates if nano queue data exists
                            if (nanoQueueData) {
                                if (nanoQueueData.startDate) {
                                    formattedQueueStartDate = formatDateToMMDDYY_queues(new Date(nanoQueueData.startDate));
                                }
                                if (nanoQueueData.endDate) {
                                    formattedQueueEndDate = formatDateToMMDDYY_queues(new Date(nanoQueueData.endDate));
                                }
                            }
                            
                            return {
                                ...record,
                                queueType: queueTypeData?.queueType || null,
                                nanoQueue: nanoQueueData?.code || null,
                                queueStartDate: formattedQueueStartDate,
                                queueEndDate: formattedQueueEndDate
                            };
                        });

                        // Apply the transaction to update the grid
                        console.log('Updated Deduped Data:', updatedDedupedData);
                        gridApi.setGridOption('rowData', updatedDedupedData);
                        //refresh the grid to ensure all rows are updated
                        gridApi.refreshCells({ force: true, columns: ['queueType', 'nanoQueue', 'queueStartDate', 'queueEndDate'] });
                        
                        // Update status message
                        statusElement.textContent = 'Queue data loaded';

                        // Find records with completed appraisals
                        const recordsWithAppraisals = updatedDedupedData.filter(record => record.appraisalCompleted);
                        console.log('Records with completed appraisals:', recordsWithAppraisals.length);

                        if (recordsWithAppraisals.length > 0) {
                            statusElement.textContent = 'Loading property data...';

                            // Create a function to fetch property data for a single app
                            const fetchPropertyData = async (appId) => {
                                try {
                                    const response = await fetch(`https://api-read-only.nanolos.com/nano/properties?appId=${appId}`, {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Accept': 'application/vnd.api+json',
                                        }
                                    });
                                    
                                    if (!response.ok) {
                                        console.warn(`API returned ${response.status} for app ${appId}`);
                                        return null;
                                    }

                                    const propertyData = await response.json();
                                    
                                    // Check if the response has the expected structure
                                    if (!propertyData || !propertyData.data || !Array.isArray(propertyData.data)) {
                                        console.warn(`Unexpected API response structure for app ${appId}:`, propertyData);
                                        return null;
                                    }
                                    
                                    // Find the subject property (where is-subject is true)
                                    const subjectProperty = propertyData.data.find(prop => 
                                        prop && 
                                        prop.attributes && 
                                        prop.attributes['is-subject'] === true
                                    );
                                    
                                    if (subjectProperty && subjectProperty.attributes) {
                                        return {
                                            appId,
                                            salesPrice: subjectProperty.attributes['sales-price'],
                                            appraisedValue: subjectProperty.attributes['appraised-value']
                                        };
                                    }
                                    
                                    console.warn(`No subject property found for app ${appId}`);
                                    return null;
                                } catch (error) {
                                    console.error(`Error fetching property data for app ${appId}:`, error);
                                    return null;
                                }
                            };

                            // Process records in batches to avoid overwhelming the API
                            const batchSize = 20;
                            const processBatch = async (records) => {
                                const promises = records.map(record => fetchPropertyData(record.app));
                                const results = await Promise.all(promises);
                                return results.filter(result => result !== null);
                            };

                            // Process all records with appraisals in batches
                            const processAllRecords = async () => {
                                const propertyResults = [];
                                for (let i = 0; i < recordsWithAppraisals.length; i += batchSize) {
                                    const batch = recordsWithAppraisals.slice(i, i + batchSize);
                                    const batchResults = await processBatch(batch);
                                    propertyResults.push(...batchResults);
                                    
                                    // Update status message with progress
                                    const progress = Math.min(100, Math.round((i + batchSize) / recordsWithAppraisals.length * 100));
                                    statusElement.textContent = `Loading property data... ${progress}%`;
                                }
                                return propertyResults;
                            };

                            // Execute the processing and update the grid
                            processAllRecords().then(propertyResults => {
                                console.log('Property data results:', propertyResults);

                                // Create a map for quick lookup
                                const propertyDataMap = new Map(
                                    propertyResults.map(result => [result.appId, result])
                                );

                                // Update the grid data with property information
                                const finalData = updatedDedupedData.map(record => {
                                    const propertyData = propertyDataMap.get(record.app);
                                    if (propertyData) {
                                        return {
                                            ...record,
                                            salesPrice: propertyData.salesPrice,
                                            appraisedValue: propertyData.appraisedValue
                                        };
                                    }
                                    return record;
                                });

                                // Update the grid with the final data
                                window.finalData = finalData;
                                gridApi.setGridOption('rowData', finalData);
                                gridApi.refreshCells({ force: true });                           

                                
                                statusElement.textContent = 'Property data loaded';
                                setTimeout(() => {
                                    statusElement.textContent = '';
                                }, 3000);
                            }).catch(error => {
                                console.error('Error processing property data:', error);
                                statusElement.textContent = 'Error loading property data';
                                setTimeout(() => {
                                    statusElement.textContent = '';
                                }, 3000);
                            });
                        }

                        setTimeout(() => {
                            statusElement.textContent = '';
                        }, 3000);
                    } else {
                        console.warn('No queue data received from API or empty array.');
                        statusElement.textContent = 'Queue data not available';
                        setTimeout(() => {
                            statusElement.textContent = '';
                        }, 3000);
                    }
                    
                    // Buttons are already shown when basic data is loaded
                })
                .catch(error => {
                    console.error('Error fetching all queues:', error);
                    statusElement.textContent = 'Error loading queue data';
                    setTimeout(() => {
                        statusElement.textContent = '';
                    }, 3000);
                });
                
                // CHANGE: Reset UI immediately with basic data
                refreshbutton.style.display = '';
                refreshspinner.style.display = 'none';
            });
        })
        .catch(error => {
            console.error('Error:', error);
            gridApi.setGridOption('loading', false);
            refreshbutton.style.display = '';
            refreshspinner.style.display = 'none';
        });
    });
}

// Helper function to format date to MM/DD/YYYY
function formatDateToMMDDYY_queues(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}
    
function updateLoanOfficerDropdown(data) {
    const dropdown = document.getElementById('loan-officer-dropdown');
    if (!dropdown) {
        console.error('Loan officer dropdown not found');
        return;
    }

    const loanOfficers = [...new Set(data
        .map(row => row.loanOfficer)
        .filter(Boolean)
        .sort()
    )];

    dropdown.innerHTML = '<option value="all">All Loan Officers</option>';
    loanOfficers.forEach(officer => {
        const option = document.createElement('option');
        option.value = officer;
        option.text = officer;
        dropdown.appendChild(option);
    });
}



  /*
      BUTTON - Toggle DSP Grids
  
      //make a button to toggle displaying mega container and display container display none
      document.getElementById('toggle-dsp').addEventListener('click', function() {
        var dspContainer = document.getElementById('dsp-container');
        var displayContainer = document.getElementById('mega-container');
        if (dspContainer.style.display === 'none') {
          displayContainer.style.display = 'none';
          dspContainer.style.display = '';
          this.textContent = 'Show Pipeline';
                          //fit dspleads columns to width
                          gridApiDSPLeads.sizeColumnsToFit();
                          gridApiDSPApps.sizeColumnsToFit();
                          gridApiDSPApproved.sizeColumnsToFit();
                          gridApiDSPNotSubmitted.sizeColumnsToFit();
                          gridApiDSPActive.sizeColumnsToFit();
          
                          //sort dspGrids bi app descending
                          gridApiDSPLeads.applyColumnState({ state: [{ colId: 'app', sort: 'desc' }] });
                          gridApiDSPApps.applyColumnState({ state: [{ colId: 'app', sort: 'desc' }] });
                          gridApiDSPApproved.applyColumnState({ state: [{ colId: 'app', sort: 'desc' }] });
                          gridApiDSPNotSubmitted.applyColumnState({ state: [{ colId: 'app', sort: 'desc' }] });
                          gridApiDSPActive.applyColumnState({ state: [{ colId: 'app', sort: 'desc' }] });
        } else {
          displayContainer.style.display = '';
          dspContainer.style.display = 'none';
          this.textContent = 'Show DSP';
        }
      });
  */


  /*
      BUTTON - Get Notes
  */

 // document.getElementById('get-notes').addEventListener('click', getNotesHandler);
function getNotesHandler() {
  // Stop listening to the button until the function is done
  document.getElementById('get-notes').removeEventListener('click', getNotesHandler);

  // Get list of all visible app IDs
  const appIds = [];
  gridApi.forEachNodeAfterFilterAndSort(function(node) {
      if (node.data && node.data.app) {
          appIds.push(node.data.app);
      }
  });
  console.log('App IDs:', appIds);

  if (appIds.length === 0) {
      console.error('No app IDs found.');
      // Re-enable the button listener in case of error
      document.getElementById('get-notes').addEventListener('click', getNotesHandler);
      return;
  }

  // Function to split array into chunks
  function chunkArray(array, chunkSize) {
      const chunks = [];
      for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
      }
      return chunks;
  }

  // Split appIds into chunks of 100
  const appIdChunks = chunkArray(appIds, 100);

  // Get the token and users from local storage
  chrome.storage.local.get(['gridtoken', 'users'], function(result) {
      const token = result.gridtoken;
      const users = result.users || [];

      if (!token) {
          console.error('Token not found in chrome.storage.');
          // Re-enable the button listener in case of error
          document.getElementById('get-notes').addEventListener('click', getNotesHandler);
          return;
      }

      // Function to fetch notes for a chunk of app IDs
      function fetchNotesForChunk(chunk) {
        
          const apiUrl = `https://api.nanolos.com/nano/notes?appIds=${chunk.join('%2C')}&limit=1&noteCategoryIds%5B%5D=15&noteCategoryIds%5B%5D=16&noteCategoryIds%5B%5D=22&noteCategoryIds%5B%5D=30&noteCategoryIds%5B%5D=23`;
          console.log('Fetching notes from URL:', apiUrl);

          return fetch(apiUrl, {
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
          });
      }

      // Fetch notes for all chunks and combine results
      Promise.all(appIdChunks.map(fetchNotesForChunk))
      .then(results => {
          const allNotes = results.flat();
          console.log('All notes fetched:', allNotes);

          // Function to parse HTML content and extract text
          function parseHTML(html) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              return doc.body.textContent || "";
          }

          // Function to format date to MM/DD
          function formatDate(dateString) {
              const date = new Date(dateString);
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const day = date.getDate().toString().padStart(2, '0');
              return `${month}/${day}`;
          }

          // Function to get user name by ID
          function getUserName(userId) {
              const user = users.find(user => user.id === userId);
              return user ? `${user.firstName} ${user.lastName}` : userId;
          }

          // Inject the results into the notes column header matching the app ID
          gridApi.forEachNodeAfterFilterAndSort(function(node) {
            const appId = node.data ? node.data.app : null;
            if (!appId) {
              console.error('Error fetching notes: appId is null or undefined');
              return;
            }
              const notes = allNotes
                  .filter(note => note.app === appId)
                  .sort((a, b) => new Date(b.created) - new Date(a.created)) // Sort by created date in descending order
                  .map(note => `<b>${formatDate(note.created)} - ${getUserName(note.user)}</b> - ${parseHTML(note.content)}`)
                  .join('<br>');
              node.setDataValue('notes', notes);
          });

          // Re-enable the button listener after the function is done
          document.getElementById('get-notes').addEventListener('click', getNotesHandler);
      })
      .catch(error => {
          console.error('Error fetching notes:', error);
          // Re-enable the button listener in case of error
          document.getElementById('get-notes').addEventListener('click', getNotesHandler);
      });
  });
}



  /*
      BUTTON - Dark Theme switcher
  */
      document.getElementById('theme-switcher').addEventListener('change', function() {
        var gridDivs = document.querySelectorAll('.ag-theme-balham, .ag-theme-balham-dark');
        var isBalham = this.checked;
      
        gridDivs.forEach(gridDiv => {
          if (gridDiv) {
            if (isBalham) {
              gridDiv.classList.remove('ag-theme-balham-dark');
              gridDiv.classList.add('ag-theme-balham');
            } else {
              gridDiv.classList.remove('ag-theme-balham');
              gridDiv.classList.add('ag-theme-balham-dark');
            }
          }
        });
      
        var themeSwitcherLabel = document.querySelector('.theme-switcher');
        if (themeSwitcherLabel) {
          if (isBalham) {
            themeSwitcherLabel.textContent = 'Light Theme';
            document.body.style.backgroundColor = '#fff';
            var appIds = document.querySelectorAll('.ag-cell-value a');
            appIds.forEach(appId => {
              if (appId) {
                appId.style.color = 'blue';
              }
            });
          } else {
            themeSwitcherLabel.textContent = 'Dark Theme';
            document.body.style.backgroundColor = '#333';
            var appIds = document.querySelectorAll('.ag-cell-value a');
            appIds.forEach(appId => {
              if (appId) {
                appId.style.color = 'royalblue';
              }
            });
          }
        } else {
          console.warn('Theme switcher label not found.');
        }
      });
  

  /*
      BUTTON - Clear Filters v2??
  */
  function clearFilters() {
    gridApi.setFilterModel(null);
    gridApi.setGridOption('quickFilterText', '');
    gridApi.setRowGroupColumns([]);
    gridApi.applyColumnState({
      defaultState: { sort: null },
    });
  
  }


  /*
      UI Dropdown - Closing Date Filter
  */
  function closingDateFilterChanged() {
    // Get the selected value from the dropdown with id 'closing-date-filter'
    var selectedValue = document.getElementById('closing-date-filter').value;
    console.log('Selected value:', selectedValue);

    
    var currentDate = new Date();
    //set current date to 0 time
    currentDate.setHours(0, 0, 0, 0);
    console.log('currentDate:', currentDate);
    var currentYear = currentDate.getFullYear();
    var currentMonth = currentDate.getMonth() + 1;
    console.log('currentMonth:', currentMonth);
    var nextMonth = currentMonth + 1;
    var currentDay = currentDate.getDate();
   

    // Define date ranges as Date objects
    //last day of the previous month
    var lastDayOfPreviousMonth = new Date(currentYear, currentMonth - 1, 0);
    console.log('lastDayOfPreviousMonth:', lastDayOfPreviousMonth);
    //first day of next month
    var firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
    console.log('firstDayOfNextMonth:', firstDayOfNextMonth);
    //first day of next next month
    //last day of current month
    var lastDayOfCurrentMonth = new Date(currentYear, currentMonth, 0);
    var lastDayOfPreviousPreviousMonth = new Date(currentYear, currentMonth - 2, 0);

    var firstDayOfNextNextMonth = new Date(currentYear, currentMonth + 1, 1);
    var firstDayOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);

    var firstDayOfNextMonth = new Date(currentYear, currentMonth, 1);
    var lastDayOfNextMonth = new Date(currentYear, currentMonth + 2, 0);
    var next7Days = new Date(currentDate.getTime() + 8 * 24 * 60 * 60 * 1000);
    var next15Days = new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    var next30Days = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    var next60Days = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000);
    var next90Days = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    var next180Days = new Date(currentDate.getTime() + 180 * 24 * 60 * 60 * 1000);

    // Calculate the start and end of the current week (Sunday to Saturday)
    var firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    var lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);

    //current date minus 1 day
    var currentDateMinus1Day = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    console.log('currentDateMinus1Day:', currentDateMinus1Day);


    //close master detail rows


    // Switch statement to filter the closing date column based on the selected value
    switch (selectedValue) {
      case 'thisWeek':
        console.log('Applying filter for thisWeek:', {
          dateFrom: firstDayOfWeek.toISOString().split('T')[0],
          dateTo: lastDayOfWeek.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(firstDayOfWeek, lastDayOfWeek);
        break;
    
      case 'nextWeek':
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);
        console.log('Applying filter for nextWeek:', {
          dateFrom: firstDayOfWeek.toISOString().split('T')[0],
          dateTo: lastDayOfWeek.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(firstDayOfWeek, lastDayOfWeek);
        break;

        case'lastMonth':
        var firstDayOfLastMonth = new Date(currentYear, currentMonth - 1, 0);
        var lastDayOfLastMonth = new Date(currentYear, currentMonth, 1); // Last day of the previous month

        console.log('Applying filter for lastMonth:', {
          dateFrom: lastDayOfPreviousPreviousMonth.toISOString().split('T')[0],
          dateTo: firstDayOfCurrentMonth.toISOString().split('T')[0]
        });
        updateClosingDateFilter(lastDayOfPreviousPreviousMonth, firstDayOfCurrentMonth);
        break;
    
      case 'thisMonth':
        console.log('Applying filter for thisMonth:', {
          dateFrom: lastDayOfPreviousMonth.toISOString().split('T')[0],
          dateTo: firstDayOfNextMonth.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(lastDayOfPreviousMonth, firstDayOfNextMonth);
        break;
    
      case 'nextMonth':
        console.log('Applying filter for nextMonth:', {
          dateFrom: lastDayOfCurrentMonth.toISOString().split('T')[0],
          dateTo: firstDayOfNextNextMonth.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(lastDayOfCurrentMonth, firstDayOfNextNextMonth);
        break;
    
      case 'thisMonthAndNextMonth':
        console.log('Applying filter for thisMonthAndNextMonth:', {
          dateFrom: lastDayOfPreviousMonth.toISOString().split('T')[0],
          dateTo: firstDayOfNextNextMonth.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(lastDayOfPreviousMonth, firstDayOfNextNextMonth);
        break;

      case 'next7Days':
        console.log('Applying filter for next7Days:', {
          dateFrom: currentDateMinus1Day.toISOString().split('T')[0],
          dateTo: next7Days.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(currentDateMinus1Day, next7Days);
        break;
    
      case 'next15Days':
        console.log('Applying filter for next15Days:', {
          dateFrom: currentDateMinus1Day.toISOString().split('T')[0],
          dateTo: next15Days.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(currentDateMinus1Day, next15Days);
        break;
    
      case 'next30Days':
        console.log('Applying filter for next30Days:', {
          dateFrom: currentDateMinus1Day.toISOString().split('T')[0],
          dateTo: next30Days.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(currentDateMinus1Day, next30Days);
        break;
    
      case 'next60Days':
        console.log('Applying filter for next60Days:', {
          dateFrom: currentDateMinus1Day.toISOString().split('T')[0],
          dateTo: next60Days.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(currentDateMinus1Day, next60Days);
        break;
    
      case 'next90Days':
        console.log('Applying filter for next90Days:', {
          dateFrom: currentDateMinus1Day.toISOString().split('T')[0],
          dateTo: next90Days.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(currentDateMinus1Day, next90Days);
        break;
    
      case 'next180Days':
        console.log('Applying filter for next180Days:', {
          dateFrom: currentDateMinus1Day.toISOString().split('T')[0],
          dateTo: next180Days.toISOString().split('T')[0]
        });
    
        updateClosingDateFilter(currentDateMinus1Day, next180Days);
        break;
    
      default:
        // Optionally, you can choose to clear only the closingDate filter
        const currentFilterModelDefault = gridApi.getFilterModel();
        delete currentFilterModelDefault.closingDate;
        gridApi.setFilterModel(currentFilterModelDefault);
        console.log('Cleared closingDate filter');
        break;
    }
    
    /**
     * Function to update the closingDate filter in the existing filter model.
     * @param {Date} fromDate - The start date for the filter.
     * @param {Date} toDate - The end date for the filter.
     */
    function updateClosingDateFilter(fromDate, toDate) {
      // Get the current filter model
      const currentFilterModel = gridApi.getFilterModel();
    
      // Update the closingDate filter
      currentFilterModel.closingDate = {
        filterType: 'date',
        type: 'inRange',
        dateFrom: fromDate.toISOString().split('T')[0],
        dateTo: toDate.toISOString().split('T')[0]
      };
    
      // Set the updated filter model back to the grid
      gridApi.setFilterModel(currentFilterModel);
    }
  }
  document.getElementById('closing-date-filter').addEventListener('change', closingDateFilterChanged);

/*
    UI Dropdown - Loan Officer Filter
*/
document.getElementById('loan-officer-dropdown').addEventListener('change', loanOfficerFilterChanged);
function loanOfficerFilterChanged() {
  // Get the selected value from the dropdown with id 'loan-officer-dropdown'
  var selectedValue = document.getElementById('loan-officer-dropdown').value;
  console.log('Selected value:', selectedValue);

  // Switch statement to filter the loan officer column based on the selected value
  switch (selectedValue) {
    case 'all':
      // Clear the loan officer filter
      
      gridApiDSPLeads.setFilterModel(null);
      gridApiDSPApps.setFilterModel(null);
      gridApiDSPApproved.setFilterModel(null);
      gridApiDSPNotSubmitted.setFilterModel(null);
      gridApiDSPActive.setFilterModel(null);

      console.log('Cleared loan officer filter');
      break;

    default:
      // Apply the loan officer filter
      console.log('Applied loan officer filter:', selectedValue);
      gridApiDSPLeads.setFilterModel({
        loanOfficer: {
          filterType: 'set',
          values: [selectedValue]
        }
      });
      gridApiDSPApps.setFilterModel({
        loanOfficer: {
          filterType: 'set',
          values: [selectedValue]
        }
      });
      gridApiDSPApproved.setFilterModel({
        loanOfficer: {
          filterType: 'set',
          values: [selectedValue]
        }
      });
      gridApiDSPNotSubmitted.setFilterModel({
        loanOfficer: {
          filterType: 'set',
          values: [selectedValue]
        }
      });
      gridApiDSPActive.setFilterModel({
        loanOfficer: {
          filterType: 'set',
          values: [selectedValue]
        }
      });
      break;
  }
}


// Utility function to format date to MM/DD/YY
function formatDateToMMDDYY(value) {
    if (!value) return ''; // Return empty string for blank dates
    const date = new Date(value);
    if (isNaN(date)) return ''; // Handle invalid dates as blank

    const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const formattedDay = date.getDate().toString().padStart(2, '0');
    const formattedYear = date.getFullYear().toString().slice(-2);

    return `${formattedMonth}/${formattedDay}/${formattedYear}`;
}

// Function to format date to YYYY-MM-DD before updating closing date filter
// Function to format date to YYYY-MM-DD before updating closing date filter
function formatClosingDate(dateValue) {
  if (!dateValue) return null;

  let dateString;

  if (dateValue instanceof Date) {
      // If it's a Date object, format it to YYYY-MM-DD
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
  } else if (typeof dateValue === 'string') {
      // If it's a string, use it directly
      dateString = dateValue;
  } else {
      console.error(`Unexpected date value type: ${typeof dateValue}. Value: ${dateValue}`);
      return null;
  }

  // Basic check for "YYYY-MM-DD" pattern
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
      console.error(`Date must be in "YYYY-MM-DD" format. Received: ${dateString}`);
      return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Rudimentary validation
  if (
      year < 1900 ||
      month < 1 || month > 12 ||
      day < 1 || day > 31
  ) {
      console.error(`Invalid date components: ${dateString}`);
      return null;
  }

  // Return exactly the same format, zero-padded
  const safeMonth = String(month).padStart(2, '0');
  const safeDay = String(day).padStart(2, '0');
  return `${year}-${safeMonth}-${safeDay}`;
}

// Function to dedupe rowData based on app id and return the deduped array
function dedupeRowData(rowData) {
  return rowData.reduce((acc, current) => {
    // Find an item in the accumulator array that has the same app id as the current item
    const x = acc.find(item => item.app === current.app);
    
    // If no such item is found, add the current item to the accumulator array
    if (!x) {
      return acc.concat([current]);
    } else {
      // If an item with the same app id is found, do not add the current item to the accumulator array
      return acc;
    }
  }, []);
}

// Function to create a Google Calendar event URL
function createGoogleCalendarEventURL(params) {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const borrowerName = `${params.data.firstName} ${params.data.lastName}`;
  const appId = params.data.app;
  const closingDate = params.data.closingDate || 'N/A';
  const referralSource = params.data.referralSource || 'N/A';
  const loanOfficer = params.data.loanOfficer || 'N/A';
  const loanOfficerAssistant = params.data.loanOfficerAssistant || 'N/A';
  const processor = params.data.processor || 'N/A';
  const underwriter = params.data.underwriter || 'N/A';

  const title = encodeURIComponent(`[PIPELINE REMINDER] - ${borrowerName} - ${appId}`);
  const details = encodeURIComponent(`
    <a target="_blank" rel="noopener noreferrer" href="https://canopymortgage.nanolos.com/loan-fulfillment/#/main/app/${appId}">${appId}</a><br>
    Closing Date: ${closingDate}<br>
    Referral Source: ${referralSource}<br>
    Loan Officer: ${loanOfficer}<br>
    LOA: ${loanOfficerAssistant}<br>
    Processor: ${processor}<br>
    Underwriter: ${underwriter}<br>
    Follow up date: next business day at 10 AM.
  `);

  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 1); // Next business day
  const followUpDateString = followUpDate.toISOString().split('T')[0].replace(/-/g, '');
  const followUpTimeStart = '150000'; // 10 AM in UTC
  const followUpTimeEnd = '151500'; // 10:15 AM in UTC

  const dates = `${followUpDateString}T${followUpTimeStart}Z/${followUpDateString}T${followUpTimeEnd}Z`;

  const url = `${baseUrl}&text=${title}&dates=${dates}&details=${details}`;
  return url;
}

// Add event listeners to the save buttons
document.addEventListener('DOMContentLoaded', () => {
  //add listeners to 1 save button
  document.getElementById('saveView1-button').addEventListener('click', () => saveGridState('cv1', 'viewName1'));
  document.getElementById('saveView2-button').addEventListener('click', () => saveGridState('cv2', 'viewName2'));
  document.getElementById('saveView3-button').addEventListener('click', () => saveGridState('cv3', 'viewName3'));
  document.getElementById('saveView4-button').addEventListener('click', () => saveGridState('cv4', 'viewName4'));
  document.getElementById('saveView5-button').addEventListener('click', () => saveGridState('cv5', 'viewName5'));
  document.getElementById('saveView6-button').addEventListener('click', () => saveGridState('cv6', 'viewName6'));
  document.getElementById('saveView7-button').addEventListener('click', () => saveGridState('cv7', 'viewName7'));
  document.getElementById('saveView8-button').addEventListener('click', () => saveGridState('cv8', 'viewName8'));
  document.getElementById('saveView9-button').addEventListener('click', () => saveGridState('cv9', 'viewName9'));
  document.getElementById('saveView10-button').addEventListener('click', () => saveGridState('cv10', 'viewName10'));
});


function saveInitialGridState() {

  const initialStateAsJson = JSON.stringify(gridApi.getState());
  localStorage.setItem('agGridState_default', initialStateAsJson);
  window.initialStateAsJson = initialStateAsJson;
}

function saveGridState(buttonId, inputId) {
  // 1) Get the entire state
  const state = gridApi.getState();
  const filterModel = JSON.stringify(gridApi.getFilterModel());
  console.log('Current state:', state);

  // 2) Serialize to JSON
  const stateAsJson = JSON.stringify(state);

  // 3) Prompt user for a "view name"
  const viewName = document.getElementById(inputId).value.trim();
  if (!viewName) {
    toastr.error('Please enter a name for the custom view');
    return;
  }

  // 4) Remove any existing saved state in local storage for this ID
  localStorage.removeItem(`agGridState_${buttonId}`);
  localStorage.removeItem(`agGridStateName_${buttonId}`);

  // 5) Save the new state
  localStorage.setItem(`agGridStateFilter_${buttonId}`, filterModel);
  localStorage.setItem(`agGridState_${buttonId}`, stateAsJson);
  localStorage.setItem(`agGridStateName_${buttonId}`, viewName);

  // 6) (Optional) Update a dropdown label or something else
  const option = document.querySelector(`#myview-select option[value="${buttonId.toLowerCase()}"]`);
  if (option) {
    option.textContent = viewName;
  }

  // 7) Log for debugging
  console.log(`Saved state for ${buttonId}:`, stateAsJson);
  console.log('saved view as object:', JSON.parse(stateAsJson));

  toastr.success(`View saved for ${viewName}`);
}





function restoreAgGridState(stateKey) {

  // CASE 1: If user wants the "default" view
  if (stateKey === 'default') {
    console.log('Setting view to Default');

    // 1) Retrieve your original/default state from a global variable or some known location
    const state = window.initialStateAsJson;
    if (!state) {
      toastr.error('No saved state found for the default view');
      return;
    }

    // 2) Parse the string to an object
    const stateAsJson = JSON.parse(state);

    // 3) Destroy the current grid instance
    gridApi.destroy();

    // 4) Re-initialize the grid with that default state
    const gridDiv = document.querySelector("#myGrid");
    gridOptions.initialState = stateAsJson; // important to pass the actual object

    gridApi = new agGrid.createGrid(gridDiv, gridOptions);

    // 5) Re-apply row data
    gridApi.setGridOption('rowData', window.finalData);

    // 6) (Optional) Force a default sort on a certain column
    //    If you want to rely on what's in your "initialStateAsJson," you can skip this.
    gridApi.applyColumnState({ state: [{ colId: 'closingDate', sort: 'asc' }] });

    toastr.success('Grid state reset to default');
    return;
  }
    // CASE 2: Named view from local storage
    const state = localStorage.getItem(`agGridState_${stateKey}`);
    const filter = localStorage.getItem(`agGridStateFilter_${stateKey}`);
    
    console.log(`Retrieved view from local storage:`, state);
  
    if (!state) {
      toastr.error('No saved state found for the selected view');
      return;
    }
  
    // Parse the saved JSON
    const stateAsJson = JSON.parse(state);
    const filterModel = JSON.parse(filter);
    console.log('Restoring view:', stateAsJson);
  
    // 1) Destroy the current grid
    gridApi.destroy();
  
    // 2) Re-create the grid with the saved state
    const gridDiv = document.querySelector("#myGrid");
  
    // Provide the entire saved object as the initial state
    gridOptions.initialState = stateAsJson;
    console.log('gridOptions.initialState:', gridOptions.initialState);
  
    gridApi = new agGrid.createGrid(gridDiv, gridOptions);
    gridApi.setGridOption('rowData', window.finalData);

    gridApi.setFilterModel(filterModel);
    //console.log('filter:', filter);


  
    // 3) Re-apply row data

  
    // Done – The grid uses the entire restored state
    toastr.success('View loaded successfully');
  
    // Log current state for debugging
    console.log('current state:', gridApi.getState());
  }
  



// Add event listener to Views dropdown
document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.getElementById('myview-select');
  if (dropdown) {
    dropdown.addEventListener('change', (event) => {
      const selectedValue = event.target.value;
      if (selectedValue) {
        restoreAgGridState(selectedValue === 'default' ? 'default' : `${selectedValue}`);
      }
    });
  }


  // Load saved view names into the dropdown and placeholders on page load
  for (let i = 1; i <= 10; i++) {
    const viewName = localStorage.getItem(`agGridStateName_cv${i}`);
    if (viewName) {
      const option = document.querySelector(`#myview-select option[value="cv${i}"]`);
      if (option) {
        option.textContent = viewName;
      }
      const input = document.getElementById(`viewName${i}`);
      if (input) {
        input.placeholder = viewName;
      }
    }
  }

  // Save the initial state of the grid to local storage
  saveInitialGridState();
});


// Toastr Configuration
toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": false,
  "positionClass": "toast-bottom-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "linear",
  "hideEasing": "linear",
  "showMethod": "show",
  "hideMethod": "hide"
}


// Get Data
let testmode = false;
if (testmode) { 
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    gridApi.setGridOption('rowData', data);
  });
} else {
  refreshDataHandler();
  gridApi.addEventListener('firstDataRendered', function() {
    gridApi.sizeColumnsToFit();
  });
}





// toggle function to display and hide rowgrouppanelshow
function toggleRowGroupPanel() {
  gridApi.setGridOption('rowGroupPanelShow', 'always');
}


// Function to apply filters based on Classification Checkboxes
function applyFilters() {
  const prospectsFilter = document.getElementById('prospects-filter').checked;
  const onholdFilter = document.getElementById('onhold-filter').checked;
  const activeFilter = document.getElementById('active-filter').checked;
  const fundedFilter = document.getElementById('funded-filter').checked;

  const filterModel = gridApi.getFilterModel();

  if (prospectsFilter || onholdFilter || activeFilter || fundedFilter) {
    filterModel.classification = {
      filterType: 'set',
      values: []
    };

    if (prospectsFilter) {
      filterModel.classification.values.push('Prospect', 'Pre-Approval Path', 'Quick Pre-Qual');
    }

    if (onholdFilter) {
      filterModel.classification.values.push('On Hold');
    }

    if (activeFilter) {
      filterModel.classification.values.push('Active');
    }

    if (fundedFilter) {
      filterModel.classification.values.push('Funded');
    }
  } else {
    // If none of the checkboxes are checked, set an empty filter to hide all records
    filterModel.classification = {
      filterType: 'set',
      values: ['']
    };
  }

  gridApi.setFilterModel(filterModel);
  

}

// Add event listeners to the checkboxes
document.getElementById('prospects-filter').addEventListener('change', applyFilters);
document.getElementById('onhold-filter').addEventListener('change', applyFilters);
document.getElementById('active-filter').addEventListener('change', applyFilters);
document.getElementById('funded-filter').addEventListener('change', applyFilters);


  /*
      Dropdown - Group by
  */
function handleGrouping() {
  const groupBySelect = document.querySelector('#group-by-container select');
  
  groupBySelect.addEventListener('change', (event) => {
    console.log('Group by changed:', event.target.selectedIndex, event.target.value);
    
    // Clear existing row groups first
    //gridApi.setRowGroupColumns([]);
    
    // Only apply grouping if not the first option (index 0)
    if (event.target.selectedIndex > 0) {
      console.log('Setting group by:', event.target.value);
      gridApi.setRowGroupColumns([event.target.value]);
      // refresh the grid
      gridApi.refreshCells();
    } else {
      console.log('Clearing groups');
      gridApi.setRowGroupColumns([]);
      // Force refresh to ensure clearing takes effect
      gridApi.refreshCells();
    }
  });
}

// handle grouping after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  handleGrouping();
});


  /*
      Dropdown - View Selection
  */

    // Function to handle view selection
    //document.getElementById('myview-select').addEventListener('change', handleViewSelection);
    function handleViewSelection() {
      var viewSelect = document.getElementById('myview-select');
      
      if (viewSelect) {

          console.log('View selection changed:', viewSelect);
          
          
          // apply view if selection = 'Default'
          if (viewSelect.selectedValue = 'default') {
            
            console.log('Setting view by:', viewSelect);
            //set the viewSelection drowdown to "Default"
              
            gridApi.destroy();
            
            gridApi = agGrid.createGrid(document.querySelector("#myGrid"), gridOptions);
            gridApi.setGridOption("rowData", window.dedupedData);
            gridApi.applyColumnState({ state: [{ colId: 'closingDate', sort: 'asc' }] });
            //check prospects and active checkboxes, uncheck funded checkbox
            document.getElementById('prospects-filter').checked = true;
            document.getElementById('active-filter').checked = true;
            document.getElementById('funded-filter').checked = false;

            gridApi.addEventListener('firstDataRendered', function() {
              gridApi.sizeColumnsToFit();
            });


          } else {
            console.log('nothing selected');
          }

      } else {
        console.error('Element with id "myview-select" not found.');
      }
    }

    
/**  CD STATUS
          {
            headerName: 'CD STATUS',
            field: 'earliestClosingDate',
            valueGetter: (params) => {
              const cdSignedDate = params.data.closingDisclosureSigned;
              if (!cdSignedDate) {
                return null;
              }
          
              const date = new Date(cdSignedDate);
              date.setUTCHours(0, 0, 0, 0); // Trim off time part and set to UTC
          
              let earliestClosingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 3)); // Add 3 days in UTC
          
              // Adjust for Sundays and holidays
              while (isSundayOrHoliday(earliestClosingDate)) {
                earliestClosingDate.setUTCDate(earliestClosingDate.getUTCDate() + 1);
              }
          
              return earliestClosingDate.toISOString().split('T')[0]; // Return as YYYY-MM-DD
              

            },
            valueFormatter: (params) => {
              const value = params.value;
              return value ? formatClosingDate(value) : '';
            },
          }
 */
function isSundayOrHoliday(date) {
  // Sunday check
  if (date.getUTCDay() === 0) return true;

  // Very naive holiday check example (Jan 1, July 4, Dec 25, etc.)
  // In real production code you'd keep a list of actual Fed holidays (with observed dates).
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  // Simple "major holiday" check
  const isJan1 = (month === 1 && day === 1);
  const isJan20 = (month === 1 && day === 20);
  const isFeb17 = (month === 2 && day === 17);
  const isMay25 = (month === 5 && day === 25);
  const isJun19 = (month === 6 && day === 19);
  const isJuly4 = (month === 7 && day === 4);
  const isSep1 = (month === 9 && day === 1);
  const isOct13 = (month === 10 && day === 13);
  const isNov11 = (month === 11 && day === 11);
  const isNov27 = (month === 11 && day === 27);
  const isNov28 = (month === 11 && day === 28);
  const isDec25 = (month === 12 && day === 25);

  // Expand for other holidays as needed
  return isJan1 || isJan20 || isFeb17 || isMay25 || isJun19 || isJuly4 || isSep1 || isOct13 || isNov11 || isNov27 || isNov28 || isDec25;
}


/* DEBUG BUTTONS
//
//
//
    //add event listener to the button
    document.getElementById('print-state').addEventListener('click', printstate);
    function printstate() {
    //gridApi.setFilterModel(savedFilterModel);
    //console.log('saved filter model:', savedFilterModel);
    console.log('current state' , gridApi.getState());
    console.log('current state as json' , JSON.stringify(gridApi.getState()));
    } 


    //add event listener to the button
    document.getElementById('save-filters').addEventListener('click', saveFilters);
    function saveFilters() {
      savedFilterModel = gridApi.getFilterModel();
      //print stringified state
      console.log('saved filter model:', savedFilterModel);
    } 
*/


//Function for maintaining groupings and redrawing rows when data is updated
function redrawDataGridOnChange() {

  const expandedNodes = [];
  gridApi.forEachNode(node => {
    if (node.expanded) {
      expandedNodes.push(node.key);
    }
  });

  // Reprocess filters to update the grid
  gridApi.redrawRows();
  gridApi.refreshClientSideRowModel('everything');
  

  // Restore the expanded state of the nodes
  gridApi.forEachNode(node => {
    if (expandedNodes.includes(node.key)) {
      node.setExpanded(true);
    }
  });
}



/**
 * Calculates the elapsed business time between a start date and now.
 * Business hours are defined as 9:00 AM to 5:00 PM (17:00), Monday to Friday.
 *
 * @param {string | Date | null} startDateInput The starting date/time.
 * @returns {string | null} Formatted string "Xd Y:ZZ" or null if invalid input.
 */
function calculateBusinessTimeElapsed(startDateInput) {
  if (!startDateInput) {
      return null;
  }

  let start = new Date(startDateInput);
  let end = new Date(); // Now

  if (isNaN(start.getTime()) || start > end) {
      // Handle invalid start date or start date in the future
      return null;
  }

  const businessStartHour = 9;
  const businessEndHour = 17; // Use 17 (5 PM) as the boundary
  const minutesInWorkDay = (businessEndHour - businessStartHour) * 60;

  let totalBusinessMinutes = 0;

  // --- Adjust Start Time ---
  // Move start time to the beginning of the *next* business interval if needed
  let current = new Date(start);
  let dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat

  if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      // Move to next Monday 9 AM
      current.setDate(current.getDate() + (dayOfWeek === 0 ? 1 : 7 - dayOfWeek + 1));
      current.setHours(businessStartHour, 0, 0, 0);
  } else if (current.getHours() >= businessEndHour) { // Weekday after hours
      // Move to next working day 9 AM
      current.setDate(current.getDate() + 1);
      while (current.getDay() === 0 || current.getDay() === 6) {
          current.setDate(current.getDate() + 1);
      }
      current.setHours(businessStartHour, 0, 0, 0);
  } else if (current.getHours() < businessStartHour) { // Weekday before hours
      current.setHours(businessStartHour, 0, 0, 0); // Start at 9 AM today
  }
  // Now 'current' holds the effective start time within business hours

  // If adjusted start is after the end time, duration is zero
  if (current >= end) {
      return "0d 0:00";
  }

  // --- Adjust End Time ---
  // Move end time back to the end of the *previous* business interval if needed
  let effectiveEnd = new Date(end);
  dayOfWeek = effectiveEnd.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
     // Move back to Friday 5 PM
     effectiveEnd.setDate(effectiveEnd.getDate() - (dayOfWeek === 0 ? 2 : 1));
     effectiveEnd.setHours(businessEndHour, 0, 0, 0);
  } else if (effectiveEnd.getHours() < businessStartHour) { // Weekday before hours
      // Move back to previous working day 5 PM
      effectiveEnd.setDate(effectiveEnd.getDate() - 1);
      while (effectiveEnd.getDay() === 0 || effectiveEnd.getDay() === 6) {
          effectiveEnd.setDate(effectiveEnd.getDate() - 1);
      }
      effectiveEnd.setHours(businessEndHour, 0, 0, 0);
  } else if (effectiveEnd.getHours() >= businessEndHour) { // Weekday during or after hours
     // Cap at 5 PM today
     effectiveEnd.setHours(businessEndHour, 0, 0, 0);
  }
  // Now 'effectiveEnd' holds the effective end time within business hours

  // If effective end is before effective start, duration is zero
  if (current >= effectiveEnd) {
       return "0d 0:00";
  }

  // --- Calculate Duration ---
  let startDay = new Date(current);
  startDay.setHours(0, 0, 0, 0);
  let endDay = new Date(effectiveEnd);
  endDay.setHours(0, 0, 0, 0);

  // Calculate minutes on the start day
  let startDayEndTime = new Date(current);
  startDayEndTime.setHours(businessEndHour, 0, 0, 0);
  let minutesOnStartDay = (Math.min(startDayEndTime.getTime(), effectiveEnd.getTime()) - current.getTime()) / (1000 * 60);

  // Check if start and end are on the same day
  if (startDay.getTime() === endDay.getTime()) {
       totalBusinessMinutes = minutesOnStartDay;
  } else {
       totalBusinessMinutes += minutesOnStartDay; // Add start day minutes

       // Calculate minutes on the end day
       let endDayStartTime = new Date(effectiveEnd);
       endDayStartTime.setHours(businessStartHour, 0, 0, 0);
       let minutesOnEndDay = (effectiveEnd.getTime() - endDayStartTime.getTime()) / (1000 * 60);
       totalBusinessMinutes += minutesOnEndDay;

       // Calculate full business days in between
       let tempDate = new Date(startDay);
       tempDate.setDate(tempDate.getDate() + 1); // Start from the day after the start day
       while(tempDate.getTime() < endDay.getTime()) {
           if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) {
               totalBusinessMinutes += minutesInWorkDay;
           }
           tempDate.setDate(tempDate.getDate() + 1);
       }
  }


  if (totalBusinessMinutes < 0) totalBusinessMinutes = 0; // Sanity check

  // Convert total minutes to days, hours, minutes format
  const finalMinutes = Math.round(totalBusinessMinutes);
  const days = Math.floor(finalMinutes / minutesInWorkDay);
  const remainingMinutesInDay = finalMinutes % minutesInWorkDay;
  const hours = Math.floor(remainingMinutesInDay / 60);
  const minutes = remainingMinutesInDay % 60;

  return `${days}d ${hours}:${minutes.toString().padStart(2, '0')}`;
}



