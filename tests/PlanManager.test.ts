import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { container } from '../container';
import { TYPES } from '../types';
import { IConfigService, ILogger, IPlanManager } from '../interfaces';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../services/Logger';
import { PlanManager } from '../utils/PlanManager';
import { Plan, PlanStep } from '../models/types';

// Mock dependencies
jest.mock('../services/Logger');

describe('PlanManager', () => {
  let planManager: IPlanManager;
  let configService: IConfigService;
  let logger: ILogger;
  
  beforeEach(() => {
    // Reset container bindings
    container.unbindAll();
    
    // Setup mocks
    logger = new Logger();
    configService = new ConfigManager(logger);
    
    // Bind mocks to container
    container.bind<ILogger>(TYPES.Logger).toConstantValue(logger);
    container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(configService);
    container.bind<IPlanManager>(TYPES.PlanManager).to(PlanManager);
    
    // Get instance to test
    planManager = container.get<IPlanManager>(TYPES.PlanManager);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createPlan', () => {
    it('should create a new plan with the provided title and description', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      
      // Act
      const plan = await planManager.createPlan(title, description);
      
      // Assert
      expect(plan).toBeDefined();
      expect(plan.title).toBe(title);
      expect(plan.description).toBe(description);
      expect(plan.steps).toEqual([]);
      expect(plan.status).toBe('active');
      expect(plan.id).toBeDefined();
      expect(plan.createdAt).toBeInstanceOf(Date);
      expect(plan.updatedAt).toBeInstanceOf(Date);
    });
    
    it('should create a plan with initial steps if provided', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      const steps: Omit<PlanStep, 'id'>[] = [
        {
          title: 'Step 1',
          description: 'This is step 1',
          completed: false
        },
        {
          title: 'Step 2',
          description: 'This is step 2',
          completed: false
        }
      ];
      
      // Act
      const plan = await planManager.createPlan(title, description, steps as PlanStep[]);
      
      // Assert
      expect(plan).toBeDefined();
      expect(plan.steps.length).toBe(2);
      expect(plan.steps[0].title).toBe('Step 1');
      expect(plan.steps[1].title).toBe('Step 2');
      expect(plan.steps[0].completed).toBe(false);
      expect(plan.steps[1].completed).toBe(false);
    });
  });
  
  describe('getPlan', () => {
    it('should return null if plan does not exist', async () => {
      // Act
      const plan = await planManager.getPlan('non-existent-id');
      
      // Assert
      expect(plan).toBeNull();
    });
    
    it('should return the plan if it exists', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      const createdPlan = await planManager.createPlan(title, description);
      
      // Act
      const retrievedPlan = await planManager.getPlan(createdPlan.id);
      
      // Assert
      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan?.id).toBe(createdPlan.id);
      expect(retrievedPlan?.title).toBe(title);
      expect(retrievedPlan?.description).toBe(description);
    });
  });
  
  describe('updatePlan', () => {
    it('should return null if plan does not exist', async () => {
      // Act
      const updatedPlan = await planManager.updatePlan('non-existent-id', { title: 'Updated Title' });
      
      // Assert
      expect(updatedPlan).toBeNull();
    });
    
    it('should update the plan if it exists', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      const createdPlan = await planManager.createPlan(title, description);
      
      // Act
      const updatedTitle = 'Updated Title';
      const updatedDescription = 'Updated Description';
      const updatedPlan = await planManager.updatePlan(createdPlan.id, {
        title: updatedTitle,
        description: updatedDescription
      });
      
      // Assert
      expect(updatedPlan).toBeDefined();
      expect(updatedPlan?.title).toBe(updatedTitle);
      expect(updatedPlan?.description).toBe(updatedDescription);
      expect(updatedPlan?.id).toBe(createdPlan.id);
    });
  });
  
  describe('addStep', () => {
    it('should return null if plan does not exist', async () => {
      // Arrange
      const step: PlanStep = {
        id: 'step-id',
        title: 'New Step',
        description: 'This is a new step',
        completed: false
      };
      
      // Act
      const updatedPlan = await planManager.addStep('non-existent-id', step);
      
      // Assert
      expect(updatedPlan).toBeNull();
    });
    
    it('should add a step to the plan if it exists', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      const createdPlan = await planManager.createPlan(title, description);
      
      const step: PlanStep = {
        id: 'step-id',
        title: 'New Step',
        description: 'This is a new step',
        completed: false
      };
      
      // Act
      const updatedPlan = await planManager.addStep(createdPlan.id, step);
      
      // Assert
      expect(updatedPlan).toBeDefined();
      expect(updatedPlan?.steps.length).toBe(1);
      expect(updatedPlan?.steps[0].title).toBe('New Step');
      expect(updatedPlan?.steps[0].description).toBe('This is a new step');
      expect(updatedPlan?.steps[0].completed).toBe(false);
    });
  });
  
  describe('updateStep', () => {
    it('should return null if plan does not exist', async () => {
      // Act
      const updatedPlan = await planManager.updateStep('non-existent-id', 0, { title: 'Updated Step' });
      
      // Assert
      expect(updatedPlan).toBeNull();
    });
    
    it('should return null if step index is out of bounds', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      const createdPlan = await planManager.createPlan(title, description);
      
      // Act
      const updatedPlan = await planManager.updateStep(createdPlan.id, 0, { title: 'Updated Step' });
      
      // Assert
      expect(updatedPlan).toBeNull();
    });
    
    it('should update the step if plan and step exist', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      const createdPlan = await planManager.createPlan(title, description);
      
      const step: PlanStep = {
        id: 'step-id',
        title: 'New Step',
        description: 'This is a new step',
        completed: false
      };
      
      const planWithStep = await planManager.addStep(createdPlan.id, step);
      
      // Act
      const updatedTitle = 'Updated Step';
      const updatedDescription = 'Updated step description';
      const updatedPlan = await planManager.updateStep(createdPlan.id, 0, {
        title: updatedTitle,
        description: updatedDescription
      });
      
      // Assert
      expect(updatedPlan).toBeDefined();
      expect(updatedPlan?.steps.length).toBe(1);
      expect(updatedPlan?.steps[0].title).toBe(updatedTitle);
      expect(updatedPlan?.steps[0].description).toBe(updatedDescription);
      expect(updatedPlan?.steps[0].completed).toBe(false);
    });
  });
  
  describe('completeStep', () => {
    it('should mark a step as completed', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      const createdPlan = await planManager.createPlan(title, description);
      
      const step: PlanStep = {
        id: 'step-id',
        title: 'New Step',
        description: 'This is a new step',
        completed: false
      };
      
      const planWithStep = await planManager.addStep(createdPlan.id, step);
      
      // Act
      const updatedPlan = await planManager.completeStep(createdPlan.id, 0);
      
      // Assert
      expect(updatedPlan).toBeDefined();
      expect(updatedPlan?.steps.length).toBe(1);
      expect(updatedPlan?.steps[0].completed).toBe(true);
    });
  });
  
  describe('convertPlanToMarkdown', () => {
    it('should convert a plan to markdown format', async () => {
      // Arrange
      const title = 'Test Plan';
      const description = 'This is a test plan';
      const createdPlan = await planManager.createPlan(title, description);
      
      const step1: PlanStep = {
        id: 'step-id-1',
        title: 'Step 1',
        description: 'This is step 1',
        completed: false
      };
      
      const step2: PlanStep = {
        id: 'step-id-2',
        title: 'Step 2',
        description: 'This is step 2',
        completed: true
      };
      
      await planManager.addStep(createdPlan.id, step1);
      const planWithSteps = await planManager.addStep(createdPlan.id, step2);
      
      // Act
      const markdown = planManager.convertPlanToMarkdown(planWithSteps as Plan);
      
      // Assert
      expect(markdown).toContain('# Test Plan');
      expect(markdown).toContain('This is a test plan');
      expect(markdown).toContain('[ ] Step 1');
      expect(markdown).toContain('[x] Step 2');
    });
  });
  
  describe('parsePlanFromMarkdown', () => {
    it('should parse a plan from markdown format', async () => {
      // Arrange
      const markdown = `# Test Plan

This is a test plan

Created: 2023-01-01T00:00:00.000Z
Updated: 2023-01-01T00:00:00.000Z

Status: active

## Steps

1. [ ] Step 1
   This is step 1

2. [x] Step 2
   This is step 2
`;
      
      // Act
      const plan = planManager.parsePlanFromMarkdown(markdown);
      
      // Assert
      expect(plan.title).toBe('Test Plan');
      expect(plan.description).toBe('This is a test plan');
      expect(plan.status).toBe('active');
      expect(plan.steps.length).toBe(2);
      expect(plan.steps[0].title).toBe('Step 1');
      expect(plan.steps[0].completed).toBe(false);
      expect(plan.steps[1].title).toBe('Step 2');
      expect(plan.steps[1].completed).toBe(true);
    });
  });
});
