---
description: 
globs: 
alwaysApply: false
---
# TypeScript & React Enterprise Rules

## **TypeScript Best Practices**

### **Type Definitions**
```typescript
// ✅ DO: Strict type definitions
interface LoanData {
  readonly id: string;
  readonly borrowerName: string;
  readonly amount: number;
  readonly status: LoanStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ✅ DO: Use discriminated unions for different states
type LoanStatus = 
  | { type: 'pending'; submittedAt: Date }
  | { type: 'approved'; approvedAt: Date; approvedBy: string }
  | { type: 'rejected'; rejectedAt: Date; reason: string }
  | { type: 'closed'; closedAt: Date };

// ❌ DON'T: Use any or unknown without proper type guards
const data: any = fetchData(); // Avoid this
```

### **Utility Types**
```typescript
// ✅ DO: Use utility types for transformations
type CreateLoanRequest = Omit<LoanData, 'id' | 'createdAt' | 'updatedAt'>;
type PartialLoanUpdate = Partial<Pick<LoanData, 'status' | 'amount'>>;

// ✅ DO: Create branded types for IDs
type LoanId = string & { readonly __brand: 'LoanId' };
type UserId = string & { readonly __brand: 'UserId' };

function createLoanId(id: string): LoanId {
  return id as LoanId;
}
```

### **Error Handling**
```typescript
// ✅ DO: Type-safe error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchLoanData(id: LoanId): Promise<Result<LoanData, ApiError>> {
  try {
    const response = await api.get(`/loans/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: new ApiError('Failed to fetch loan data', error) 
    };
  }
}

// Usage with proper error handling
const result = await fetchLoanData(loanId);
if (result.success) {
  // TypeScript knows this is LoanData
  console.log(result.data.borrowerName);
} else {
  // TypeScript knows this is ApiError
  console.error(result.error.message);
}
```

## **React Component Patterns**

### **Component Structure**
```typescript
// ✅ DO: Proper component props interface
interface DashboardProps {
  readonly currentRole: UserRole;
  readonly selectedUser: UserId | 'all';
  readonly onRoleChange: (role: UserRole) => void;
  readonly onUserChange: (user: UserId | 'all') => void;
  readonly className?: string;
}

// ✅ DO: Use React.FC with proper typing
const Dashboard: React.FC<DashboardProps> = ({
  currentRole,
  selectedUser,
  onRoleChange,
  onUserChange,
  className
}) => {
  // Component implementation
};

// ❌ DON'T: Default export without clear naming
export default function(props: any) {
  return <div />;
}
```

### **Hooks Usage**
```typescript
// ✅ DO: Custom hooks with proper typing
interface UseTokenResult {
  token: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

function useToken(): UseTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newToken = await TokenManager.getToken();
      setToken(newToken);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { token, isLoading, error, refresh };
}
```

### **State Management**
```typescript
// ✅ DO: Zustand store with TypeScript
interface DashboardStore {
  // State
  currentRole: UserRole;
  selectedUser: UserId | 'all';
  loans: LoanData[];
  isLoading: boolean;
  
  // Actions
  setRole: (role: UserRole) => void;
  setUser: (user: UserId | 'all') => void;
  setLoans: (loans: LoanData[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Computed
  filteredLoans: LoanData[];
}

const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  currentRole: 'LoanOfficer',
  selectedUser: 'all',
  loans: [],
  isLoading: false,
  
  // Actions
  setRole: (role) => set({ currentRole: role }),
  setUser: (user) => set({ selectedUser: user }),
  setLoans: (loans) => set({ loans }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Computed values
  get filteredLoans() {
    const { loans, selectedUser, currentRole } = get();
    return loans.filter(loan => {
      if (selectedUser !== 'all' && loan.assignedTo !== selectedUser) {
        return false;
      }
      return isLoanVisibleForRole(loan, currentRole);
    });
  },
}));
```

## **Component Architecture**

### **Compound Components**
```typescript
// ✅ DO: Compound component pattern for complex UI
interface KanbanBoardProps {
  children: React.ReactNode;
  onLoanMove: (loanId: LoanId, fromColumn: string, toColumn: string) => void;
}

interface KanbanColumnProps {
  title: string;
  status: LoanStatus['type'];
  children: React.ReactNode;
}

interface KanbanCardProps {
  loan: LoanData;
  draggable?: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> & {
  Column: React.FC<KanbanColumnProps>;
  Card: React.FC<KanbanCardProps>;
} = ({ children, onLoanMove }) => {
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">{children}</div>
    </DragDropContext>
  );
};

KanbanBoard.Column = ({ title, status, children }) => (
  <Droppable droppableId={status}>
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        <h3>{title}</h3>
        {children}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

KanbanBoard.Card = ({ loan, draggable = true }) => (
  <Draggable draggableId={loan.id} index={0} isDragDisabled={!draggable}>
    {(provided) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <LoanCard loan={loan} />
      </div>
    )}
  </Draggable>
);

// Usage
<KanbanBoard onLoanMove={handleLoanMove}>
  <KanbanBoard.Column title="Pending" status="pending">
    {pendingLoans.map(loan => (
      <KanbanBoard.Card key={loan.id} loan={loan} />
    ))}
  </KanbanBoard.Column>
</KanbanBoard>
```

### **Higher-Order Components for Extension Context**
```typescript
// ✅ DO: HOC for extension functionality
interface WithExtensionProps {
  isExtensionActive: boolean;
  extensionConfig: ExtensionConfig;
}

function withExtension<P extends object>(
  Component: React.ComponentType<P & WithExtensionProps>
): React.FC<P> {
  return (props) => {
    const { isActive, config } = useExtensionContext();
    
    return (
      <Component
        {...props}
        isExtensionActive={isActive}
        extensionConfig={config}
      />
    );
  };
}

// Usage
const EnhancedDashboard = withExtension(Dashboard);
```

## **Performance Optimization**

### **Memoization**
```typescript
// ✅ DO: Proper memoization with dependencies
const LoanCard = React.memo<{ loan: LoanData; onClick: (id: LoanId) => void }>(
  ({ loan, onClick }) => {
    const handleClick = useCallback(() => {
      onClick(loan.id);
    }, [loan.id, onClick]);

    const formattedAmount = useMemo(() => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(loan.amount);
    }, [loan.amount]);

    return (
      <div onClick={handleClick}>
        <h4>{loan.borrowerName}</h4>
        <p>{formattedAmount}</p>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for performance
    return (
      prevProps.loan.id === nextProps.loan.id &&
      prevProps.loan.updatedAt.getTime() === nextProps.loan.updatedAt.getTime()
    );
  }
);
```

### **Virtual Scrolling for Large Lists**
```typescript
// ✅ DO: Virtual scrolling for performance
interface VirtualLoanListProps {
  loans: LoanData[];
  onLoanClick: (loan: LoanData) => void;
  itemHeight: number;
  containerHeight: number;
}

const VirtualLoanList: React.FC<VirtualLoanListProps> = ({
  loans,
  onLoanClick,
  itemHeight,
  containerHeight
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      loans.length
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, loans.length]);

  const visibleLoans = loans.slice(visibleRange.startIndex, visibleRange.endIndex);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: loans.length * itemHeight, position: 'relative' }}>
        {visibleLoans.map((loan, index) => (
          <div
            key={loan.id}
            style={{
              position: 'absolute',
              top: (visibleRange.startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%',
            }}
          >
            <LoanCard loan={loan} onClick={() => onLoanClick(loan)} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## **Error Boundaries**

### **Extension Error Boundary**
```typescript
// ✅ DO: Comprehensive error boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ExtensionErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to extension background script
    chrome.runtime.sendMessage({
      action: 'logError',
      payload: {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong in the Pipeline Pro extension</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## **Testing Patterns**

### **Component Testing**
```typescript
// ✅ DO: Comprehensive component testing
describe('Dashboard Component', () => {
  const mockProps: DashboardProps = {
    currentRole: 'LoanOfficer',
    selectedUser: 'all',
    onRoleChange: jest.fn(),
    onUserChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders role selector with correct options', () => {
    render(<Dashboard {...mockProps} />);
    
    expect(screen.getByLabelText('Role Selector')).toBeInTheDocument();
    expect(screen.getByText('Loan Officer')).toBeInTheDocument();
    expect(screen.getByText('Processor')).toBeInTheDocument();
  });

  it('calls onRoleChange when role is selected', async () => {
    const user = userEvent.setup();
    render(<Dashboard {...mockProps} />);
    
    await user.selectOptions(screen.getByLabelText('Role Selector'), 'Processor');
    
    expect(mockProps.onRoleChange).toHaveBeenCalledWith('Processor');
  });

  it('displays loans for current role', () => {
    const mockLoans = [
      createMockLoan({ id: '1', status: { type: 'pending', submittedAt: new Date() } }),
      createMockLoan({ id: '2', status: { type: 'approved', approvedAt: new Date(), approvedBy: 'user1' } }),
    ];
    
    render(<Dashboard {...mockProps} />, {
      wrapper: ({ children }) => (
        <LoanDataProvider loans={mockLoans}>
          {children}
        </LoanDataProvider>
      ),
    });
    
    expect(screen.getByText('Pending Applications')).toBeInTheDocument();
    expect(screen.getByText('Approved Loans')).toBeInTheDocument();
  });
});
```

## **Anti-Patterns to Avoid**

### **❌ DON'T: Mutate Props or State**
```typescript
// ❌ DON'T: Direct mutation
const Component = ({ loans }: { loans: LoanData[] }) => {
  loans.push(newLoan); // Mutating props
  return <div />;
};

// ✅ DO: Immutable updates
const Component = ({ loans, onAddLoan }: { loans: LoanData[]; onAddLoan: (loan: LoanData) => void }) => {
  const handleAdd = () => {
    onAddLoan(newLoan); // Let parent handle state updates
  };
  return <button onClick={handleAdd}>Add Loan</button>;
};
```

### **❌ DON'T: Use Index as Key**
```typescript
// ❌ DON'T: Index as key
{loans.map((loan, index) => (
  <LoanCard key={index} loan={loan} />
))}

// ✅ DO: Use stable unique identifiers
{loans.map((loan) => (
  <LoanCard key={loan.id} loan={loan} />
))}
```

### **❌ DON'T: Create Functions in Render**
```typescript
// ❌ DON'T: New function on every render
const Component = ({ loans }: { loans: LoanData[] }) => (
  <div>
    {loans.map(loan => (
      <LoanCard 
        key={loan.id} 
        loan={loan} 
        onClick={() => handleClick(loan.id)} // New function every render
      />
    ))}
  </div>
);

// ✅ DO: Use useCallback for stable references
const Component = ({ loans, onLoanClick }: { loans: LoanData[]; onLoanClick: (id: LoanId) => void }) => {
  const handleClick = useCallback((id: LoanId) => {
    onLoanClick(id);
  }, [onLoanClick]);

  return (
    <div>
      {loans.map(loan => (
        <LoanCard 
          key={loan.id} 
          loan={loan} 
          onClick={handleClick}
        />
      ))}
    </div>
  );
};
```

