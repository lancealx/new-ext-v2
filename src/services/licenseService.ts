/**
 * License Service - Handles license validation, AG-Grid Enterprise integration, and feature blocking
 * 
 * This service provides robust license validation, remote endpoint checking, 
 * expiration handling, and feature access control.
 */

import { tokenService } from './tokenService';
import { userService } from './userService';

interface LicenseValidationResponse {
  valid: boolean;
  expires: string | null;
  features: string[];
  type: 'user' | 'domain' | 'none';
  daysRemaining: number;
  error?: string;
}

interface LicenseConfig {
  enabled: boolean;
  version: string;
  licenses: {
    domain_licenses: Record<string, {
      valid: boolean;
      expires: string;
      features: string[];
      max_users?: number;
    }>;
    user_licenses: Record<string, {
      valid: boolean;
      expires: string;
      features: string[];
    }>;
  };
  default_features: string[];
  license_server: string;
  last_updated: string;
}

export interface LicenseInfo {
  valid: boolean;
  expires: Date | null;
  features: string[];
  type: 'user' | 'domain' | 'none';
  daysRemaining: number;
  lastChecked: Date;
}

type LicenseListener = (licenseInfo: LicenseInfo) => void;

class LicenseService {
  private static instance: LicenseService;
  private licenseInfo: LicenseInfo | null = null;
  private listeners: LicenseListener[] = [];
  private validationInterval: NodeJS.Timeout | null = null;
  private readonly VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_KEY = 'license_info';
  private readonly CONFIG_CACHE_KEY = 'license_config';
  private readonly RENEWAL_WARNING_DAYS = 7;

  // Configurable endpoints
  private configUrl: string = 'https://storage.googleapis.com/toolbar_resources/config.json';
  private licenseEndpoint: string | null = null;

  private constructor() {
    this.loadCachedLicense();
    this.startPeriodicValidation();
  }

  static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  /**
   * Configure the license service endpoints
   */
  configure(configUrl?: string, licenseEndpoint?: string): void {
    if (configUrl) {
      this.configUrl = configUrl;
    }
    if (licenseEndpoint) {
      this.licenseEndpoint = licenseEndpoint;
    }
  }

  /**
   * Validate the license for the current user and domain
   */
  async validateLicense(): Promise<LicenseInfo> {
    try {
      // Get current domain and user info
      const domain = this.getCurrentDomain();
      const userEmail = await this.getCurrentUserEmail();

      let licenseInfo: LicenseInfo;

      if (this.licenseEndpoint) {
        // Use dynamic license endpoint (Google Cloud Function)
        licenseInfo = await this.validateWithEndpoint(domain, userEmail);
      } else {
        // Use static config file approach
        licenseInfo = await this.validateWithConfig(domain, userEmail);
      }

      // Cache the result
      this.licenseInfo = licenseInfo;
      await this.cacheLicense(licenseInfo);

      // Notify listeners
      this.notifyListeners(licenseInfo);

      // Setup AG-Grid license if valid
      if (licenseInfo.valid && licenseInfo.features.includes('data_grid')) {
        this.setupAGGridLicense();
      }

      return licenseInfo;
    } catch (error) {
      console.error('License validation failed:', error);
      return this.createFallbackLicense();
    }
  }

  /**
   * Validate license using dynamic endpoint
   */
  private async validateWithEndpoint(domain: string, userEmail: string): Promise<LicenseInfo> {
    const response = await fetch(this.licenseEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        userEmail,
        extensionId: chrome.runtime.id
      })
    });

    if (!response.ok) {
      throw new Error(`License validation failed: ${response.status} ${response.statusText}`);
    }

    const data: LicenseValidationResponse = await response.json();
    
    return {
      valid: data.valid,
      expires: data.expires ? new Date(data.expires) : null,
      features: data.features,
      type: data.type,
      daysRemaining: data.daysRemaining,
      lastChecked: new Date()
    };
  }

  /**
   * Validate license using static config file
   */
  private async validateWithConfig(domain: string, userEmail: string): Promise<LicenseInfo> {
    // Add cache-busting to prevent stale config
    const configUrl = `${this.configUrl}?cache-bust=${Date.now()}`;
    
    const response = await fetch(configUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
    }

    const config: LicenseConfig = await response.json();
    
    // Cache the config
    await this.cacheConfig(config);

    // Check if extension is enabled
    if (!config.enabled) {
      return {
        valid: false,
        expires: null,
        features: [],
        type: 'none',
        daysRemaining: 0,
        lastChecked: new Date()
      };
    }

    // Validate license
    const validation = this.validateLicenseFromConfig(config, domain, userEmail);
    
    return {
      valid: validation.valid,
      expires: validation.expires ? new Date(validation.expires) : null,
      features: validation.features,
      type: validation.type,
      daysRemaining: validation.daysRemaining,
      lastChecked: new Date()
    };
  }

  /**
   * Validate license from config data
   */
  private validateLicenseFromConfig(config: LicenseConfig, domain: string, userEmail: string): LicenseValidationResponse {
    const now = new Date();
    
    // Check user-specific license first
    if (config.licenses.user_licenses && config.licenses.user_licenses[userEmail]) {
      const userLicense = config.licenses.user_licenses[userEmail];
      const expires = new Date(userLicense.expires);
      
      if (userLicense.valid && expires > now) {
        return {
          valid: true,
          expires: userLicense.expires,
          features: userLicense.features || [],
          type: 'user',
          daysRemaining: Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
      }
    }
    
    // Check domain license
    const domainLicenses = config.licenses.domain_licenses || {};
    
    for (const [licensedDomain, license] of Object.entries(domainLicenses)) {
      if (this.domainMatches(domain, licensedDomain)) {
        const expires = new Date(license.expires);
        
        if (license.valid && expires > now) {
          return {
            valid: true,
            expires: license.expires,
            features: license.features || [],
            type: 'domain',
            daysRemaining: Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          };
        }
      }
    }
    
    // No valid license found - return default features
    return {
      valid: false,
      expires: null,
      features: config.default_features || [],
      type: 'none',
      daysRemaining: 0
    };
  }

  /**
   * Check if domain matches pattern (supports wildcards)
   */
  private domainMatches(domain: string, pattern: string): boolean {
    if (pattern.startsWith('*.')) {
      const baseDomain = pattern.slice(2);
      return domain.endsWith(baseDomain);
    }
    return domain === pattern;
  }

  /**
   * Get current domain from window location
   */
  private getCurrentDomain(): string {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.hostname;
    }
    return 'unknown';
  }

  /**
   * Get current user email from user service
   */
  private async getCurrentUserEmail(): Promise<string> {
    try {
      const userInfo = await userService.getCurrentUser();
      return userInfo?.email || 'unknown';
    } catch (error) {
      console.warn('Could not get user email for license validation:', error);
      return 'unknown';
    }
  }

  /**
   * Create fallback license info when validation fails
   */
  private createFallbackLicense(): LicenseInfo {
    return {
      valid: false,
      expires: null,
      features: ['search'], // Basic features only
      type: 'none',
      daysRemaining: 0,
      lastChecked: new Date()
    };
  }

  async getLicenseInfo(): Promise<LicenseInfo> {
    if (!this.licenseInfo) {
      return await this.validateLicense();
    }
    return this.licenseInfo;
  }

  isLicenseValid(): boolean {
    return this.licenseInfo?.valid ?? false;
  }

  hasFeature(feature: string): boolean {
    return this.licenseInfo?.features.includes(feature) ?? false;
  }

  getRemainingDays(): number {
    return this.licenseInfo?.daysRemaining ?? 0;
  }

  needsRenewal(): boolean {
    const days = this.getRemainingDays();
    return days > 0 && days <= this.RENEWAL_WARNING_DAYS;
  }

  addListener(listener: LicenseListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: LicenseListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(licenseInfo: LicenseInfo): void {
    this.listeners.forEach(listener => {
      try {
        listener(licenseInfo);
      } catch (error) {
        console.error('Error notifying license listener:', error);
      }
    });
  }

  private async loadCachedLicense(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.CACHE_KEY);
      if (result[this.CACHE_KEY]) {
        const cached = result[this.CACHE_KEY];
        this.licenseInfo = {
          ...cached,
          expires: cached.expires ? new Date(cached.expires) : null,
          lastChecked: new Date(cached.lastChecked)
        };
      }
    } catch (error) {
      console.error('Error loading cached license:', error);
    }
  }

  private async cacheLicense(licenseInfo: LicenseInfo): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.CACHE_KEY]: {
          ...licenseInfo,
          expires: licenseInfo.expires?.toISOString() || null,
          lastChecked: licenseInfo.lastChecked.toISOString()
        }
      });
    } catch (error) {
      console.error('Error caching license:', error);
    }
  }

  private async cacheConfig(config: LicenseConfig): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.CONFIG_CACHE_KEY]: {
          ...config,
          cached_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error caching config:', error);
    }
  }

  private startPeriodicValidation(): void {
    this.validationInterval = setInterval(() => {
      this.validateLicense().catch(error => {
        console.error('Periodic license validation failed:', error);
      });
    }, this.VALIDATION_INTERVAL);
  }

  private setupAGGridLicense(): void {
    // AG-Grid Enterprise license key would go here
    // This is typically set globally before AG-Grid is initialized
    console.log('AG-Grid Enterprise license validated');
  }

  cleanup(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
    this.listeners = [];
    this.licenseInfo = null;
  }
}

export const licenseService = LicenseService.getInstance();
export default licenseService; 