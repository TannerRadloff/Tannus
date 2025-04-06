import { injectable } from 'inversify';
import 'reflect-metadata';
import { Request, Response, Router } from 'express';
import { ApiMiddleware } from '../utils/ApiMiddleware';
import { HttpStatus } from '../utils/ApiResponseHandler';
import { container } from '../container';
import { TYPES } from '../types';
import { IConfigService } from '../interfaces';

/**
 * Base controller class that provides common functionality for all controllers
 */
@injectable()
export abstract class BaseController {
  protected router: Router;
  protected path: string;
  protected configService: IConfigService;

  constructor(path: string) {
    this.router = Router();
    this.path = path;
    this.configService = container.get<IConfigService>(TYPES.ConfigService);
    this.initializeRoutes();
  }

  /**
   * Initialize controller routes
   * Must be implemented by derived classes
   */
  protected abstract initializeRoutes(): void;

  /**
   * Get the router instance
   * 
   * @returns Express router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Get the controller path
   * 
   * @returns Controller path
   */
  public getPath(): string {
    return this.path;
  }

  /**
   * Wrap an async route handler with error handling
   * 
   * @param fn - Async route handler function
   * @returns Express middleware function
   */
  protected asyncHandler(
    fn: (req: Request, res: Response) => Promise<any>
  ): (req: Request, res: Response, next: Function) => void {
    return (req: Request, res: Response, next: Function) => {
      Promise.resolve(fn(req, res)).catch(next);
    };
  }

  /**
   * Create a health check route
   * 
   * @param path - Route path
   */
  protected addHealthCheck(path: string = '/health'): void {
    this.router.get(path, (req: Request, res: Response) => {
      res.success({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
      });
    });
  }

  /**
   * Add common middleware to the router
   */
  protected addCommonMiddleware(): void {
    this.router.use(ApiMiddleware.enhanceResponse);
    this.router.use(ApiMiddleware.pagination);
  }

  /**
   * Add CORS middleware to the router
   */
  protected addCorsMiddleware(): void {
    this.router.use(ApiMiddleware.cors);
  }

  /**
   * Add request logging middleware to the router
   */
  protected addRequestLogging(): void {
    this.router.use(ApiMiddleware.requestLogger);
  }

  /**
   * Create a method not allowed handler
   * 
   * @param allowedMethods - Array of allowed HTTP methods
   * @returns Express middleware function
   */
  protected methodNotAllowed(allowedMethods: string[]): (req: Request, res: Response) => Response {
    return (req: Request, res: Response) => {
      return res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
        status: 'error',
        error: {
          code: HttpStatus.METHOD_NOT_ALLOWED,
          message: `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    };
  }
}
