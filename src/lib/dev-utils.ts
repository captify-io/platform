/**
 * Development utilities for managing console logging
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const devLog = {
  /**
   * Navigation-specific logging for development
   */
  nav: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🧭 NAV: ${message}`, ...args);
    }
  },

  /**
   * Component lifecycle logging for development
   */
  component: (componentName: string, message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🔄 ${componentName}: ${message}`, ...args);
    }
  },

  /**
   * Error logging (always shown)
   */
  error: (message: string, error?: any) => {
    console.error(`❌ ERROR: ${message}`, error);
  },

  /**
   * Warning logging (always shown)
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ WARNING: ${message}`, ...args);
  },

  /**
   * API-related logging for development
   */
  api: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🌐 API: ${message}`, ...args);
    }
  },
};
