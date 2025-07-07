/**
 * User Service - Handles user data, permissions, and session management
 * 
 * This service provides user profile management, permission checking,
 * session state tracking, and authentication state handling.
 */

interface UserData {
  userId: string;
  firstName: string;
  lastName: string;
  nickName: string;
  email?: string;
  permissions: number[];
  organizationId?: string;
  role?: string;
  sessionStart: string;
  lastUpdated: number;
}

interface UserPermissions {
  [key: string]: boolean;
}

interface UserSession {
  isAuthenticated: boolean;
  userData: UserData | null;
  permissions: UserPermissions;
  sessionStart: string;
  lastActivity: number;
}

interface UserApiResponse {
  data: {
    id: string;
    attributes: {
      firstName: string;
      lastName: string;
      nickName: string;
      email: string;
      permissions: number[];
      organizationId: string;
      role: string;
    };
  };
}

// User API endpoints
const USER_API_ENDPOINT = 'https://api.nanolos.com/nano/users?currentOnly=true';
const USER_STORAGE_KEY = 'nano_user_data';

// Session management
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
const USER_DATA_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Permission mappings (based on common enterprise patterns)
const PERMISSION_MAPPINGS: { [key: number]: string } = {
  4: 'read_loans',
  13: 'edit_loans',
  14: 'delete_loans',
  28: 'export_data',
  55: 'admin_access',
  85: 'analytics_access',
  96: 'user_management',
  120: 'system_config',
  129: 'audit_logs',
  142: 'bulk_operations',
  148: 'advanced_search',
  172: 'integration_access',
  183: 'reporting_access',
  240: 'super_admin',
  80: 'data_import'
};

export class UserService {
  private currentUser: UserData | null = null;
  private userSession: UserSession | null = null;
  private refreshTimer: number | null = null;
  private sessionTimer: number | null = null;
  private listeners: Array<(session: UserSession) => void> = [];
  private tokenService: any = null; // Will be injected during initialization

  /**
   * Initialize the user service and fetch user data
   */
  public async initialize(tokenService: any): Promise<boolean> {
    this.tokenService = tokenService;

    // First try to get user data from extension storage
    const storedUser = await this.getUserFromStorage();
    
    if (storedUser && this.isUserDataValid(storedUser)) {
      this.currentUser = storedUser;
      this.userSession = this.createUserSession(storedUser);
      
      // Notify listeners
      this.notifyListeners(this.userSession);
      
      // Schedule periodic refresh
      this.scheduleUserDataRefresh();
      this.scheduleSessionCheck();
      
      return true;
    }
    
    // If no valid user data in storage, fetch from API
    return this.fetchUserData();
  }

  /**
   * Get the current user session
   */
  public async getUserSession(): Promise<UserSession> {
    if (this.userSession) {
      // Check if session is still valid
      if (this.isSessionValid(this.userSession)) {
        // Update last activity
        this.userSession.lastActivity = Date.now();
        return this.userSession;
      } else {
        // Session expired, try to refresh
        const refreshed = await this.fetchUserData();
        if (refreshed && this.userSession) {
          return this.userSession;
        }
      }
    }
    
    // No valid session, try to fetch user data
    const fetched = await this.fetchUserData();
    
    if (fetched && this.userSession) {
      return this.userSession;
    }
    
    // Return empty session
    return {
      isAuthenticated: false,
      userData: null,
      permissions: {},
      sessionStart: new Date().toISOString(),
      lastActivity: Date.now()
    };
  }

  /**
   * Get current user data
   */
  public async getCurrentUser(): Promise<UserData | null> {
    const session = await this.getUserSession();
    return session.userData;
  }

  /**
   * Check if user has a specific permission
   */
  public async hasPermission(permission: string | number): Promise<boolean> {
    const session = await this.getUserSession();
    
    if (!session.isAuthenticated || !session.userData) {
      return false;
    }
    
    // If permission is a number, check if it's in the permissions array
    if (typeof permission === 'number') {
      return session.userData.permissions.includes(permission);
    }
    
    // If permission is a string, check the mapped permissions
    return session.permissions[permission] === true;
  }

  /**
   * Check if user has any of the specified permissions
   */
  public async hasAnyPermission(permissions: (string | number)[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all specified permissions
   */
  public async hasAllPermissions(permissions: (string | number)[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get user's display name
   */
  public async getDisplayName(): Promise<string> {
    const user = await this.getCurrentUser();
    if (!user) return 'Unknown User';
    
    return user.nickName || `${user.firstName} ${user.lastName}` || 'Unknown User';
  }

  /**
   * Get user's permissions as a readable list
   */
  public async getUserPermissions(): Promise<string[]> {
    const session = await this.getUserSession();
    
    if (!session.isAuthenticated || !session.userData) {
      return [];
    }
    
    return session.userData.permissions
      .map(perm => PERMISSION_MAPPINGS[perm])
      .filter(Boolean);
  }

  /**
   * Register a listener for user session updates
   */
  public addUserSessionListener(callback: (session: UserSession) => void): void {
    this.listeners.push(callback);
    
    // Immediately notify with current session
    if (this.userSession) {
      try {
        callback(this.userSession);
      } catch (error) {
        console.error('Error in user session listener:', error);
      }
    }
  }

  /**
   * Remove a user session listener
   */
  public removeUserSessionListener(callback: (session: UserSession) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Refresh user data from API
   */
  public async refreshUserData(): Promise<boolean> {
    return this.fetchUserData();
  }

  /**
   * Logout user and clear session
   */
  public async logout(): Promise<void> {
    this.currentUser = null;
    this.userSession = null;
    
    // Clear storage
    try {
      await chrome.storage.local.remove([USER_STORAGE_KEY]);
    } catch (error) {
      console.error('Failed to clear user storage:', error);
    }
    
    // Clear timers
    this.clearTimers();
    
    // Notify listeners
    this.notifyListeners({
      isAuthenticated: false,
      userData: null,
      permissions: {},
      sessionStart: new Date().toISOString(),
      lastActivity: Date.now()
    });
  }

  /**
   * Fetch user data from API
   */
  private async fetchUserData(): Promise<boolean> {
    try {
      if (!this.tokenService) {
        console.error('TokenService not initialized');
        return false;
      }
      
      const token = await this.tokenService.getToken();
      if (!token) {
        console.error('No valid token available for user data fetch');
        return false;
      }
      
      const response = await fetch(USER_API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.api+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`User data fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const result: UserApiResponse = await response.json();
      
      if (result.data && result.data.attributes) {
        const userData: UserData = {
          userId: result.data.id,
          firstName: result.data.attributes.firstName,
          lastName: result.data.attributes.lastName,
          nickName: result.data.attributes.nickName,
          email: result.data.attributes.email,
          permissions: result.data.attributes.permissions || [],
          organizationId: result.data.attributes.organizationId,
          role: result.data.attributes.role,
          sessionStart: new Date().toISOString(),
          lastUpdated: Date.now()
        };
        
        this.currentUser = userData;
        this.userSession = this.createUserSession(userData);
        
        // Store in extension storage
        await this.storeUserInExtension(userData);
        
        // Notify listeners
        this.notifyListeners(this.userSession);
        
        // Schedule periodic refresh
        this.scheduleUserDataRefresh();
        this.scheduleSessionCheck();
        
        return true;
      } else {
        console.error('Invalid user data response format');
        return false;
      }
    } catch (error) {
      console.error('User data fetch error:', error);
      return false;
    }
  }

  /**
   * Create user session from user data
   */
  private createUserSession(userData: UserData): UserSession {
    const permissions: UserPermissions = {};
    
    // Map numeric permissions to string permissions
    userData.permissions.forEach(permNum => {
      const permName = PERMISSION_MAPPINGS[permNum];
      if (permName) {
        permissions[permName] = true;
      }
    });
    
    return {
      isAuthenticated: true,
      userData,
      permissions,
      sessionStart: userData.sessionStart,
      lastActivity: Date.now()
    };
  }

  /**
   * Check if user data is valid
   */
  private isUserDataValid(userData: UserData): boolean {
    if (!userData || !userData.userId || !userData.firstName || !userData.lastName) {
      return false;
    }
    
    // Check if data is not too old
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - userData.lastUpdated > maxAge) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if session is still valid
   */
  private isSessionValid(session: UserSession): boolean {
    if (!session.isAuthenticated || !session.userData) {
      return false;
    }
    
    // Check session timeout
    if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
      return false;
    }
    
    return true;
  }

  /**
   * Store user data in extension storage
   */
  private async storeUserInExtension(userData: UserData): Promise<void> {
    try {
      await chrome.storage.local.set({
        [USER_STORAGE_KEY]: {
          userId: userData.userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          nickName: userData.nickName,
          email: userData.email,
          permissions: userData.permissions,
          organizationId: userData.organizationId,
          role: userData.role,
          sessionStart: userData.sessionStart,
          lastUpdated: userData.lastUpdated,
          storedAt: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to store user data in extension:', error);
    }
  }

  /**
   * Get user data from extension storage
   */
  private async getUserFromStorage(): Promise<UserData | null> {
    try {
      const result = await chrome.storage.local.get([USER_STORAGE_KEY]);
      const storedData = result[USER_STORAGE_KEY];
      
      if (!storedData) {
        return null;
      }
      
      return {
        userId: storedData.userId,
        firstName: storedData.firstName,
        lastName: storedData.lastName,
        nickName: storedData.nickName,
        email: storedData.email,
        permissions: storedData.permissions || [],
        organizationId: storedData.organizationId,
        role: storedData.role,
        sessionStart: storedData.sessionStart,
        lastUpdated: storedData.lastUpdated
      };
    } catch (error) {
      console.error('Failed to get user data from storage:', error);
      return null;
    }
  }

  /**
   * Schedule periodic user data refresh
   */
  private scheduleUserDataRefresh(): void {
    // Clear any existing timer
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
    }
    
    // Schedule next refresh
    this.refreshTimer = window.setTimeout(() => {
      this.fetchUserData().catch(error => {
        console.error('Periodic user data refresh failed:', error);
      });
    }, USER_DATA_REFRESH_INTERVAL);
  }

  /**
   * Schedule session validity check
   */
  private scheduleSessionCheck(): void {
    // Clear any existing timer
    if (this.sessionTimer !== null) {
      window.clearTimeout(this.sessionTimer);
    }
    
    // Schedule next session check
    this.sessionTimer = window.setTimeout(() => {
      if (this.userSession && !this.isSessionValid(this.userSession)) {
        this.logout();
      } else {
        this.scheduleSessionCheck();
      }
    }, 60000); // Check every minute
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.sessionTimer !== null) {
      window.clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Notify all listeners of session changes
   */
  private notifyListeners(session: UserSession): void {
    this.listeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Error in user session listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.clearTimers();
    this.listeners = [];
    this.currentUser = null;
    this.userSession = null;
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService; 