import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AsyncHandler } from '../utils/AsyncHandler';

describe('AsyncHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });
  
  describe('wrap', () => {
    it('should return result and null error on success', async () => {
      // Arrange
      const successFn = async () => 'success';
      const wrappedFn = AsyncHandler.wrap(successFn);
      
      // Act
      const [result, error] = await wrappedFn();
      
      // Assert
      expect(result).toBe('success');
      expect(error).toBeNull();
    });
    
    it('should return null result and error on failure', async () => {
      // Arrange
      const errorMessage = 'Test error';
      const failureFn = async () => { throw new Error(errorMessage); };
      const wrappedFn = AsyncHandler.wrap(failureFn);
      
      // Act
      const [result, error] = await wrappedFn();
      
      // Assert
      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe(errorMessage);
    });
    
    it('should use custom error message if provided', async () => {
      // Arrange
      const customMessage = 'Custom error prefix';
      const errorMessage = 'Test error';
      const failureFn = async () => { throw new Error(errorMessage); };
      const wrappedFn = AsyncHandler.wrap(failureFn, customMessage);
      
      // Act
      const [result, error] = await wrappedFn();
      
      // Assert
      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe(errorMessage);
    });
  });
  
  describe('parallel', () => {
    it('should execute functions in parallel and return all results', async () => {
      // Arrange
      const fn1 = async () => 'result1';
      const fn2 = async () => 'result2';
      const fn3 = async () => { throw new Error('error3'); };
      
      // Act
      const results = await AsyncHandler.parallel([fn1, fn2, fn3]);
      
      // Assert
      expect(results.length).toBe(3);
      expect(results[0][0]).toBe('result1');
      expect(results[0][1]).toBeNull();
      expect(results[1][0]).toBe('result2');
      expect(results[1][1]).toBeNull();
      expect(results[2][0]).toBeNull();
      expect(results[2][1]).toBeInstanceOf(Error);
      expect(results[2][1]?.message).toBe('error3');
    });
  });
  
  describe('sequence', () => {
    it('should execute functions in sequence and return all results', async () => {
      // Arrange
      const fn1 = async () => 'result1';
      const fn2 = async () => 'result2';
      const fn3 = async () => { throw new Error('error3'); };
      
      // Act
      const results = await AsyncHandler.sequence([fn1, fn2, fn3]);
      
      // Assert
      expect(results.length).toBe(3);
      expect(results[0][0]).toBe('result1');
      expect(results[0][1]).toBeNull();
      expect(results[1][0]).toBe('result2');
      expect(results[1][1]).toBeNull();
      expect(results[2][0]).toBeNull();
      expect(results[2][1]).toBeInstanceOf(Error);
      expect(results[2][1]?.message).toBe('error3');
    });
    
    it('should stop execution on first error if stopOnError is true', async () => {
      // Arrange
      const fn1 = async () => 'result1';
      const fn2 = async () => { throw new Error('error2'); };
      const fn3 = jest.fn().mockResolvedValue('result3');
      
      // Act
      const results = await AsyncHandler.sequence([fn1, fn2, fn3], true);
      
      // Assert
      expect(results.length).toBe(2);
      expect(results[0][0]).toBe('result1');
      expect(results[0][1]).toBeNull();
      expect(results[1][0]).toBeNull();
      expect(results[1][1]).toBeInstanceOf(Error);
      expect(results[1][1]?.message).toBe('error2');
      expect(fn3).not.toHaveBeenCalled();
    });
  });
  
  describe('retry', () => {
    it('should return result on first successful attempt', async () => {
      // Arrange
      const successFn = jest.fn().mockResolvedValue('success');
      
      // Act
      const [result, error] = await AsyncHandler.retry(successFn, []);
      
      // Assert
      expect(result).toBe('success');
      expect(error).toBeNull();
      expect(successFn).toHaveBeenCalledTimes(1);
    });
    
    it('should retry on failure and return result if eventually succeeds', async () => {
      // Arrange
      const errorMessage = 'Test error';
      const failureFn = jest.fn()
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce('success');
      
      // Act
      const [result, error] = await AsyncHandler.retry(failureFn, [], 3, 10, 100);
      
      // For each retry, advance timers
      jest.advanceTimersByTime(10);
      jest.advanceTimersByTime(20);
      
      // Assert
      expect(result).toBe('success');
      expect(error).toBeNull();
      expect(failureFn).toHaveBeenCalledTimes(3);
    });
    
    it('should return error after max retries', async () => {
      // Arrange
      const errorMessage = 'Test error';
      const failureFn = jest.fn().mockRejectedValue(new Error(errorMessage));
      
      // Act
      const [result, error] = await AsyncHandler.retry(failureFn, [], 2, 10, 100);
      
      // For each retry, advance timers
      jest.advanceTimersByTime(10);
      jest.advanceTimersByTime(20);
      
      // Assert
      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe(errorMessage);
      expect(failureFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
  
  describe('debounce', () => {
    it('should only execute the function once after the wait period', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue('result');
      const debouncedFn = AsyncHandler.debounce(mockFn, 100);
      
      // Act
      const promise1 = debouncedFn();
      const promise2 = debouncedFn();
      const promise3 = debouncedFn();
      
      // Advance timers
      jest.advanceTimersByTime(100);
      
      // Wait for promises to resolve
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(result3).toBe('result');
    });
    
    it('should use the most recent arguments', async () => {
      // Arrange
      const mockFn = jest.fn().mockImplementation(async (arg) => `result-${arg}`);
      const debouncedFn = AsyncHandler.debounce(mockFn, 100);
      
      // Act
      const promise1 = debouncedFn('first');
      const promise2 = debouncedFn('second');
      const promise3 = debouncedFn('third');
      
      // Advance timers
      jest.advanceTimersByTime(100);
      
      // Wait for promises to resolve
      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
      expect(result1).toBe('result-third');
      expect(result2).toBe('result-third');
      expect(result3).toBe('result-third');
    });
  });
  
  describe('throttle', () => {
    it('should execute the function immediately for the first call', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue('result');
      const throttledFn = AsyncHandler.throttle(mockFn, 100);
      
      // Act
      const promise = throttledFn();
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Wait for promise to resolve
      const result = await promise;
      expect(result).toBe('result');
    });
    
    it('should not execute the function again within the limit period', async () => {
      // Arrange
      const mockFn = jest.fn().mockResolvedValue('result');
      const throttledFn = AsyncHandler.throttle(mockFn, 100);
      
      // Act
      const promise1 = throttledFn();
      const promise2 = throttledFn();
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Wait for promises to resolve
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe('result');
      expect(result2).toBe('result');
    });
    
    it('should execute the function again after the limit period', async () => {
      // Arrange
      const mockFn = jest.fn()
        .mockResolvedValueOnce('result1')
        .mockResolvedValueOnce('result2');
      const throttledFn = AsyncHandler.throttle(mockFn, 100);
      
      // Act
      const promise1 = throttledFn();
      
      // Advance timers
      jest.advanceTimersByTime(101);
      
      const promise2 = throttledFn();
      
      // Assert
      expect(mockFn).toHaveBeenCalledTimes(2);
      
      // Wait for promises to resolve
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
    });
  });
  
  describe('withTimeout', () => {
    it('should return result if function completes within timeout', async () => {
      // Arrange
      const mockFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      };
      const withTimeoutFn = AsyncHandler.withTimeout(mockFn, 100);
      
      // Act
      const [result, error] = await withTimeoutFn();
      
      // Advance timers
      jest.advanceTimersByTime(50);
      
      // Assert
      expect(result).toBe('result');
      expect(error).toBeNull();
    });
    
    it('should return timeout error if function takes too long', async () => {
      // Arrange
      const mockFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'result';
      };
      const withTimeoutFn = AsyncHandler.withTimeout(mockFn, 100);
      
      // Act
      const [result, error] = await withTimeoutFn();
      
      // Advance timers
      jest.advanceTimersByTime(100);
      
      // Assert
      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('timed out');
    });
    
    it('should return function error if function fails', async () => {
      // Arrange
      const errorMessage = 'Test error';
      const mockFn = async () => {
        throw new Error(errorMessage);
      };
      const withTimeoutFn = AsyncHandler.withTimeout(mockFn, 100);
      
      // Act
      const [result, error] = await withTimeoutFn();
      
      // Assert
      expect(result).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe(errorMessage);
    });
  });
});
