import { injectable } from 'inversify';
import 'reflect-metadata';
import { ILogger } from '../interfaces';

/**
 * Logger service that provides logging functionality
 * Implements the ILogger interface
 */
@injectable()
export class Logger implements ILogger {
  private readonly logLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private currentLogLevel: number;

  constructor() {
    // Set log level based on environment variable or default to 'info'
    const logLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    this.currentLogLevel = this.logLevels[logLevel as keyof typeof this.logLevels] || this.logLevels.info;
  }

  /**
   * Formats a log message with timestamp and metadata
   * 
   * @param level - The log level
   * @param message - The log message
   * @param meta - Additional metadata
   * @returns Formatted log message
   */
  private formatLogMessage(level: string, message: string, meta: any[]): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (meta.length > 0) {
      try {
        const metaString = meta.map(item => 
          typeof item === 'object' ? JSON.stringify(item) : String(item)
        ).join(' ');
        formattedMessage += ` - ${metaString}`;
      } catch (error) {
        formattedMessage += ` - [Error formatting metadata: ${error}]`;
      }
    }
    
    return formattedMessage;
  }

  /**
   * Logs a debug message
   * 
   * @param message - The log message
   * @param meta - Additional metadata
   */
  debug(message: string, ...meta: any[]): void {
    if (this.currentLogLevel <= this.logLevels.debug) {
      console.debug(this.formatLogMessage('debug', message, meta));
    }
  }

  /**
   * Logs an info message
   * 
   * @param message - The log message
   * @param meta - Additional metadata
   */
  info(message: string, ...meta: any[]): void {
    if (this.currentLogLevel <= this.logLevels.info) {
      console.info(this.formatLogMessage('info', message, meta));
    }
  }

  /**
   * Logs a warning message
   * 
   * @param message - The log message
   * @param meta - Additional metadata
   */
  warn(message: string, ...meta: any[]): void {
    if (this.currentLogLevel <= this.logLevels.warn) {
      console.warn(this.formatLogMessage('warn', message, meta));
    }
  }

  /**
   * Logs an error message
   * 
   * @param message - The log message
   * @param meta - Additional metadata
   */
  error(message: string, ...meta: any[]): void {
    if (this.currentLogLevel <= this.logLevels.error) {
      console.error(this.formatLogMessage('error', message, meta));
    }
  }
}
