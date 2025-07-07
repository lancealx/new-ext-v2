/**
 * Analytics Service - Tracks user activity and provides analytics data
 * 
 * This service logs user actions, extension usage patterns, and performance metrics
 * for analysis in the admin dashboard.
 */

import { userService } from './userService';
import { tokenService } from './tokenService';

interface UserActivity {
  timestamp: string;
  userId: string;
  email: string;
  action: string;
  details: any;
  domain: string;
  url?: string;
  sessionId: string;
  extensionVersion: string;
}

interface PerformanceMetric {
  timestamp: string;
  metric: string;
  value: number;
  context: any;
  userId: string;
}

interface SessionData {
  sessionId: string;
  startTime: string;
  lastActivity: string;
  userId: string;
  domain: string;
  actions: number;
}

type ActivityListener = (activity: UserActivity) => void;

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private sessionStartTime: string;
  private listeners: ActivityListener[] = [];
  private currentUser: any = null;
  private isInitialized = false;
  private readonly MAX_LOGS = 1000; // Maximum logs to keep in storage
  private readonly BATCH_SIZE = 10; // Send logs in batches

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date().toISOString();
    this.initializeTracking();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize the analytics service
   */
  async initialize(): Promise<void> {
    try {
      this.currentUser = await userService.getCurrentUser();
      this.isInitialized = true;
      
      // Log session start
      await this.logActivity('session_start', {
        extensionVersion: chrome.runtime.getManifest().version,
        userAgent: navigator.userAgent,
        domain: window.location?.hostname || 'unknown'
      });
      
      // Set up page navigation tracking
      this.setupNavigationTracking();
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      console.log('Analytics service initialized with session:', this.sessionId);
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
    }
  }

  /**
   * Log a user activity
   */
  async logActivity(action: string, details: any = {}, url?: string): Promise<void> {
    if (!this.isInitialized) {
      // Queue the activity until initialized
      setTimeout(() => this.logActivity(action, details, url), 100);
      return;
    }

    try {
      const activity: UserActivity = {
        timestamp: new Date().toISOString(),
        userId: this.currentUser?.userId || 'unknown',
        email: this.currentUser?.email || 'unknown',
        action,
        details,
        domain: window.location?.hostname || 'unknown',
        url: url || window.location?.href,
        sessionId: this.sessionId,
        extensionVersion: chrome.runtime.getManifest().version
      };

      // Store locally
      await this.storeActivity(activity);
      
      // Notify listeners
      this.notifyListeners(activity);
      
      // Update session data
      await this.updateSession();
      
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Log performance metrics
   */
  async logPerformance(metric: string, value: number, context: any = {}): Promise<void> {
    try {
      const performanceData: PerformanceMetric = {
        timestamp: new Date().toISOString(),
        metric,
        value,
        context,
        userId: this.currentUser?.userId || 'unknown'
      };

      // Store performance metrics
      const result = await chrome.storage.local.get('performance_metrics');
      const metrics = result.performance_metrics || [];
      
      metrics.push(performanceData);
      
      // Keep only last 500 metrics
      if (metrics.length > 500) {
        metrics.splice(0, metrics.length - 500);
      }
      
      await chrome.storage.local.set({ performance_metrics: metrics });
    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }

  /**
   * Log loan-related activities
   */
  async logLoanActivity(loanId: string, action: 'view' | 'search' | 'edit' | 'export', details: any = {}): Promise<void> {
    await this.logActivity(`loan_${action}`, {
      loanId,
      ...details
    });
  }

  /**
   * Log search activities
   */
  async logSearchActivity(searchTerm: string, resultsCount: number, filters: any = {}): Promise<void> {
    await this.logActivity('search', {
      searchTerm,
      resultsCount,
      filters,
      searchType: 'popup'
    });
  }

  /**
   * Log extension popup usage
   */
  async logPopupActivity(action: 'open' | 'close' | 'search' | 'navigate', details: any = {}): Promise<void> {
    await this.logActivity(`popup_${action}`, details);
  }

  /**
   * Log feature usage
   */
  async logFeatureUsage(feature: string, action: string, details: any = {}): Promise<void> {
    await this.logActivity(`feature_${feature}`, {
      featureAction: action,
      ...details
    });
  }

  /**
   * Log errors and exceptions
   */
  async logError(error: Error, context: any = {}): Promise<void> {
    await this.logActivity('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      context
    });
  }

  /**
   * Get user activity logs for admin dashboard
   */
  async getActivityLogs(limit: number = 100): Promise<UserActivity[]> {
    try {
      const result = await chrome.storage.local.get('user_activity_logs');
      const logs = result.user_activity_logs || [];
      
      return logs
        .sort((a: UserActivity, b: UserActivity) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get activity logs:', error);
      return [];
    }
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(): Promise<any> {
    try {
      const result = await chrome.storage.local.get(['user_activity_logs', 'session_data']);
      const logs = result.user_activity_logs || [];
      const sessionData = result.session_data || {};

      // Calculate session statistics
      const sessionLogs = logs.filter((log: UserActivity) => log.sessionId === this.sessionId);
      
      return {
        currentSession: {
          sessionId: this.sessionId,
          startTime: this.sessionStartTime,
          duration: Date.now() - new Date(this.sessionStartTime).getTime(),
          actionsCount: sessionLogs.length,
          userId: this.currentUser?.userId,
          email: this.currentUser?.email
        },
        totalSessions: Object.keys(sessionData).length,
        totalActions: logs.length,
        mostActiveFeatures: this.calculateMostUsedFeatures(logs),
        dailyActivity: this.calculateDailyActivity(logs)
      };
    } catch (error) {
      console.error('Failed to get session analytics:', error);
      return null;
    }
  }

  /**
   * Add activity listener
   */
  addListener(listener: ActivityListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove activity listener
   */
  removeListener(listener: ActivityListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Clear all activity logs (admin function)
   */
  async clearLogs(): Promise<void> {
    try {
      await chrome.storage.local.set({ 
        user_activity_logs: [],
        performance_metrics: [],
        session_data: {}
      });
      console.log('Analytics logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Export analytics data
   */
  async exportData(): Promise<any> {
    try {
      const result = await chrome.storage.local.get([
        'user_activity_logs',
        'performance_metrics', 
        'session_data'
      ]);
      
      return {
        exportDate: new Date().toISOString(),
        analytics: result,
        summary: await this.getSessionAnalytics()
      };
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      return null;
    }
  }

  // Private methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeActivity(activity: UserActivity): Promise<void> {
    const result = await chrome.storage.local.get('user_activity_logs');
    const logs = result.user_activity_logs || [];
    
    logs.push(activity);
    
    // Keep only the most recent logs
    if (logs.length > this.MAX_LOGS) {
      logs.splice(0, logs.length - this.MAX_LOGS);
    }
    
    await chrome.storage.local.set({ user_activity_logs: logs });
  }

  private notifyListeners(activity: UserActivity): void {
    this.listeners.forEach(listener => {
      try {
        listener(activity);
      } catch (error) {
        console.error('Error in analytics listener:', error);
      }
    });
  }

  private async updateSession(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('session_data');
      const sessionData = result.session_data || {};
      
      sessionData[this.sessionId] = {
        sessionId: this.sessionId,
        startTime: this.sessionStartTime,
        lastActivity: new Date().toISOString(),
        userId: this.currentUser?.userId || 'unknown',
        domain: window.location?.hostname || 'unknown',
        actions: (sessionData[this.sessionId]?.actions || 0) + 1
      };
      
      await chrome.storage.local.set({ session_data: sessionData });
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  private initializeTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.logActivity('page_visibility', {
        hidden: document.hidden
      });
    });

    // Track clicks on extension-injected elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-pipeline-pro]')) {
        this.logActivity('ui_interaction', {
          element: target.tagName,
          className: target.className,
          id: target.id
        });
      }
    });
  }

  private setupNavigationTracking(): void {
    // Track URL changes (for SPA navigation)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        this.logActivity('navigation', {
          from: currentUrl,
          to: window.location.href
        });
        currentUrl = window.location.href;
      }
    }, 1000);
  }

  private setupPerformanceMonitoring(): void {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.logPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart, {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            domInteractive: navigation.domInteractive - navigation.fetchStart
          });
        }
      }, 0);
    });

    // Track API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.logPerformance('api_response_time', endTime - startTime, {
          url: args[0]?.toString(),
          status: response.status,
          ok: response.ok
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.logPerformance('api_response_time', endTime - startTime, {
          url: args[0]?.toString(),
          error: true
        });
        throw error;
      }
    };
  }

  private calculateMostUsedFeatures(logs: UserActivity[]): any[] {
    const featureCounts = logs.reduce((acc, log) => {
      const feature = log.action.split('_')[0];
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(featureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));
  }

  private calculateDailyActivity(logs: UserActivity[]): any[] {
    const dailyCounts = logs.reduce((acc, log) => {
      const date = log.timestamp.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyCounts)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30)
      .map(([date, count]) => ({ date, count }));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.listeners = [];
    // Log session end
    this.logActivity('session_end', {
      duration: Date.now() - new Date(this.sessionStartTime).getTime()
    });
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService; 