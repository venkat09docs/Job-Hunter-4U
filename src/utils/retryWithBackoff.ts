// Retry utility with exponential backoff for Job Hunter system

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  jitter: true
};

export class RetryError extends Error {
  public readonly attempts: number;
  public readonly lastError: Error;

  constructor(message: string, attempts: number, lastError: Error) {
    super(message);
    this.name = 'RetryError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

/**
 * Calculates delay for next retry attempt
 */
function calculateDelay(
  attempt: number, 
  baseDelay: number, 
  maxDelay: number, 
  backoffMultiplier: number, 
  jitter: boolean
): number {
  const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  if (jitter) {
    // Add random jitter to prevent thundering herd
    const jitterAmount = cappedDelay * 0.1 * Math.random();
    return cappedDelay + jitterAmount;
  }
  
  return cappedDelay;
}

/**
 * Retries an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === config.maxAttempts) {
        throw new RetryError(
          `Failed after ${config.maxAttempts} attempts. Last error: ${lastError.message}`,
          attempt,
          lastError
        );
      }
      
      const delay = calculateDelay(
        attempt,
        config.baseDelay,
        config.maxDelay,
        config.backoffMultiplier,
        config.jitter
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Creates a retry-enabled version of a Supabase function
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Partial<RetryOptions> = {}
): T {
  return ((...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
    return true;
  }
  
  // Temporary Supabase errors
  if (error?.status >= 500 && error?.status < 600) {
    return true;
  }
  
  // Rate limiting
  if (error?.status === 429) {
    return true;
  }
  
  // Timeout errors
  if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
    return true;
  }
  
  // Connection errors
  if (error?.message?.includes('connection') || error?.message?.includes('ECONNRESET')) {
    return true;
  }
  
  return false;
}

/**
 * Retries only if the error is retryable
 */
export async function retryIfRetryable<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw lastError;
      }
      
      if (attempt === config.maxAttempts) {
        throw new RetryError(
          `Failed after ${config.maxAttempts} attempts. Last error: ${lastError.message}`,
          attempt,
          lastError
        );
      }
      
      const delay = calculateDelay(
        attempt,
        config.baseDelay,
        config.maxDelay,
        config.backoffMultiplier,
        config.jitter
      );
      
      console.warn(`Attempt ${attempt} failed (retryable), retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Pre-configured retry options for different scenarios
 */
export const RETRY_CONFIGS = {
  // Fast retries for UI actions
  ui: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: true
  },
  
  // Standard retries for API calls
  api: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true
  },
  
  // Aggressive retries for critical operations
  critical: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  },
  
  // File upload retries
  upload: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 1.5,
    jitter: true
  }
} as const;