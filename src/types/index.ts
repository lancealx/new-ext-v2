// Core extension types
export interface ExtensionConfig {
  enabled: boolean;
  environment: 'development' | 'test' | 'production';
  apiEndpoints: {
    nano: string;
    config: string;
  };
  features: {
    dashboard: boolean;
    popup: boolean;
    sidepanel: boolean;
  };
  version: string;
}

// User and role types
export type UserRole = 
  | 'LoanOfficer'
  | 'LoanOfficerAssistant'
  | 'Processor'
  | 'Underwriter'
  | 'Closer'
  | 'Funder';

export type UserId = string & { readonly __brand: 'UserId' };
export type LoanId = string & { readonly __brand: 'LoanId' };

// Loan status discriminated union
export type LoanStatus = 
  | { type: 'pending'; submittedAt: Date }
  | { type: 'approved'; approvedAt: Date; approvedBy: string }
  | { type: 'rejected'; rejectedAt: Date; reason: string }
  | { type: 'underwriting'; startedAt: Date; underwriter: string }
  | { type: 'closing'; scheduledDate: Date; closingAgent: string }
  | { type: 'funded'; fundedAt: Date; amount: number }
  | { type: 'cancelled'; cancelledAt: Date; reason: string };

export interface LoanData {
  readonly id: LoanId;
  readonly borrowerName: string;
  readonly coborrowername?: string;
  readonly amount: number;
  readonly loanType: string;
  readonly purpose: string;
  readonly property: {
    address: string;
    city: string;
    state: string;
    zip: string;
    propertyType: string;
    value: number;
  };
  readonly status: LoanStatus;
  readonly priority: 'high' | 'medium' | 'low';
  readonly assignedTo: UserId;
  readonly loanOfficer: UserId;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly milestones: LoanMilestone[];
  readonly documents: LoanDocument[];
}

export interface LoanMilestone {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'overdue';
  dueDate: Date;
  completedDate?: Date;
  assignedTo: UserId;
}

export interface LoanDocument {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'received' | 'approved' | 'rejected';
  uploadedDate?: Date;
  reviewedDate?: Date;
  reviewedBy?: UserId;
}

// API types
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

// Extension message types
export interface ExtensionMessage {
  action: 'shareToken' | 'getConfig' | 'updateData' | 'refreshDashboard' | 'searchLoans';
  payload?: any;
  source?: 'content' | 'background' | 'popup' | 'sidepanel';
  timestamp?: number;
}

// Storage types
export interface StorageData {
  gridtoken: string;
  userPreferences: UserPreferences;
  dashboardConfig: DashboardConfig;
  lastSync: number;
  cachedLoans: LoanData[];
}

export interface UserPreferences {
  defaultRole: UserRole;
  selectedUser: UserId | 'all';
  dashboardLayout: 'kanban' | 'grid' | 'list';
  notifications: {
    enabled: boolean;
    types: string[];
  };
  theme: 'light' | 'dark' | 'system';
}

export interface DashboardConfig {
  kanbanColumns: KanbanColumn[];
  refreshInterval: number;
  maxLoansPerColumn: number;
  autoRefresh: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  statuses: LoanStatus['type'][];
  color: string;
  order: number;
  visible: boolean;
}

// Component prop types
export interface DashboardProps {
  readonly currentRole: UserRole;
  readonly selectedUser: UserId | 'all';
  readonly onRoleChange: (role: UserRole) => void;
  readonly onUserChange: (user: UserId | 'all') => void;
  readonly className?: string;
}

// URL pattern types
export interface URLPatterns {
  search: RegExp;
  appDetail: RegExp;
  loanApp: RegExp;
}

export type PageType = 'search' | 'app' | 'loan' | 'other';

// Utility type helpers
export type CreateLoanRequest = Omit<LoanData, 'id' | 'createdAt' | 'updatedAt' | 'milestones' | 'documents'>;
export type PartialLoanUpdate = Partial<Pick<LoanData, 'status' | 'priority' | 'assignedTo'>>;

// JWT payload type
export interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
} 