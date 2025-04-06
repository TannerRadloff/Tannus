/**
 * Type definitions for configuration options
 */

/**
 * Server configuration options
 */
export interface ServerConfig {
  /** Port to run the server on */
  port: number;
  /** Host to bind to */
  host: string;
  /** Environment mode */
  environment: 'development' | 'production' | 'test';
  /** Enable CORS */
  cors: boolean;
  /** CORS origins */
  corsOrigins: string[];
  /** Request body size limit */
  bodyLimit: string;
  /** Enable compression */
  compression: boolean;
  /** Enable helmet security */
  helmet: boolean;
  /** Session secret */
  sessionSecret: string;
  /** Session expiry in milliseconds */
  sessionExpiry: number;
}

/**
 * Database configuration options
 */
export interface DatabaseConfig {
  /** Database type */
  type: 'sqlite' | 'postgres' | 'mysql';
  /** Database host */
  host?: string;
  /** Database port */
  port?: number;
  /** Database username */
  username?: string;
  /** Database password */
  password?: string;
  /** Database name */
  database: string;
  /** Enable synchronization */
  synchronize: boolean;
  /** Enable logging */
  logging: boolean;
  /** Connection pool size */
  poolSize?: number;
  /** SQLite file path */
  sqlitePath?: string;
}

/**
 * OpenAI configuration options
 */
export interface OpenAIConfig {
  /** OpenAI API key */
  apiKey: string;
  /** OpenAI organization ID */
  organization?: string;
  /** Default model to use */
  defaultModel: string;
  /** Default temperature */
  defaultTemperature: number;
  /** Default max tokens */
  defaultMaxTokens: number;
  /** API request timeout in milliseconds */
  timeout: number;
  /** Enable API key validation on startup */
  validateApiKey: boolean;
}

/**
 * Logging configuration options
 */
export interface LoggingConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log format */
  format: 'json' | 'text';
  /** Log file path */
  file?: string;
  /** Enable console logging */
  console: boolean;
  /** Enable request logging */
  requests: boolean;
  /** Enable colorized output */
  colors: boolean;
  /** Log rotation options */
  rotation?: {
    /** Max file size in bytes */
    maxSize: number;
    /** Max number of files */
    maxFiles: number;
    /** Compress rotated logs */
    compress: boolean;
  };
}

/**
 * Storage configuration options
 */
export interface StorageConfig {
  /** Storage type */
  type: 'local' | 's3';
  /** Local storage path */
  path?: string;
  /** S3 bucket name */
  bucket?: string;
  /** S3 region */
  region?: string;
  /** S3 access key */
  accessKey?: string;
  /** S3 secret key */
  secretKey?: string;
  /** Enable public access */
  publicAccess: boolean;
  /** Max file size in bytes */
  maxFileSize: number;
  /** Allowed file types */
  allowedTypes: string[];
}

/**
 * Agent configuration options
 */
export interface AgentConfig {
  /** Default system prompt */
  defaultSystemPrompt: string;
  /** Enable plan creation */
  enablePlanCreation: boolean;
  /** Enable indefinite running */
  enableIndefiniteRunning: boolean;
  /** Default checkpoint interval in milliseconds */
  defaultCheckpointInterval: number;
  /** Max agent runtime in milliseconds */
  maxRuntime: number;
  /** Enable agent memory */
  enableMemory: boolean;
  /** Max memory size in tokens */
  maxMemoryTokens: number;
  /** Enable agent tools */
  enableTools: boolean;
  /** Available tools */
  availableTools: string[];
  /** Enable agent handoff */
  enableHandoff: boolean;
}

/**
 * WebSocket configuration options
 */
export interface WebSocketConfig {
  /** Enable WebSockets */
  enabled: boolean;
  /** Path for WebSocket connections */
  path: string;
  /** Enable CORS for WebSockets */
  cors: boolean;
  /** CORS origins for WebSockets */
  corsOrigins: string[];
  /** Ping interval in milliseconds */
  pingInterval: number;
  /** Ping timeout in milliseconds */
  pingTimeout: number;
  /** Max event size in bytes */
  maxEventSize: number;
}

/**
 * Security configuration options
 */
export interface SecurityConfig {
  /** JWT secret */
  jwtSecret: string;
  /** JWT expiry in seconds */
  jwtExpiry: number;
  /** Enable rate limiting */
  rateLimit: boolean;
  /** Rate limit window in milliseconds */
  rateLimitWindow: number;
  /** Max requests per window */
  rateLimitMax: number;
  /** Enable CSRF protection */
  csrf: boolean;
  /** Enable XSS protection */
  xss: boolean;
  /** Content Security Policy */
  contentSecurityPolicy: boolean;
  /** Trusted proxies */
  trustedProxies: string[];
}

/**
 * Complete application configuration
 */
export interface AppConfiguration {
  /** Server configuration */
  server: ServerConfig;
  /** Database configuration */
  database: DatabaseConfig;
  /** OpenAI configuration */
  openai: OpenAIConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Storage configuration */
  storage: StorageConfig;
  /** Agent configuration */
  agent: AgentConfig;
  /** WebSocket configuration */
  websocket: WebSocketConfig;
  /** Security configuration */
  security: SecurityConfig;
}

/**
 * Default configuration values
 */
export const defaultConfig: AppConfiguration = {
  server: {
    port: 5000,
    host: '0.0.0.0',
    environment: 'development',
    cors: true,
    corsOrigins: ['http://localhost:3000'],
    bodyLimit: '10mb',
    compression: true,
    helmet: true,
    sessionSecret: 'change-me-in-production',
    sessionExpiry: 86400000 // 24 hours
  },
  database: {
    type: 'sqlite',
    database: 'ai_agents.db',
    synchronize: true,
    logging: false,
    poolSize: 10,
    sqlitePath: './data/database'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: 'gpt-4o',
    defaultTemperature: 0.7,
    defaultMaxTokens: 2000,
    timeout: 60000,
    validateApiKey: true
  },
  logging: {
    level: 'info',
    format: 'text',
    console: true,
    requests: true,
    colors: true,
    rotation: {
      maxSize: 10485760, // 10MB
      maxFiles: 5,
      compress: true
    }
  },
  storage: {
    type: 'local',
    path: './data/storage',
    publicAccess: false,
    maxFileSize: 104857600, // 100MB
    allowedTypes: ['*']
  },
  agent: {
    defaultSystemPrompt: 'You are a helpful AI assistant.',
    enablePlanCreation: true,
    enableIndefiniteRunning: true,
    defaultCheckpointInterval: 300000, // 5 minutes
    maxRuntime: 3600000, // 1 hour
    enableMemory: true,
    maxMemoryTokens: 10000,
    enableTools: true,
    availableTools: ['web-search', 'file-system', 'code-execution'],
    enableHandoff: true
  },
  websocket: {
    enabled: true,
    path: '/ws',
    cors: true,
    corsOrigins: ['http://localhost:3000'],
    pingInterval: 25000,
    pingTimeout: 60000,
    maxEventSize: 1048576 // 1MB
  },
  security: {
    jwtSecret: 'change-me-in-production',
    jwtExpiry: 86400, // 24 hours
    rateLimit: true,
    rateLimitWindow: 60000, // 1 minute
    rateLimitMax: 100,
    csrf: true,
    xss: true,
    contentSecurityPolicy: true,
    trustedProxies: ['127.0.0.1']
  }
};
