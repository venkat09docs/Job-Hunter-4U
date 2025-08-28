/**
 * Simple request deduplication system for Supabase calls
 * This intercepts requests at the network level to prevent duplicates
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class SimpleRequestCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly DEFAULT_TTL = 5000; // 5 seconds

  /**
   * Generate cache key from request details
   */
  private generateKey(url: string, method: string, body?: any): string {
    const normalizedUrl = url.split('?')[0]; // Remove timestamp params
    const sortedQuery = this.sortQueryParams(url);
    return btoa(`${method}:${normalizedUrl}:${sortedQuery}:${JSON.stringify(body) || ''}`);
  }

  /**
   * Sort query parameters for consistent cache keys
   */
  private sortQueryParams(url: string): string {
    try {
      const urlObj = new URL(url);
      const params = Array.from(urlObj.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      return params;
    } catch {
      return '';
    }
  }

  /**
   * Check if we should cache this request
   */
  private shouldCache(url: string, method: string): boolean {
    // Only cache GET requests
    if (method !== 'GET') return false;
    
    // Don't cache auth requests
    if (url.includes('/auth/')) return false;
    
    // Don't cache real-time subscriptions
    if (url.includes('realtime')) return false;

    // Don't cache subscription-critical data
    if (url.includes('profiles') && url.includes('user_id=eq.')) return false;
    
    // Don't cache user roles (affects permission checks)
    if (url.includes('user_roles')) return false;
    
    // Don't cache premium features (affects subscription checks)
    if (url.includes('premium_features')) return false;

    // Temporarily disable caching for user points and notifications to fix stream issues
    if (url.includes('user_activity_points')) return false;
    if (url.includes('notifications')) return false;
    if (url.includes('job_hunting_assignments')) return false;
    if (url.includes('job_hunting_evidence')) return false;

    return true;
  }

  /**
   * Get TTL based on URL
   */
  private getTTL(url: string): number {
    // Shorter cache for frequently changing data
    if (url.includes('user_activity_points') || url.includes('notifications')) {
      return 2000; // 2 seconds
    }
    
    // Longer cache for relatively static data
    if (url.includes('task_templates') || url.includes('profiles')) {
      return 10000; // 10 seconds
    }
    
    return this.DEFAULT_TTL;
  }

  /**
   * Clean expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const ttl = this.getTTL(key);
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
    
    // Clean up stale pending requests (older than 30 seconds)
    for (const [key, promise] of this.pendingRequests.entries()) {
      // Check if promise is settled by checking its state
      Promise.race([promise, Promise.resolve('__timeout__')])
        .then((result) => {
          if (result === '__timeout__') {
            this.pendingRequests.delete(key);
          }
        });
    }
  }

  /**
   * Intercept and cache requests
   */
  async interceptRequest<T>(
    originalFetch: () => Promise<T>,
    url: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> {
    // Cleanup periodically
    if (Math.random() < 0.05) { // 5% chance
      this.cleanup();
    }

    if (!this.shouldCache(url, method)) {
      return originalFetch();
    }

    const key = this.generateKey(url, method, body);
    const now = Date.now();
    const ttl = this.getTTL(url);

    // Check cache first
    const cached = this.cache.get(key);
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }

    // Check pending requests
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Make new request
    const requestPromise = originalFetch()
      .then((data) => {
        // Cache the result
        this.cache.set(key, {
          data,
          timestamp: now
        });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        try {
          const decoded = atob(key);
          if (decoded.includes(pattern)) {
            keysToDelete.push(key);
          }
        } catch {
          // Invalid key, skip
        }
      }
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
      });
    } else {
      this.cache.clear();
      this.pendingRequests.clear();
    }
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys()).map(key => {
        try {
          return atob(key);
        } catch {
          return 'invalid-key';
        }
      })
    };
  }
}

// Global instance
export const requestCache = new SimpleRequestCache();

/**
 * Hook to use request caching
 */
export const useRequestCache = () => {
  return {
    clearCache: requestCache.clearCache.bind(requestCache),
    getStats: requestCache.getStats.bind(requestCache)
  };
};