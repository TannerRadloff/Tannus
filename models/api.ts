/**
 * Type definitions for controller request and response objects
 */

import { Plan, PlanStep, AgentConfig, AgentSession, TaskInput, TaskResult } from './types';
import { ValidationError } from '../utils/Validator';

/**
 * Base request interface
 */
export interface BaseRequest {
  requestId?: string;
  timestamp?: Date;
}

/**
 * Base response interface
 */
export interface BaseResponse {
  status: 'success' | 'error';
  timestamp: string;
  requestId?: string;
}

/**
 * Success response interface
 */
export interface SuccessResponse<T> extends BaseResponse {
  status: 'success';
  data: T;
  message?: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse extends BaseResponse {
  status: 'error';
  error: {
    message: string;
    code: number;
    stack?: string;
    validationErrors?: ValidationError[];
  };
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Plan creation request
 */
export interface CreatePlanRequest extends BaseRequest {
  title: string;
  description: string;
  steps?: Omit<PlanStep, 'id'>[];
  owner?: string;
  deadline?: Date;
  tags?: string[];
}

/**
 * Plan update request
 */
export interface UpdatePlanRequest extends BaseRequest {
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'paused';
  owner?: string;
  collaborators?: string[];
  deadline?: Date;
  tags?: string[];
}

/**
 * Plan step creation request
 */
export interface CreatePlanStepRequest extends BaseRequest {
  planId: string;
  title: string;
  description: string;
  dependencies?: string[];
  estimatedDuration?: number;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

/**
 * Plan step update request
 */
export interface UpdatePlanStepRequest extends BaseRequest {
  planId: string;
  stepIndex: number;
  title?: string;
  description?: string;
  completed?: boolean;
  dependencies?: string[];
  estimatedDuration?: number;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

/**
 * Agent creation request
 */
export interface CreateAgentRequest extends BaseRequest {
  name: string;
  description?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  systemPrompt?: string;
}

/**
 * Agent run request
 */
export interface RunAgentRequest extends BaseRequest {
  agentId: string;
  input: string;
  planId?: string;
  context?: Record<string, any>;
}

/**
 * Handoff creation request
 */
export interface CreateHandoffRequest extends BaseRequest {
  fromAgentId: string;
  toAgentId: string;
  planId?: string;
  context: Record<string, any>;
}

/**
 * Task submission request
 */
export interface SubmitTaskRequest extends BaseRequest {
  content: string;
  userId?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: Date;
  attachments?: string[];
  metadata?: Record<string, any>;
}

/**
 * Indefinite agent start request
 */
export interface StartIndefiniteAgentRequest extends BaseRequest {
  agentId: string;
  task: string;
  planId?: string;
  sessionId?: string;
  checkpointInterval?: number;
  maxDuration?: number;
  notifyOnCompletion?: boolean;
}

/**
 * Computer tool execution request
 */
export interface ExecuteCommandRequest extends BaseRequest {
  workspaceId: string;
  command: string;
  timeout?: number;
}

/**
 * File operation request
 */
export interface FileOperationRequest extends BaseRequest {
  workspaceId: string;
  filePath: string;
  content?: string;
  encoding?: string;
}

/**
 * WebSocket event emission request
 */
export interface EmitWebSocketEventRequest extends BaseRequest {
  event: string;
  data: any;
  room?: string;
  sessionId?: string;
}

/**
 * Plan response
 */
export type PlanResponse = SuccessResponse<Plan>;

/**
 * Plans list response
 */
export type PlansListResponse = PaginatedResponse<Plan>;

/**
 * Agent response
 */
export type AgentResponse = SuccessResponse<AgentConfig>;

/**
 * Agent session response
 */
export type AgentSessionResponse = SuccessResponse<AgentSession>;

/**
 * Task response
 */
export type TaskResponse = SuccessResponse<TaskResult>;

/**
 * Workspace response
 */
export type WorkspaceResponse = SuccessResponse<{
  id: string;
  path: string;
  files: string[];
}>;

/**
 * Command execution response
 */
export type CommandExecutionResponse = SuccessResponse<{
  output: string;
  exitCode: number;
  duration: number;
}>;

/**
 * File content response
 */
export type FileContentResponse = SuccessResponse<{
  content: string;
  filePath: string;
  encoding: string;
}>;

/**
 * WebSocket status response
 */
export type WebSocketStatusResponse = SuccessResponse<{
  connected: boolean;
  clients: number;
  uptime: number;
}>;
