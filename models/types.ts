/**
 * Represents a step in a plan
 */
export interface PlanStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dependencies?: string[];
  estimatedDuration?: number;
  startedAt?: Date;
  completedAt?: Date;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

/**
 * Represents a plan with steps
 */
export interface Plan {
  id: string;
  title: string;
  description: string;
  steps: PlanStep[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'paused';
  owner?: string;
  collaborators?: string[];
  deadline?: Date;
  progress?: number;
  tags?: string[];
}

/**
 * Represents an agent configuration
 */
export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  systemPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents an agent session
 */
export interface AgentSession {
  id: string;
  agentId: string;
  planId?: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  context: Record<string, any>;
  metrics?: AgentMetrics;
}

/**
 * Represents agent performance metrics
 */
export interface AgentMetrics {
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  steps: number;
  apiCalls: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * Represents a handoff between agents
 */
export interface Handoff {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  planId?: string;
  context: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: Record<string, any>;
  error?: string;
}

/**
 * Represents a computer tool operation
 */
export interface ComputerToolOperation {
  id: string;
  workspaceId: string;
  agentId: string;
  operation: 'execute' | 'read' | 'write' | 'list';
  command?: string;
  filePath?: string;
  content?: string;
  result?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  duration: number;
}

/**
 * Represents a workspace for agent operations
 */
export interface Workspace {
  id: string;
  agentId: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
  files: string[];
}

/**
 * Represents a user task input
 */
export interface TaskInput {
  id: string;
  content: string;
  userId?: string;
  createdAt: Date;
  priority?: 'low' | 'medium' | 'high';
  deadline?: Date;
  attachments?: string[];
  metadata?: Record<string, any>;
}

/**
 * Represents a task result
 */
export interface TaskResult {
  id: string;
  taskId: string;
  planId: string;
  agentId: string;
  status: 'success' | 'partial' | 'failed';
  content: string;
  createdAt: Date;
  completedAt: Date;
  duration: number;
  attachments?: string[];
  metadata?: Record<string, any>;
}

/**
 * Represents a WebSocket event
 */
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

/**
 * Represents application configuration
 */
export interface AppConfig {
  server: {
    port: number;
    host: string;
    environment: 'development' | 'production' | 'test';
  };
  database: {
    type: 'sqlite' | 'postgres' | 'mysql';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database: string;
    synchronize: boolean;
  };
  openai: {
    apiKey: string;
    organization?: string;
    defaultModel: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    file?: string;
  };
  storage: {
    type: 'local' | 's3';
    path?: string;
    bucket?: string;
    region?: string;
  };
  security: {
    jwtSecret?: string;
    cookieSecret?: string;
    corsOrigins: string[];
  };
}
