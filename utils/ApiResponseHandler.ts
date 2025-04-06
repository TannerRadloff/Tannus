import { injectable } from 'inversify';
import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/Validator';
import { config } from '../config/Config';

/**
 * Standard HTTP status codes used in API responses
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Standard API response structure
 */
export interface ApiResponseStructure<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: any;
    stack?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Utility class for standardizing API responses
 */
@injectable()
export class ApiResponseHandler {
  /**
   * Creates a success response
   * 
   * @param data - The data to include in the response
   * @param statusCode - HTTP status code
   * @param meta - Additional metadata
   * @returns Express response
   */
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = HttpStatus.OK,
    meta?: Omit<ApiResponseStructure['meta'], 'timestamp'>
  ): Response {
    const response: ApiResponseStructure<T> = {
      status: 'success',
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Creates an error response
   * 
   * @param res - Express response object
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param details - Additional error details
   * @param error - Original error object
   * @returns Express response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: any,
    error?: Error
  ): Response {
    const response: ApiResponseStructure = {
      status: 'error',
      error: {
        code: statusCode,
        message,
        details,
        // Include stack trace only in development mode
        stack: config.isDevelopment() && error?.stack ? error.stack : undefined
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Creates a validation error response
   * 
   * @param res - Express response object
   * @param errors - Validation errors
   * @returns Express response
   */
  static validationError(
    res: Response,
    errors: ValidationError[]
  ): Response {
    return ApiResponseHandler.error(
      res,
      'Validation failed',
      HttpStatus.UNPROCESSABLE_ENTITY,
      { errors }
    );
  }

  /**
   * Creates a not found error response
   * 
   * @param res - Express response object
   * @param resource - Resource type that was not found
   * @param id - ID of the resource that was not found
   * @returns Express response
   */
  static notFound(
    res: Response,
    resource: string,
    id?: string | number
  ): Response {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;

    return ApiResponseHandler.error(
      res,
      message,
      HttpStatus.NOT_FOUND
    );
  }

  /**
   * Creates a paginated response
   * 
   * @param res - Express response object
   * @param data - The data array to include in the response
   * @param page - Current page number
   * @param pageSize - Page size
   * @param total - Total number of items
   * @param meta - Additional metadata
   * @returns Express response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    pageSize: number,
    total: number,
    meta?: Omit<ApiResponseStructure['meta'], 'timestamp' | 'pagination'>
  ): Response {
    const totalPages = Math.ceil(total / pageSize);

    return ApiResponseHandler.success(
      res,
      data,
      HttpStatus.OK,
      {
        ...meta,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      }
    );
  }

  /**
   * Creates a no content response
   * 
   * @param res - Express response object
   * @returns Express response
   */
  static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).end();
  }

  /**
   * Creates a created response
   * 
   * @param res - Express response object
   * @param data - The created resource
   * @param meta - Additional metadata
   * @returns Express response
   */
  static created<T>(
    res: Response,
    data: T,
    meta?: Omit<ApiResponseStructure['meta'], 'timestamp'>
  ): Response {
    return ApiResponseHandler.success(res, data, HttpStatus.CREATED, meta);
  }

  /**
   * Creates an accepted response
   * 
   * @param res - Express response object
   * @param data - Optional data to include
   * @param meta - Additional metadata
   * @returns Express response
   */
  static accepted<T>(
    res: Response,
    data?: T,
    meta?: Omit<ApiResponseStructure['meta'], 'timestamp'>
  ): Response {
    return ApiResponseHandler.success(res, data, HttpStatus.ACCEPTED, meta);
  }

  /**
   * Error handler middleware for Express
   * 
   * @param err - Error object
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns Express response
   */
  static errorMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response {
    // Log the error
    console.error('Unhandled error:', err);

    // Determine status code based on error type
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      message = 'Validation failed';
    } else if (err.name === 'UnauthorizedError') {
      statusCode = HttpStatus.UNAUTHORIZED;
      message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
      statusCode = HttpStatus.FORBIDDEN;
      message = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
    }

    return ApiResponseHandler.error(
      res,
      message,
      statusCode,
      undefined,
      err
    );
  }
}
