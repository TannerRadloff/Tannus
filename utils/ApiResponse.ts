import { injectable } from 'inversify';
import 'reflect-metadata';
import { AsyncHandler } from './AsyncHandler';

/**
 * Type definition for an async operation result
 */
export type AsyncResult<T> = [T | null, Error | null];

/**
 * Utility class for standardizing API responses throughout the application
 */
@injectable()
export class ApiResponse {
  /**
   * Creates a success response
   * 
   * @param data - The data to include in the response
   * @param message - Optional success message
   * @returns Standardized success response object
   */
  static success<T>(data: T, message: string = 'Operation successful'): {
    status: 'success';
    data: T;
    message: string;
    timestamp: string;
  } {
    return {
      status: 'success',
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates an error response
   * 
   * @param error - The error object or message
   * @param code - Optional error code
   * @returns Standardized error response object
   */
  static error(
    error: Error | string,
    code: number = 500
  ): {
    status: 'error';
    error: {
      message: string;
      code: number;
      stack?: string;
    };
    timestamp: string;
  } {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return {
      status: 'error',
      error: {
        message: errorMessage,
        code,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates a response from an AsyncResult
   * 
   * @param result - The AsyncResult from AsyncHandler
   * @param successMessage - Optional success message
   * @param errorCode - Optional error code
   * @returns Standardized response object
   */
  static fromAsyncResult<T>(
    result: AsyncResult<T>,
    successMessage: string = 'Operation successful',
    errorCode: number = 500
  ): {
    status: 'success' | 'error';
    data?: T;
    error?: {
      message: string;
      code: number;
      stack?: string;
    };
    message?: string;
    timestamp: string;
  } {
    const [data, error] = result;
    
    if (error) {
      return ApiResponse.error(error, errorCode);
    }
    
    return ApiResponse.success(data as T, successMessage);
  }

  /**
   * Creates a paginated response
   * 
   * @param data - The data array to include in the response
   * @param page - Current page number
   * @param pageSize - Page size
   * @param total - Total number of items
   * @param message - Optional success message
   * @returns Standardized paginated response object
   */
  static paginated<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number,
    message: string = 'Data retrieved successfully'
  ): {
    status: 'success';
    data: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    message: string;
    timestamp: string;
  } {
    return {
      status: 'success',
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      },
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates a streaming response
   * 
   * @param stream - The stream to send
   * @param contentType - Content type of the stream
   * @returns Object with stream and headers
   */
  static stream(
    stream: NodeJS.ReadableStream,
    contentType: string = 'application/octet-stream'
  ): {
    stream: NodeJS.ReadableStream;
    headers: {
      'Content-Type': string;
      'Transfer-Encoding': string;
    };
  } {
    return {
      stream,
      headers: {
        'Content-Type': contentType,
        'Transfer-Encoding': 'chunked'
      }
    };
  }
}
