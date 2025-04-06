import { injectable } from 'inversify';
import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { ApiResponseHandler, HttpStatus } from './ApiResponseHandler';

/**
 * Middleware for standardizing API responses
 */
@injectable()
export class ApiMiddleware {
  /**
   * Middleware to add standard response methods to Express response object
   */
  static enhanceResponse(req: Request, res: Response, next: NextFunction): void {
    // Add request ID if not present
    req.id = req.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Enhance response object with standardized methods
    res.success = function<T>(data: T, statusCode: number = HttpStatus.OK) {
      return ApiResponseHandler.success(res, data, statusCode, { requestId: req.id });
    };
    
    res.error = function(message: string, statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR, details?: any, error?: Error) {
      return ApiResponseHandler.error(res, message, statusCode, details, error);
    };
    
    res.validationError = function(errors: any[]) {
      return ApiResponseHandler.validationError(res, errors);
    };
    
    res.notFound = function(resource: string, id?: string | number) {
      return ApiResponseHandler.notFound(res, resource, id);
    };
    
    res.paginated = function<T>(data: T[], page: number, pageSize: number, total: number) {
      return ApiResponseHandler.paginated(res, data, page, pageSize, total, { requestId: req.id });
    };
    
    res.created = function<T>(data: T) {
      return ApiResponseHandler.created(res, data, { requestId: req.id });
    };
    
    res.accepted = function<T>(data?: T) {
      return ApiResponseHandler.accepted(res, data, { requestId: req.id });
    };
    
    res.noContent = function() {
      return ApiResponseHandler.noContent(res);
    };
    
    next();
  }

  /**
   * Middleware to handle not found routes
   */
  static notFound(req: Request, res: Response): Response {
    return ApiResponseHandler.error(
      res,
      `Route not found: ${req.method} ${req.originalUrl}`,
      HttpStatus.NOT_FOUND
    );
  }

  /**
   * Middleware to handle errors
   */
  static errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response {
    return ApiResponseHandler.errorMiddleware(err, req, res, next);
  }

  /**
   * Middleware to handle CORS
   */
  static cors(req: Request, res: Response, next: NextFunction): void {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(HttpStatus.OK);
    } else {
      next();
    }
  }

  /**
   * Middleware to parse pagination parameters
   */
  static pagination(req: Request, res: Response, next: NextFunction): void {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    // Validate and sanitize
    req.pagination = {
      page: Math.max(1, page),
      pageSize: Math.min(Math.max(1, pageSize), 100), // Limit max page size to 100
      skip: (Math.max(1, page) - 1) * Math.min(Math.max(1, pageSize), 100)
    };
    
    next();
  }

  /**
   * Middleware to log API requests
   */
  static requestLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    // Log request
    console.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Request ID: ${req.id}`);
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms - Request ID: ${req.id}`);
    });
    
    next();
  }
}

// Extend Express Request and Response interfaces
declare global {
  namespace Express {
    interface Request {
      id?: string;
      pagination?: {
        page: number;
        pageSize: number;
        skip: number;
      };
    }
    
    interface Response {
      success<T>(data: T, statusCode?: number): Response;
      error(message: string, statusCode?: number, details?: any, error?: Error): Response;
      validationError(errors: any[]): Response;
      notFound(resource: string, id?: string | number): Response;
      paginated<T>(data: T[], page: number, pageSize: number, total: number): Response;
      created<T>(data: T): Response;
      accepted<T>(data?: T): Response;
      noContent(): Response;
    }
  }
}
