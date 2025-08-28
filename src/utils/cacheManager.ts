/**
 * Cache management utilities for handling subscription and auth state changes
 */

import { requestCache } from './simpleRequestCache';

/**
 * Clear subscription-related cache when user subscription changes
 */
export function clearSubscriptionCache(userId?: string) {
  // Clear profile cache
  requestCache.clearCache('profiles');
  
  // Clear premium features cache
  requestCache.clearCache('premium_features');
  
  // Clear user roles cache
  requestCache.clearCache('user_roles');
  
  // Clear user-specific caches if userId provided
  if (userId) {
    requestCache.clearCache(`user_id=eq.${userId}`);
  }
}

/**
 * Clear auth-related cache when user logs in/out
 */
export function clearAuthCache() {
  // Clear all caches on auth state change
  requestCache.clearCache();
}

/**
 * Force refresh of critical user data
 */
export function refreshUserData(userId: string) {
  clearSubscriptionCache(userId);
}