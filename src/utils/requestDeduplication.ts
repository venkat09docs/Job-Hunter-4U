/**
 * Request deduplication utility for Supabase API calls
 * Prevents identical requests from being made simultaneously
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5000; // 5 seconds cache
  private readonly MAX_PENDING_TIME = 30000; // 30 seconds max pending time

  /**
   * Generate a unique key for the request
   */
  private generateKey(url: string, method: string, body?: any, headers?: any): string {
    const keyData = {
      url: url.split('?')[0], // Remove query params for base URL
      method,
      query: this.extractQueryParams(url),
      body: body ? JSON.stringify(body) : null,
      authHeader: headers?.authorization ? 'authenticated' : 'anonymous'
    };
    
    return btoa(JSON.stringify(keyData));
  }

  /**
   * Extract and normalize query parameters
   */
  private extractQueryParams(url: string): Record<string, any> {
    const urlObj = new URL(url, 'https://example.com');
    const params: Record<string, any> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }

  /**
   * Clean up expired cache entries and stale pending requests
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Clean expired cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    
    // Clean stale pending requests
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.MAX_PENDING_TIME) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Check if we should use cached response
   */
  private getCachedResponse(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  /**
   * Deduplicate a request
   */
  async deduplicate<T>(
    requestFn: () => Promise<T>,
    url: string,
    method: string = 'GET',
    body?: any,
    headers?: any,
    options: { ttl?: number; skipCache?: boolean } = {}
  ): Promise<T> {
    const key = this.generateKey(url, method, body, headers);
    const { ttl = this.DEFAULT_TTL, skipCache = false } = options;

    // Clean up periodically
    if (Math.random() < 0.1) {
      this.cleanup();
    }

    // Check cache first (only for GET requests and if not skipping cache)
    if (method === 'GET' && !skipCache) {
      const cached = this.getCachedResponse(key);
      if (cached) {
        return cached;
      }
    }

    // Check if there's already a pending request
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing.promise;
    }

    // Create new request
    const requestPromise = requestFn()
      .then((result) => {
        // Cache GET requests
        if (method === 'GET' && !skipCache) {
          this.cache.set(key, {
            data: result,
            timestamp: Date.now(),
            ttl
          });
        }
        return result;
      })
      .finally(() => {
        // Remove from pending requests
        this.pendingRequests.delete(key);
      });

    // Store pending request
    this.pendingRequests.set(key, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    return requestPromise;
  }

  /**
   * Clear all caches (useful for logout, data refresh, etc.)
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Clear cache for specific patterns
   */
  clearCachePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache.entries()) {
      try {
        const decoded = JSON.parse(atob(key));
        if (decoded.url.includes(pattern)) {
          keysToDelete.push(key);
        }
      } catch (e) {
        // Invalid key format, skip
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Hook to use request deduplication
 */
export const useRequestDeduplication = () => {
  return {
    deduplicate: requestDeduplicator.deduplicate.bind(requestDeduplicator),
    clearCache: requestDeduplicator.clearCache.bind(requestDeduplicator),
    clearCachePattern: requestDeduplicator.clearCachePattern.bind(requestDeduplicator)
  };
};