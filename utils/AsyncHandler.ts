import { injectable } from 'inversify';
import 'reflect-metadata';

/**
 * Utility class for standardizing async operations and error handling
 * throughout the application
 */
@injectable()
export class AsyncHandler {
  /**
   * Wraps an async function with standardized error handling
   * 
   * @param asyncFn - The async function to wrap
   * @param errorMessage - Custom error message prefix
   * @returns A wrapped function with standardized error handling
   */
  static wrap<T, Args extends any[]>(
    asyncFn: (...args: Args) => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): (...args: Args) => Promise<[T | null, Error | null]> {
    return async (...args: Args): Promise<[T | null, Error | null]> => {
      try {
        const result = await asyncFn(...args);
        return [result, null];
      } catch (error) {
        const formattedError = error instanceof Error 
          ? error 
          : new Error(`${errorMessage}: ${error}`);
        return [null, formattedError];
      }
    };
  }

  /**
   * Executes multiple async operations in parallel and returns all results
   * 
   * @param asyncFunctions - Array of async functions to execute
   * @returns Promise resolving to array of results and errors
   */
  static async parallel<T>(
    asyncFunctions: Array<() => Promise<T>>
  ): Promise<Array<[T | null, Error | null]>> {
    const wrappedFunctions = asyncFunctions.map(fn => 
      AsyncHandler.wrap(fn, 'Parallel operation failed')
    );
    
    return Promise.all(wrappedFunctions.map(fn => fn()));
  }

  /**
   * Executes multiple async operations in sequence and returns all results
   * 
   * @param asyncFunctions - Array of async functions to execute
   * @param stopOnError - Whether to stop execution on first error
   * @returns Promise resolving to array of results and errors
   */
  static async sequence<T>(
    asyncFunctions: Array<() => Promise<T>>,
    stopOnError: boolean = false
  ): Promise<Array<[T | null, Error | null]>> {
    const results: Array<[T | null, Error | null]> = [];
    
    for (const fn of asyncFunctions) {
      const wrappedFn = AsyncHandler.wrap(fn, 'Sequential operation failed');
      const result = await wrappedFn();
      results.push(result);
      
      if (stopOnError && result[1] !== null) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Retries an async operation with exponential backoff
   * 
   * @param asyncFn - The async function to retry
   * @param maxRetries - Maximum number of retry attempts
   * @param initialDelay - Initial delay in milliseconds
   * @param maxDelay - Maximum delay in milliseconds
   * @returns Promise resolving to result or error
   */
  static async retry<T, Args extends any[]>(
    asyncFn: (...args: Args) => Promise<T>,
    args: Args,
    maxRetries: number = 3,
    initialDelay: number = 1000,
    maxDelay: number = 10000
  ): Promise<[T | null, Error | null]> {
    let lastError: Error | null = null;
    let delay = initialDelay;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFn(...args);
        return [result, null];
      } catch (error) {
        lastError = error instanceof Error 
          ? error 
          : new Error(`Retry operation failed: ${error}`);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase delay for next attempt (with max limit)
        delay = Math.min(delay * 2, maxDelay);
      }
    }
    
    return [null, lastError];
  }

  /**
   * Creates a debounced version of an async function
   * 
   * @param asyncFn - The async function to debounce
   * @param wait - Debounce wait time in milliseconds
   * @returns Debounced function
   */
  static debounce<T, Args extends any[]>(
    asyncFn: (...args: Args) => Promise<T>,
    wait: number = 300
  ): (...args: Args) => Promise<T> {
    let timeout: NodeJS.Timeout | null = null;
    let pendingPromise: Promise<T> | null = null;
    let pendingResolve: ((value: T) => void) | null = null;
    let pendingReject: ((reason: any) => void) | null = null;
    
    return function(...args: Args): Promise<T> {
      if (!pendingPromise) {
        pendingPromise = new Promise<T>((resolve, reject) => {
          pendingResolve = resolve;
          pendingReject = reject;
        });
      }
      
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(async () => {
        try {
          const result = await asyncFn(...args);
          if (pendingResolve) pendingResolve(result);
        } catch (error) {
          if (pendingReject) pendingReject(error);
        } finally {
          timeout = null;
          pendingPromise = null;
          pendingResolve = null;
          pendingReject = null;
        }
      }, wait);
      
      return pendingPromise;
    };
  }

  /**
   * Creates a throttled version of an async function
   * 
   * @param asyncFn - The async function to throttle
   * @param limit - Throttle limit in milliseconds
   * @returns Throttled function
   */
  static throttle<T, Args extends any[]>(
    asyncFn: (...args: Args) => Promise<T>,
    limit: number = 300
  ): (...args: Args) => Promise<T> {
    let lastRun = 0;
    let pendingPromise: Promise<T> | null = null;
    let pendingResolve: ((value: T) => void) | null = null;
    let pendingReject: ((reason: any) => void) | null = null;
    let pendingArgs: Args | null = null;
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: Args): Promise<T> {
      const now = Date.now();
      
      if (!pendingPromise) {
        pendingPromise = new Promise<T>((resolve, reject) => {
          pendingResolve = resolve;
          pendingReject = reject;
        });
      }
      
      // Update pending args to latest call
      pendingArgs = args;
      
      if (now - lastRun >= limit) {
        // Execute immediately
        lastRun = now;
        executeFunction();
      } else if (!timeout) {
        // Schedule execution
        const timeToWait = limit - (now - lastRun);
        timeout = setTimeout(() => {
          lastRun = Date.now();
          executeFunction();
          timeout = null;
        }, timeToWait);
      }
      
      return pendingPromise;
      
      async function executeFunction() {
        if (!pendingArgs || !pendingResolve || !pendingReject) return;
        
        try {
          const result = await asyncFn(...pendingArgs);
          pendingResolve(result);
        } catch (error) {
          pendingReject(error);
        } finally {
          pendingPromise = null;
          pendingResolve = null;
          pendingReject = null;
          pendingArgs = null;
        }
      }
    };
  }

  /**
   * Adds a timeout to an async function
   * 
   * @param asyncFn - The async function to add timeout to
   * @param timeoutMs - Timeout in milliseconds
   * @returns Function with timeout
   */
  static withTimeout<T, Args extends any[]>(
    asyncFn: (...args: Args) => Promise<T>,
    timeoutMs: number = 5000
  ): (...args: Args) => Promise<[T | null, Error | null]> {
    return async (...args: Args): Promise<[T | null, Error | null]> => {
      return new Promise<[T | null, Error | null]>(resolve => {
        let isResolved = false;
        
        // Create timeout
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            resolve([null, new Error(`Operation timed out after ${timeoutMs}ms`)]);
          }
        }, timeoutMs);
        
        // Execute function
        asyncFn(...args)
          .then(result => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
              resolve([result, null]);
            }
          })
          .catch(error => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
              resolve([null, error instanceof Error ? error : new Error(String(error))]);
            }
          });
      });
    };
  }
}
