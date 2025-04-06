export interface ILogger {
  debug(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, ...meta: any[]): void;
}

export interface IConfigService {
  get(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  getAll(): Record<string, string>;
  set(key: string, value: string): void;
  load(): void;
}

export interface IPlanManager {
  createPlan(title: string, description: string, steps?: any[]): Promise<any>;
  getPlan(planId: string): Promise<any | null>;
  updatePlan(planId: string, updates: Partial<any>): Promise<any | null>;
  addStep(planId: string, step: any): Promise<any | null>;
  updateStep(planId: string, stepIndex: number, updates: Partial<any>): Promise<any | null>;
  completeStep(planId: string, stepIndex: number): Promise<any | null>;
  convertPlanToMarkdown(plan: any): string;
  parsePlanFromMarkdown(markdown: string, planId?: string): any;
  listPlans(): Promise<any[]>;
  deletePlan(planId: string): Promise<boolean>;
}

export interface IAgentManager {
  createAgent(config: any): Promise<any>;
  getAgent(agentId: string): Promise<any | null>;
  runAgent(agentId: string, input: any): Promise<any>;
  stopAgent(agentId: string): Promise<boolean>;
  pauseAgent(agentId: string): Promise<boolean>;
  resumeAgent(agentId: string): Promise<boolean>;
  listAgents(): Promise<any[]>;
  deleteAgent(agentId: string): Promise<boolean>;
}

export interface IHandoffManager {
  createHandoff(fromAgentId: string, toAgentId: string, context: any): Promise<any>;
  getHandoff(handoffId: string): Promise<any | null>;
  completeHandoff(handoffId: string, result: any): Promise<any>;
  listHandoffs(agentId?: string): Promise<any[]>;
}

export interface IComputerToolManager {
  executeCommand(command: string, workspaceId: string): Promise<any>;
  readFile(filePath: string, workspaceId: string): Promise<string>;
  writeFile(filePath: string, content: string, workspaceId: string): Promise<boolean>;
  createWorkspace(agentId: string): Promise<string>;
  deleteWorkspace(workspaceId: string): Promise<boolean>;
  listFiles(workspaceId: string, directory?: string): Promise<string[]>;
}

export interface IWebSocketManager {
  init(app: any): void;
  emit(event: string, data: any): void;
  emitToRoom(room: string, event: string, data: any): void;
  onConnection(handler: (socket: any) => void): void;
  onDisconnection(handler: (socket: any) => void): void;
  onEvent(event: string, handler: (data: any, socket: any) => void): void;
}

export interface IMarkdownTracker {
  createMarkdownFile(filePath: string, content: string): Promise<boolean>;
  updateMarkdownFile(filePath: string, content: string): Promise<boolean>;
  checkOffItem(filePath: string, itemIndex: number): Promise<boolean>;
  addItem(filePath: string, item: string): Promise<boolean>;
  removeItem(filePath: string, itemIndex: number): Promise<boolean>;
  getMarkdownContent(filePath: string): Promise<string>;
}

export interface IPlanUpdater {
  updatePlan(planId: string, updates: any): Promise<any>;
  addStepToPlan(planId: string, step: any): Promise<any>;
  removeStepFromPlan(planId: string, stepIndex: number): Promise<any>;
  reorderSteps(planId: string, newOrder: number[]): Promise<any>;
  mergePlans(planIds: string[], newTitle?: string): Promise<any>;
}

export interface IIndefiniteRunner {
  startAgent(agentId: string, task: any): Promise<any>;
  stopAgent(agentId: string): Promise<boolean>;
  pauseAgent(agentId: string): Promise<boolean>;
  resumeAgent(agentId: string): Promise<boolean>;
  getStatus(agentId: string): Promise<any>;
  listRunningAgents(): Promise<any[]>;
}

export interface IPerformanceOptimizer {
  optimizeMemoryUsage(): Promise<void>;
  optimizeCpuUsage(): Promise<void>;
  cacheResults(key: string, data: any, ttl?: number): Promise<void>;
  getCachedResults(key: string): Promise<any | null>;
  invalidateCache(key?: string): Promise<void>;
  throttleRequests(key: string, maxRequests: number, timeWindow: number): Promise<boolean>;
}

export interface IPlanningAgent {
  createPlan(task: string): Promise<any>;
  updatePlan(planId: string, task: string): Promise<any>;
  analyzePlan(planId: string): Promise<any>;
  suggestNextSteps(planId: string): Promise<any[]>;
}

export interface IPlanningSystem {
  createPlan(task: string): Promise<any>;
  updatePlan(planId: string, updates: any): Promise<any>;
  executePlan(planId: string): Promise<any>;
  monitorPlan(planId: string): Promise<any>;
  analyzePlanProgress(planId: string): Promise<any>;
}
