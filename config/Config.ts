import { injectable } from 'inversify';
import 'reflect-metadata';
import { AppConfiguration } from './types';
import { ConfigManager } from './ConfigManager';
import { container } from '../container';
import { TYPES } from '../types';

/**
 * Singleton configuration instance for easy access throughout the application
 */
@injectable()
export class Config {
  private static instance: Config;
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = container.get<ConfigManager>(TYPES.ConfigService);
  }

  /**
   * Gets the singleton instance
   * 
   * @returns The singleton Config instance
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Gets a configuration value by key
   * 
   * @param key - The configuration key (dot notation supported)
   * @returns The configuration value or undefined if not found
   */
  public get(key: string): string | undefined {
    return this.configManager.get(key);
  }

  /**
   * Gets a configuration value as a number
   * 
   * @param key - The configuration key (dot notation supported)
   * @returns The configuration value as a number or undefined if not found or not a number
   */
  public getNumber(key: string): number | undefined {
    return this.configManager.getNumber(key);
  }

  /**
   * Gets a configuration value as a boolean
   * 
   * @param key - The configuration key (dot notation supported)
   * @returns The configuration value as a boolean or undefined if not found
   */
  public getBoolean(key: string): boolean | undefined {
    return this.configManager.getBoolean(key);
  }

  /**
   * Gets the complete application configuration
   * 
   * @returns The complete application configuration
   */
  public getConfig(): AppConfiguration {
    return this.configManager.getConfig();
  }

  /**
   * Gets a specific section of the configuration
   * 
   * @param section - The configuration section name
   * @returns The configuration section or undefined if not found
   */
  public getSection<K extends keyof AppConfiguration>(section: K): AppConfiguration[K] | undefined {
    const config = this.configManager.getConfig();
    return config[section];
  }

  /**
   * Checks if the application is running in development mode
   * 
   * @returns True if in development mode, false otherwise
   */
  public isDevelopment(): boolean {
    return this.configManager.getConfig().server.environment === 'development';
  }

  /**
   * Checks if the application is running in production mode
   * 
   * @returns True if in production mode, false otherwise
   */
  public isProduction(): boolean {
    return this.configManager.getConfig().server.environment === 'production';
  }

  /**
   * Checks if the application is running in test mode
   * 
   * @returns True if in test mode, false otherwise
   */
  public isTest(): boolean {
    return this.configManager.getConfig().server.environment === 'test';
  }
}

// Export a singleton instance for easy access
export const config = Config.getInstance();
