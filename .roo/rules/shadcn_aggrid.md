---
description: 
globs: 
alwaysApply: false
---
# ShadCN UI & AG Grid Enterprise Rules

## **ShadCN UI Component Patterns**

### **Component Installation & Usage**
```bash
# ✅ DO: Install components via shadcn CLI
npx shadcn-ui@latest add button
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
```

### **Button Components**
```typescript
// ✅ DO: Use Button variants consistently
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'default',
  size = 'default',
  loading = false,
  children,
  className,
  onClick,
}) => (
  <Button
    variant={variant}
    size={size}
    disabled={loading}
    className={cn(className)}
    onClick={onClick}
  >
    {loading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </>
    ) : (
      children
    )}
  </Button>
);

// ❌ DON'T: Create custom button styles that conflict with design system
const CustomButton = styled.button`
  background: blue; // Conflicts with theme
  padding: 10px;    // Not using spacing tokens
`;
```

### **Form Components**
```typescript
// ✅ DO: Consistent form patterns with ShadCN
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface RoleSelectorProps {
  value: UserRole;
  onValueChange: (role: UserRole) => void;
  disabled?: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => (
  <div className="space-y-2">
    <Label htmlFor="role-select">Role</Label>
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger id="role-select" className="w-full">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="LoanOfficer">Loan Officer</SelectItem>
        <SelectItem value="LoanOfficerAssistant">Loan Officer Assistant</SelectItem>
        <SelectItem value="Processor">Processor</SelectItem>
        <SelectItem value="Underwriter">Underwriter</SelectItem>
        <SelectItem value="Closer">Closer</SelectItem>
        <SelectItem value="Funder">Funder</SelectItem>
      </SelectContent>
    </Select>
  </div>
);
```

### **Dialog & Modal Patterns**
```typescript
// ✅ DO: Reusable dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LoanDetailsDialogProps {
  loan: LoanData;
  children: React.ReactNode; // Trigger element
  onSave?: (updatedLoan: Partial<LoanData>) => void;
}

const LoanDetailsDialog: React.FC<LoanDetailsDialogProps> = ({
  loan,
  children,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(loan);

  const handleSave = () => {
    onSave?.(formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Loan Details - {loan.id}</DialogTitle>
          <DialogDescription>
            Borrower: {loan.borrowerName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Form fields */}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### **Toast Notifications**
```typescript
// ✅ DO: Consistent toast patterns
import { useToast } from '@/components/ui/use-toast';

const useLoanActions = () => {
  const { toast } = useToast();

  const updateLoanStatus = async (loanId: LoanId, status: LoanStatus) => {
    try {
      await api.updateLoan(loanId, { status });
      
      toast({
        title: 'Loan Updated',
        description: `Loan ${loanId} status changed to ${status.type}`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Unable to update loan status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return { updateLoanStatus };
};
```

## **AG Grid Enterprise Integration**

### **Grid Setup & Configuration**
```typescript
// ✅ DO: Proper AG Grid enterprise setup
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, ColumnApi } from 'ag-grid-enterprise';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Set license (in app initialization)
import { LicenseManager } from 'ag-grid-enterprise';
LicenseManager.setLicenseKey('YOUR_LICENSE_KEY');

interface LoanGridProps {
  loans: LoanData[];
  onLoanSelect: (loan: LoanData) => void;
  onLoanUpdate: (loanId: LoanId, updates: Partial<LoanData>) => void;
}

const LoanGrid: React.FC<LoanGridProps> = ({
  loans,
  onLoanSelect,
  onLoanUpdate,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [columnApi, setColumnApi] = useState<ColumnApi | null>(null);

  const onGridReady = (params: any) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
  };

  const columnDefs: ColDef[] = [
    {
      headerName: 'Loan ID',
      field: 'id',
      width: 120,
      pinned: 'left',
      cellRenderer: 'agGroupCellRenderer',
    },
    {
      headerName: 'Borrower',
      field: 'borrowerName',
      width: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
    },
    {
      headerName: 'Amount',
      field: 'amount',
      width: 150,
      cellRenderer: 'currencyRenderer',
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
    },
    {
      headerName: 'Status',
      field: 'status.type',
      width: 120,
      cellRenderer: 'statusRenderer',
      filter: 'agSetColumnFilter',
      floatingFilter: true,
    },
    {
      headerName: 'Actions',
      width: 150,
      cellRenderer: 'actionRenderer',
      pinned: 'right',
      sortable: false,
      filter: false,
    },
  ];

  const defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
  };

  return (
    <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={loans}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onRowClicked={(event) => onLoanSelect(event.data)}
        
        // Enterprise features
        enableRangeSelection={true}
        enableCharts={true}
        enableAdvancedFilter={true}
        enableStatusBar={true}
        statusBar={{
          statusPanels: [
            { statusPanel: 'agTotalAndFilteredRowCountComponent' },
            { statusPanel: 'agTotalRowCountComponent' },
            { statusPanel: 'agFilteredRowCountComponent' },
            { statusPanel: 'agSelectedRowCountComponent' },
            { statusPanel: 'agAggregationComponent' },
          ],
        }}
        
        // Row grouping
        enableRowGroup={true}
        groupDisplayType="multipleColumns"
        animateRows={true}
        
        // Pagination
        pagination={true}
        paginationPageSize={50}
        paginationPageSizeSelector={[25, 50, 100, 200]}
      />
    </div>
  );
};
```

### **Custom Cell Renderers**
```typescript
// ✅ DO: Create reusable cell renderers
import { ICellRendererParams } from 'ag-grid-community';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Status renderer with ShadCN Badge
const StatusRenderer: React.FC<ICellRendererParams> = ({ value }) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(value)}>
      {value?.charAt(0).toUpperCase() + value?.slice(1)}
    </Badge>
  );
};

// Currency renderer
const CurrencyRenderer: React.FC<ICellRendererParams> = ({ value }) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);

  return <span className="font-mono">{formatted}</span>;
};

// Action renderer with dropdown
const ActionRenderer: React.FC<ICellRendererParams> = ({ data, api }) => {
  const handleAction = (action: string) => {
    switch (action) {
      case 'view':
        // Handle view action
        break;
      case 'edit':
        // Handle edit action
        break;
      case 'delete':
        // Handle delete action
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleAction('view')}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('edit')}>
          Edit Loan
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAction('delete')}
          className="text-destructive"
        >
          Delete Loan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Register renderers
const frameworkComponents = {
  statusRenderer: StatusRenderer,
  currencyRenderer: CurrencyRenderer,
  actionRenderer: ActionRenderer,
};
```

### **Grid Context Menu & Master-Detail**
```typescript
// ✅ DO: Enterprise features integration
const LoanMasterDetailGrid: React.FC = () => {
  const columnDefs: ColDef[] = [
    {
      field: 'id',
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        detailGridOptions: {
          columnDefs: [
            { field: 'documentType', headerName: 'Document' },
            { field: 'status', headerName: 'Status' },
            { field: 'uploadedDate', headerName: 'Uploaded' },
          ],
          defaultColDef: {
            flex: 1,
          },
        },
        getDetailRowData: (params) => {
          // Fetch loan documents
          params.successCallback(params.data.documents || []);
        },
      },
    },
    // Other columns...
  ];

  const getContextMenuItems = (params: any) => [
    {
      name: 'View Loan Details',
      action: () => {
        // Open loan details
      },
      icon: '<i class="fa fa-eye"></i>',
    },
    {
      name: 'Export to Excel',
      action: () => {
        params.api.exportDataAsExcel({
          fileName: `loan-${params.node.data.id}.xlsx`,
        });
      },
      icon: '<i class="fa fa-file-excel"></i>',
    },
    'separator',
    {
      name: 'Print',
      action: () => {
        window.print();
      },
      icon: '<i class="fa fa-print"></i>',
    },
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: '600px' }}>
      <AgGridReact
        columnDefs={columnDefs}
        masterDetail={true}
        detailCellRendererParams={{
          detailGridOptions: {
            columnDefs: [
              { field: 'documentType' },
              { field: 'status' },
              { field: 'uploadedDate' },
            ],
          },
        }}
        getContextMenuItems={getContextMenuItems}
        allowContextMenuWithControlKey={true}
      />
    </div>
  );
};
```

### **Grid State Management**
```typescript
// ✅ DO: Persist grid state
interface GridState {
  columnState: any[];
  sortModel: any[];
  filterModel: any;
  groupState: any;
}

const useGridState = (gridId: string) => {
  const saveGridState = useCallback((api: GridApi, columnApi: ColumnApi) => {
    const state: GridState = {
      columnState: columnApi.getColumnState(),
      sortModel: api.getSortModel(),
      filterModel: api.getFilterModel(),
      groupState: columnApi.getColumnGroupState(),
    };
    
    localStorage.setItem(`grid-state-${gridId}`, JSON.stringify(state));
  }, [gridId]);

  const restoreGridState = useCallback((api: GridApi, columnApi: ColumnApi) => {
    const savedState = localStorage.getItem(`grid-state-${gridId}`);
    if (savedState) {
      const state: GridState = JSON.parse(savedState);
      
      columnApi.applyColumnState({
        state: state.columnState,
        applyOrder: true,
      });
      
      api.setSortModel(state.sortModel);
      api.setFilterModel(state.filterModel);
      columnApi.setColumnGroupState(state.groupState);
    }
  }, [gridId]);

  return { saveGridState, restoreGridState };
};
```

## **Kanban Board with ShadCN**

### **Drag & Drop Kanban Implementation**
```typescript
// ✅ DO: Kanban board with ShadCN styling
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
  loans: LoanData[];
  onLoanMove: (loanId: LoanId, newStatus: LoanStatus['type']) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ loans, onLoanMove }) => {
  const columns = [
    { id: 'pending', title: 'Pending Review', color: 'bg-yellow-100' },
    { id: 'underwriting', title: 'Underwriting', color: 'bg-blue-100' },
    { id: 'approved', title: 'Approved', color: 'bg-green-100' },
    { id: 'closing', title: 'Closing', color: 'bg-purple-100' },
    { id: 'funded', title: 'Funded', color: 'bg-gray-100' },
  ];

  const getLoansByStatus = (status: string) => {
    return loans.filter(loan => loan.status.type === status);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const loanId = result.draggableId as LoanId;
    const newStatus = result.destination.droppableId;
    
    onLoanMove(loanId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto">
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card className={cn('h-full', column.color)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary">
                    {getLoansByStatus(column.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <ScrollArea
                      className={cn(
                        'h-[600px] pr-4',
                        snapshot.isDraggingOver && 'bg-muted/50'
                      )}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <div className="space-y-3">
                        {getLoansByStatus(column.id).map((loan, index) => (
                          <Draggable
                            key={loan.id}
                            draggableId={loan.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  snapshot.isDragging && 'rotate-3 shadow-lg'
                                )}
                              >
                                <LoanCard loan={loan} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

// Loan card component
const LoanCard: React.FC<{ loan: LoanData }> = ({ loan }) => (
  <Card className="roo-pointer hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-sm font-medium">
          {loan.borrowerName}
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {loan.id}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Amount:</span>
          <span className="font-mono">
            ${loan.amount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(loan.createdAt, 'MMM dd')}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);
```

## **Theme Integration**

### **Custom CSS Variables**
```css
/* ✅ DO: Extend ShadCN theme for loan origination */
:root {
  /* Base ShadCN variables */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* Custom loan status colors */
  --loan-pending: 47 96% 53%;
  --loan-approved: 142 76% 36%;
  --loan-rejected: 0 84% 60%;
  --loan-funded: 221 83% 53%;
  
  /* Priority indicators */
  --priority-high: 0 84% 60%;
  --priority-medium: 32 95% 44%;
  --priority-low: 142 71% 45%;
  
  /* AG Grid theme variables */
  --ag-header-background-color: hsl(var(--muted));
  --ag-odd-row-background-color: hsl(var(--muted/0.3));
  --ag-row-hover-color: hsl(var(--muted/0.5));
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  
  /* Dark mode loan colors */
  --loan-pending: 47 96% 43%;
  --loan-approved: 142 76% 46%;
  --loan-rejected: 0 84% 50%;
  --loan-funded: 221 83% 63%;
}
```

## **Accessibility & Performance**

### **Keyboard Navigation**
```typescript
// ✅ DO: Implement keyboard shortcuts
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+N: New loan
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        // Open new loan dialog
      }
      
      // Ctrl+F: Focus search_files
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        document.getElementById('loan-search_files')?.focus();
      }
      
      // Escape: Close modals
      if (event.key === 'Escape') {
        // Close any open modals
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

### **Performance Optimization**
```typescript
// ✅ DO: Optimize large datasets
const optimizedColumnDefs = useMemo<ColDef[]>(() => [
  {
    field: 'id',
    suppressMovable: true,
    lockPosition: true,
    cellRenderer: 'agGroupCellRenderer',
  },
  // Other columns with specific performance settings
], []);

const gridOptions = useMemo(() => ({
  // Performance settings
  suppressRowTransform: true,
  suppressAnimationFrame: false,
  animateRows: true,
  
  // Memory management
  rowBuffer: 10,
  maxBlocksInCache: 2,
  purgeClosedRowNodes: true,
  
  // Rendering optimization
  suppressFieldDotNotation: true,
  suppressPropertyNamesCheck: true,
}), []);
```

