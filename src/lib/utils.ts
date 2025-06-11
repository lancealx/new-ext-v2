import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Define types
export type LoanId = string;
export type UserId = string;

export enum PageType {
  SEARCH = 'search',
  LOAN_DETAIL = 'loanDetail',
  DASHBOARD = 'dashboard',
  OTHER = 'other'
}

/**
 * Combines multiple class names with Tailwind utilities
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a JWT token to access its payload
 */
export function parseJwt(token: string): any {
  try {
    // JWT tokens are in format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (middle part)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Format a date as MM/DD/YYYY
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

/**
 * Delay execution for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function until it succeeds or reaches max attempts
 */
export async function retry<T>(
  fn: () => Promise<T>, 
  maxAttempts: number = 3, 
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await delay(delayMs);
      }
    }
  }
  
  throw lastError || new Error('Function failed after multiple attempts');
} 