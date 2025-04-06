import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { ILogger, IConfigService } from '../interfaces';
import { AppConfiguration, defaultConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { merge } from 'lodash';

/**
 * Centralized configuration manager for the application
 * Implements the IConfigService interface
 */
@injectable()
export class ConfigManager implements IConfigService {
  private config: AppConfiguration;
  private envConfig: Record<string, string> = {};
  private configFilePath: string;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger
  ) {
    // Initialize with default configuration
    this.config = JSON.parse(JSON.stringify(defaultConfig));
    
    // Set config file path
    this.configFilePath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config.json');
    
    // Load configuration
    this.load();
  }

  /**
   * Loads configuration from environment variables, .env file, and config.json
   */
  load(): void {
    try {
      // Load from .env file if it exists
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        for (const key in envConfig) {
          this.envConfig[key] = envConfig[key];
        }
        this.logger.info(`Loaded environment variables from ${envPath}`);
      }

      // Override with environment variables
      for (const key in process.env) {
        this.envConfig[key] = process.env[key] as string;
      }

      // Load from config.json if it exists
      if (fs.existsSync(this.configFilePath)) {
        const fileConfig = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
        // Deep merge with default config
        this.config = merge({}, this.config, fileConfig);
        this.logger.info(`Loaded configuration from ${this.configFilePath}`);
      } else {
        this.logger.warn(`Configuration file not found at ${this.configFilePath}, using default configuration`);
      }

      // Apply environment variable overrides
      this.applyEnvOverrides();

      // Validate configuration
      this.validateConfiguration();

      this.logger.info('Configuration loaded successfully');
    } catch (error) {
      this.logger.error(`Error loading configuration: ${error}`);
    }
  }

  /**
   * Applies environment variable overrides to the configuration
   * Uses a convention-based approach to map env vars to config properties
   */
  private applyEnvOverrides(): void {
    // Apply OpenAI API key from environment
    if (this.envConfig.OPENAI_API_KEY) {
      this.config.openai.apiKey = this.envConfig.OPENAI_API_KEY;
    }

    // Apply server port from environment
    if (this.envConfig.PORT) {
      this.config.server.port = parseInt(this.envConfig.PORT, 10);
    }

    // Apply server host from environment
    if (this.envConfig.HOST) {
      this.config.server.host = this.envConfig.HOST;
    }

    // Apply environment mode
    if (this.envConfig.NODE_ENV) {
      this.config.server.environment = this.envConfig.NODE_ENV as any;
    }

    // Apply log level from environment
    if (this.envConfig.LOG_LEVEL) {
      this.config.logging.level = this.envConfig.LOG_LEVEL as any;
    }

    // Apply database configuration
    if (this.envConfig.DATABASE_URL) {
      // Parse database URL and set appropriate config
      const dbUrl = new URL(this.envConfig.DATABASE_URL);
      
      if (dbUrl.protocol === 'postgres:') {
        this.config.database.type = 'postgres';
        this.config.database.host = dbUrl.hostname;
        this.config.database.port = parseInt(dbUrl.port, 10) || 5432;
        this.config.database.username = dbUrl.username;
        this.config.database.password = dbUrl.password;
        this.config.database.database = dbUrl.pathname.substring(1);
      } else if (dbUrl.protocol === 'mysql:') {
        this.config.database.type = 'mysql';
        this.config.database.host = dbUrl.hostname;
        this.config.database.port = parseInt(dbUrl.port, 10) || 3306;
        this.config.database.username = dbUrl.username;
        this.config.database.password = dbUrl.password;
        this.config.database.database = dbUrl.pathname.substring(1);
      }
    }

    // Apply JWT secret from environment
    if (this.envConfig.JWT_SECRET) {
      this.config.security.jwtSecret = this.envConfig.JWT_SECRET;
    }

    // Apply session secret from environment
    if (this.envConfig.SESSION_SECRET) {
      this.config.server.sessionSecret = this.envConfig.SESSION_SECRET;
    }
  }

  /**
   * Validates the configuration for required values and consistency
   */
  private validateConfiguration(): void {
    // Validate OpenAI API key
    if (!this.config.openai.apiKey) {
      this.logger.warn('OpenAI API key is not set. Some features may not work correctly.');
    }

    // Validate server port
    if (this.config.server.port <= 0 || this.config.server.port > 65535) {
      this.logger.warn(`Invalid server port: ${this.config.server.port}. Using default port 5000.`);
      this.config.server.port = 5000;
    }

    // Validate JWT and session secrets in production
    if (this.config.server.environment === 'production') {
      if (this.config.security.jwtSecret === defaultConfig.security.jwtSecret) {
        this.logger.warn('Using default JWT secret in production environment. This is insecure.');
      }
      
      if (this.config.server.sessionSecret === defaultConfig.server.sessionSecret) {
        this.logger.warn('Using default session secret in production environment. This is insecure.');
      }
    }

    // Validate database configuration
    if (this.config.database.type === 'sqlite') {
      if (!this.config.database.sqlitePath) {
        this.logger.warn('SQLite path is not set. Using default path.');
        this.config.database.sqlitePath = './data/database';
      }
      
      // Ensure directory exists
      const dbDir = path.dirname(this.config.database.sqlitePath);
      if (!fs.existsSync(dbDir)) {
        try {
          fs.mkdirSync(dbDir, { recursive: true });
          this.logger.info(`Created database directory at ${dbDir}`);
        } catch (error) {
          this.logger.error(`Failed to create database directory: ${error}`);
        }
      }
    } else {
      // Validate required fields for other database types
      if (!this.config.database.host) {
        this.logger.error(`Database host is required for ${this.config.database.type} database`);
      }
      
      if (!this.config.database.username) {
        this.logger.error(`Database username is required for ${this.config.database.type} database`);
      }
      
      if (!this.config.database.database) {
        this.logger.error(`Database name is required for ${this.config.database.type} database`);
      }
    }

    // Validate storage configuration
    if (this.config.storage.type === 'local') {
      if (!this.config.storage.path) {
        this.logger.warn('Local storage path is not set. Using default path.');
        this.config.storage.path = './data/storage';
      }
      
      // Ensure directory exists
      if (!fs.existsSync(this.config.storage.path)) {
        try {
          fs.mkdirSync(this.config.storage.path, { recursive: true });
          this.logger.info(`Created storage directory at ${this.config.storage.path}`);
        } catch (error) {
          this.logger.error(`Failed to create storage directory: ${error}`);
        }
      }
    } else if (this.config.storage.type === 's3') {
      // Validate required fields for S3 storage
      if (!this.config.storage.bucket) {
        this.logger.error('S3 bucket is required for S3 storage');
      }
      
      if (!this.config.storage.region) {
        this.logger.error('S3 region is required for S3 storage');
      }
      
      if (!this.config.storage.accessKey || !this.config.storage.secretKey) {
        this.logger.error('S3 access key and secret key are required for S3 storage');
      }
    }
  }

  /**
   * Gets a configuration value by key
   * 
   * @param key - The configuration key (dot notation supported)
   * @returns The configuration value or undefined if not found
   */
  get(key: string): string | undefined {
    // First check environment config
    if (this.envConfig[key]) {
      return this.envConfig[key];
    }
    
    // Then check application config
    const parts = key.split('.');
    let current: any = this.config;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Gets a configuration value as a number
   * 
   * @param key - The configuration key (dot notation supported)
   * @returns The configuration value as a number or undefined if not found or not a number
   */
  getNumber(key: string): number | undefined {
    const value = this.get(key);
    if (value === undefined) {
      // Check if we can get it from the config object
      const parts = key.split('.');
      let current: any = this.config;
      
      for (const part of parts) {
        if (current[part] === undefined) {
          return undefined;
        }
        current = current[part];
      }
      
      return typeof current === 'number' ? current : undefined;
    }
    
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Gets a configuration value as a boolean
   * 
   * @param key - The configuration key (dot notation supported)
   * @returns The configuration value as a boolean or undefined if not found
   */
  getBoolean(key: string): boolean | undefined {
    const value = this.get(key);
    if (value === undefined) {
      // Check if we can get it from the config object
      const parts = key.split('.');
      let current: any = this.config;
      
      for (const part of parts) {
        if (current[part] === undefined) {
          return undefined;
        }
        current = current[part];
      }
      
      return typeof current === 'boolean' ? current : undefined;
    }
    
    return value.toLowerCase() === 'true';
  }

  /**
   * Gets all configuration values
   * 
   * @returns All configuration values
   */
  getAll(): Record<string, string> {
    // Convert config to flat key-value pairs
    const result: Record<string, string> = {};
    
    const flatten = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, newKey);
        } else {
          result[newKey] = String(value);
        }
      }
    };
    
    flatten(this.config);
    
    // Add environment config
    for (const key in this.envConfig) {
      result[key] = this.envConfig[key];
    }
    
    return result;
  }

  /**
   * Sets a configuration value
   * 
   * @param key - The configuration key (dot notation supported)
   * @param value - The configuration value
   */
  set(key: string, value: string): void {
    // Set in environment config
    this.envConfig[key] = value;
    
    // Also try to set in application config
    const parts = key.split('.');
    let current: any = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
    
    this.logger.debug(`Set configuration ${key}=${value}`);
  }

  /**
   * Saves the current configuration to the config file
   * 
   * @returns True if successful, false otherwise
   */
  save(): boolean {
    try {
      const configDir = path.dirname(this.configFilePath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2));
      this.logger.info(`Saved configuration to ${this.configFilePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Error saving configuration: ${error}`);
      return false;
    }
  }

  /**
   * Gets the complete application configuration
   * 
   * @returns The complete application configuration
   */
  getConfig(): AppConfiguration {
    return this.config;
  }

  /**
   * Updates the application configuration
   * 
   * @param newConfig - The new configuration (partial)
   * @param save - Whether to save the configuration to file
   * @returns True if successful, false otherwise
   */
  updateConfig(newConfig: Partial<AppConfiguration>, save: boolean = true): boolean {
    try {
      // Deep merge with current config
      this.config = merge({}, this.config, newConfig);
      
      // Validate the updated configuration
      this.validateConfiguration();
      
      if (save) {
        return this.save();
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error updating configuration: ${error}`);
      return false;
    }
  }

  /**
   * Resets the configuration to default values
   * 
   * @param save - Whether to save the configuration to file
   * @returns True if successful, false otherwise
   */
  resetToDefaults(save: boolean = true): boolean {
    try {
      this.config = JSON.parse(JSON.stringify(defaultConfig));
      this.applyEnvOverrides();
      this.validateConfiguration();
      
      if (save) {
        return this.save();
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error resetting configuration: ${error}`);
      return false;
    }
  }
}
