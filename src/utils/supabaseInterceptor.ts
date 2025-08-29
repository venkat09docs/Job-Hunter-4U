/**
 * Supabase request interceptor for automatic deduplication
 * This intercepts fetch calls to add caching without changing the API
 */

import React from 'react';
import { requestCache } from './simpleRequestCache';

// Store original fetch
const originalFetch = window.fetch;

/**
 * Enhanced fetch with request deduplication
 */
const enhancedFetch: typeof fetch = async (input, init?) => {
  const url = typeof input === 'string' ? input : input.url;
  const method = init?.method || 'GET';
  const body = init?.body;

  // Check if this is a Supabase API call
  const isSupabaseCall = url.includes('supabase.co/rest/v1') || 
                        url.includes('supabase.co/functions/v1');

  if (!isSupabaseCall) {
    // Not a Supabase call, use original fetch
    return originalFetch(input, init);
  }

  // Use cache for Supabase calls
  return requestCache.interceptRequest(
    () => originalFetch(input, init),
    url,
    method,
    body
  );
};

// Flag to track if interceptor is installed
let interceptorInstalled = false;

/**
 * Install the fetch interceptor
 */
export function installSupabaseInterceptor(): void {
  if (interceptorInstalled) {
    return;
  }

  // Replace global fetch
  window.fetch = enhancedFetch;
  interceptorInstalled = true;
}

/**
 * Uninstall the fetch interceptor
 */
export function uninstallSupabaseInterceptor(): void {
  if (!interceptorInstalled) {
    return;
  }

  // Restore original fetch
  window.fetch = originalFetch;
  interceptorInstalled = false;
}

/**
 * Check if interceptor is installed
 */
export function isInterceptorInstalled(): boolean {
  return interceptorInstalled;
}

/**
 * React hook to manage interceptor lifecycle
 */
export function useSupabaseInterceptor(enable: boolean = true) {
  React.useEffect(() => {
    if (enable) {
      installSupabaseInterceptor();
    } else {
      uninstallSupabaseInterceptor();
    }

    // Cleanup on unmount
    return () => {
      if (enable) {
        uninstallSupabaseInterceptor();
      }
    };
  }, [enable]);

  return {
    isInstalled: isInterceptorInstalled(),
    clearCache: requestCache.clearCache.bind(requestCache),
    getStats: requestCache.getStats.bind(requestCache)
  };
}

// Auto-install disabled to fix navigation issues
// if (typeof window !== 'undefined' && !import.meta.env.DISABLE_SUPABASE_CACHE) {
//   installSupabaseInterceptor();
// }