import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';
import { 
  ILogger, 
  IConfigService, 
  IPlanManager, 
  IAgentManager,
  IHandoffManager,
  IComputerToolManager,
  IWebSocketManager,
  IMarkdownTracker,
  IPlanUpdater,
  IIndefiniteRunner,
  IPerformanceOptimizer,
  IPlanningAgent,
  IPlanningSystem
} from './interfaces';
import { Logger } from './services/Logger';
import { ConfigService } from './services/ConfigService';
import { PlanManager } from './utils/PlanManager';

// Create and configure the dependency injection container
const container = new Container();

// Bind core services
container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();
container.bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();

// Bind managers
container.bind<IPlanManager>(TYPES.PlanManager).to(PlanManager).inSingletonScope();

// Export the container
export { container };
