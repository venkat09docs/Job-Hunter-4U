// Domain redirect utility to ensure consistent domain usage
// This helps prevent session issues between www and non-www domains

export const ensureConsistentDomain = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  const currentHost = window.location.host;
  const currentUrl = window.location.href;
  
  // Define the preferred domain (without www)
  const preferredDomain = 'jobhunter4u.com';
  
  // Check if we're on the www version
  if (currentHost === `www.${preferredDomain}`) {
    // Redirect to non-www version
    const newUrl = currentUrl.replace(`www.${preferredDomain}`, preferredDomain);
    window.location.replace(newUrl);
    return;
  }
  
  // If we're on localhost or other domains, don't redirect
  if (currentHost.includes('localhost') || 
      currentHost.includes('127.0.0.1') || 
      currentHost.includes('lovableproject.com') ||
      currentHost.includes('lovable.app')) {
    return;
  }
};

// Custom storage wrapper that works across domains
export class CrossDomainStorage {
  private static getStorageKey(key: string): string {
    return `jh4u_${key}`;
  }

  static setItem(key: string, value: string): void {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, value);
      
      // Also set without prefix for backward compatibility
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to set localStorage item:', error);
    }
  }

  static getItem(key: string): string | null {
    try {
      // Try prefixed key first
      const storageKey = this.getStorageKey(key);
      let value = localStorage.getItem(storageKey);
      
      // Fallback to non-prefixed key
      if (!value) {
        value = localStorage.getItem(key);
        // If found, migrate to prefixed version
        if (value) {
          this.setItem(key, value);
        }
      }
      
      return value;
    } catch (error) {
      console.warn('Failed to get localStorage item:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove localStorage item:', error);
    }
  }

  static clear(): void {
    try {
      // Clear all items that start with our prefix
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('jh4u_') || key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}