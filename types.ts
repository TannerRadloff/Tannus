import { interfaces } from 'inversify';

// Define symbol identifiers for dependency injection
export const TYPES = {
  // Core services
  Logger: Symbol.for('Logger'),
  ConfigService: Symbol.for('ConfigService'),
  DatabaseService: Symbol.for('DatabaseService'),
  
  // Managers
  PlanManager: Symbol.for('PlanManager'),
  AgentManager: Symbol.for('AgentManager'),
  HandoffManager: Symbol.for('HandoffManager'),
  ComputerToolManager: Symbol.for('ComputerToolManager'),
  WebSocketManager: Symbol.for('WebSocketManager'),
  
  // Controllers
  PlanningController: Symbol.for('PlanningController'),
  TrackingController: Symbol.for('TrackingController'),
  UpdaterController: Symbol.for('UpdaterController'),
  HandoffController: Symbol.for('HandoffController'),
  ComputerController: Symbol.for('ComputerController'),
  WebSocketController: Symbol.for('WebSocketController'),
  IndefiniteController: Symbol.for('IndefiniteController'),
  InputController: Symbol.for('InputController'),
  
  // Utilities
  MarkdownTracker: Symbol.for('MarkdownTracker'),
  PlanUpdater: Symbol.for('PlanUpdater'),
  IndefiniteRunner: Symbol.for('IndefiniteRunner'),
  PerformanceOptimizer: Symbol.for('PerformanceOptimizer'),
  
  // Factories
  AgentFactory: Symbol.for('AgentFactory'),
  PlanFactory: Symbol.for('PlanFactory'),
  
  // Models
  PlanningAgent: Symbol.for('PlanningAgent'),
  PlanningSystem: Symbol.for('PlanningSystem')
};

// Factory interfaces
export interface Factory<T> {
  create(...args: any[]): T;
}

export type AsyncFactory<T> = Factory<Promise<T>>;
