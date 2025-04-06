import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { ILogger, IConfigService } from '../interfaces';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration service that manages application settings
 * Implements the IConfigService interface
 */
@injectable()
export class ConfigService implements IConfigService {
  private config: Record<string, string> = {};
  private configPath: string;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger
  ) {
    this.configPath = process.env.CONFIG_PATH || path.join(process.cwd(), '.env');
    this.load();
  }

  /**
   * Loads configuration from environment variables and .env file
   */
  load(): void {
    try {
      // Load from .env file if it exists
      if (fs.existsSync(this.configPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(this.configPath));
        for (const key in envConfig) {
          this.config[key] = envConfig[key];
        }
        this.logger.info(`Loaded configuration from ${this.configPath}`);
      }

      // Override with environment variables
      for (const key in process.env) {
        this.config[key] = process.env[key] as string;
      }
    } catch (error) {
      this.logger.error(`Error loading configuration: ${error}`);
    }
  }

  /**
   * Gets a configuration value by key
   * 
   * @param key - The configuration key
   * @returns The configuration value or undefined if not found
   */
  get(key: string): string | undefined {
    return this.config[key];
  }

  /**
   * Gets a configuration value as a number
   * 
   * @param key - The configuration key
   * @returns The configuration value as a number or undefined if not found or not a number
   */
  getNumber(key: string): number | undefined {
    const value = this.get(key);
    if (value === undefined) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Gets a configuration value as a boolean
   * 
   * @param key - The configuration key
   * @returns The configuration value as a boolean or undefined if not found
   */
  getBoolean(key: string): boolean | undefined {
    const value = this.get(key);
    if (value === undefined) {
      return undefined;
    }
    return value.toLowerCase() === 'true';
  }

  /**
   * Gets all configuration values
   * 
   * @returns All configuration values
   */
  getAll(): Record<string, string> {
    return { ...this.config };
  }

  /**
   * Sets a configuration value
   * 
   * @param key - The configuration key
   * @param value - The configuration value
   */
  set(key: string, value: string): void {
    this.config[key] = value;
    this.logger.debug(`Set configuration ${key}=${value}`);
  }
}
