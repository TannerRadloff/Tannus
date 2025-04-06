import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';
import { ILogger } from '../interfaces/ILogger';
import { IConfigService } from '../interfaces/IConfigService';
import { IPlanManager } from '../interfaces/IPlanManager';
import { Plan, PlanStep } from '../models/Plan';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Manages the creation, retrieval, and updating of plans
 * Implements the IPlanManager interface
 */
@injectable()
export class PlanManager implements IPlanManager {
  private plansDirectory: string;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ConfigService) private configService: IConfigService
  ) {
    this.plansDirectory = this.configService.get('PLANS_DIRECTORY') || path.join(process.cwd(), 'plans');
    this.ensurePlansDirectoryExists();
  }

  /**
   * Ensures the plans directory exists
   */
  private ensurePlansDirectoryExists(): void {
    if (!fs.existsSync(this.plansDirectory)) {
      fs.mkdirSync(this.plansDirectory, { recursive: true });
      this.logger.info(`Created plans directory at ${this.plansDirectory}`);
    }
  }

  /**
   * Creates a new plan
   * 
   * @param title - The title of the plan
   * @param description - The description of the plan
   * @param steps - The initial steps of the plan
   * @returns The created plan
   */
  async createPlan(title: string, description: string, steps: PlanStep[] = []): Promise<Plan> {
    const planId = uuidv4();
    const plan: Plan = {
      id: planId,
      title,
      description,
      steps,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    await this.savePlan(plan);
    this.logger.info(`Created new plan: ${planId}`);
    return plan;
  }

  /**
   * Retrieves a plan by ID
   * 
   * @param planId - The ID of the plan to retrieve
   * @returns The plan or null if not found
   */
  async getPlan(planId: string): Promise<Plan | null> {
    try {
      const planPath = path.join(this.plansDirectory, `${planId}.json`);
      if (!fs.existsSync(planPath)) {
        this.logger.warn(`Plan not found: ${planId}`);
        return null;
      }

      const planData = fs.readFileSync(planPath, 'utf8');
      const plan = JSON.parse(planData) as Plan;
      return plan;
    } catch (error) {
      this.logger.error(`Error retrieving plan ${planId}: ${error}`);
      return null;
    }
  }

  /**
   * Updates an existing plan
   * 
   * @param planId - The ID of the plan to update
   * @param updates - The updates to apply to the plan
   * @returns The updated plan or null if not found
   */
  async updatePlan(planId: string, updates: Partial<Plan>): Promise<Plan | null> {
    const plan = await this.getPlan(planId);
    if (!plan) {
      return null;
    }

    const updatedPlan: Plan = {
      ...plan,
      ...updates,
      updatedAt: new Date()
    };

    await this.savePlan(updatedPlan);
    this.logger.info(`Updated plan: ${planId}`);
    return updatedPlan;
  }

  /**
   * Adds a step to an existing plan
   * 
   * @param planId - The ID of the plan to update
   * @param step - The step to add
   * @returns The updated plan or null if not found
   */
  async addStep(planId: string, step: PlanStep): Promise<Plan | null> {
    const plan = await this.getPlan(planId);
    if (!plan) {
      return null;
    }

    const updatedPlan: Plan = {
      ...plan,
      steps: [...plan.steps, step],
      updatedAt: new Date()
    };

    await this.savePlan(updatedPlan);
    this.logger.info(`Added step to plan ${planId}: ${step.title}`);
    return updatedPlan;
  }

  /**
   * Updates a step in an existing plan
   * 
   * @param planId - The ID of the plan containing the step
   * @param stepIndex - The index of the step to update
   * @param updates - The updates to apply to the step
   * @returns The updated plan or null if not found
   */
  async updateStep(planId: string, stepIndex: number, updates: Partial<PlanStep>): Promise<Plan | null> {
    const plan = await this.getPlan(planId);
    if (!plan || stepIndex < 0 || stepIndex >= plan.steps.length) {
      return null;
    }

    const updatedSteps = [...plan.steps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      ...updates
    };

    const updatedPlan: Plan = {
      ...plan,
      steps: updatedSteps,
      updatedAt: new Date()
    };

    await this.savePlan(updatedPlan);
    this.logger.info(`Updated step ${stepIndex} in plan ${planId}`);
    return updatedPlan;
  }

  /**
   * Marks a step as completed in a plan
   * 
   * @param planId - The ID of the plan containing the step
   * @param stepIndex - The index of the step to mark as completed
   * @returns The updated plan or null if not found
   */
  async completeStep(planId: string, stepIndex: number): Promise<Plan | null> {
    return this.updateStep(planId, stepIndex, { completed: true });
  }

  /**
   * Converts a plan to markdown format
   * 
   * @param plan - The plan to convert to markdown
   * @returns The plan in markdown format
   */
  convertPlanToMarkdown(plan: Plan): string {
    let markdown = `# ${plan.title}\n\n`;
    markdown += `${plan.description}\n\n`;
    markdown += `Created: ${plan.createdAt.toLocaleString()}\n`;
    markdown += `Updated: ${plan.updatedAt.toLocaleString()}\n\n`;
    markdown += `Status: ${plan.status}\n\n`;
    markdown += `## Steps\n\n`;

    plan.steps.forEach((step, index) => {
      const checkbox = step.completed ? '[x]' : '[ ]';
      markdown += `${index + 1}. ${checkbox} ${step.title}\n`;
      if (step.description) {
        markdown += `   ${step.description}\n`;
      }
      markdown += '\n';
    });

    return markdown;
  }

  /**
   * Parses a markdown plan and converts it to a Plan object
   * 
   * @param markdown - The markdown content to parse
   * @param planId - Optional plan ID to use
   * @returns The parsed Plan object
   */
  parsePlanFromMarkdown(markdown: string, planId?: string): Plan {
    const lines = markdown.split('\n');
    let title = '';
    let description = '';
    const steps: PlanStep[] = [];
    let status = 'active';

    // Parse title (first h1)
    const titleMatch = lines.find(line => line.startsWith('# '));
    if (titleMatch) {
      title = titleMatch.substring(2).trim();
    }

    // Parse description (text between title and first metadata or steps)
    const titleIndex = lines.findIndex(line => line.startsWith('# '));
    const metadataIndex = lines.findIndex(line => line.startsWith('Created:') || line.startsWith('Updated:') || line.startsWith('Status:'));
    const stepsIndex = lines.findIndex(line => line.startsWith('## Steps'));
    
    if (titleIndex !== -1 && (metadataIndex !== -1 || stepsIndex !== -1)) {
      const startIndex = titleIndex + 1;
      const endIndex = metadataIndex !== -1 ? metadataIndex : stepsIndex;
      if (endIndex > startIndex) {
        description = lines.slice(startIndex, endIndex).join('\n').trim();
      }
    }

    // Parse status
    const statusLine = lines.find(line => line.startsWith('Status:'));
    if (statusLine) {
      status = statusLine.substring(7).trim() as 'active' | 'completed' | 'paused';
    }

    // Parse steps
    let inStepsSection = false;
    for (const line of lines) {
      if (line.startsWith('## Steps')) {
        inStepsSection = true;
        continue;
      }

      if (inStepsSection && line.match(/^\d+\.\s+\[(x| )\]\s+.+/)) {
        const completed = line.includes('[x]');
        const stepContent = line.replace(/^\d+\.\s+\[(x| )\]\s+/, '').trim();
        
        steps.push({
          id: uuidv4(),
          title: stepContent,
          description: '',
          completed
        });
      }
    }

    return {
      id: planId || uuidv4(),
      title,
      description,
      steps,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: status as 'active' | 'completed' | 'paused'
    };
  }

  /**
   * Saves a plan to the filesystem
   * 
   * @param plan - The plan to save
   */
  private async savePlan(plan: Plan): Promise<void> {
    try {
      const planPath = path.join(this.plansDirectory, `${plan.id}.json`);
      fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

      // Also save as markdown for human readability
      const markdownPath = path.join(this.plansDirectory, `${plan.id}.md`);
      fs.writeFileSync(markdownPath, this.convertPlanToMarkdown(plan));
    } catch (error) {
      this.logger.error(`Error saving plan ${plan.id}: ${error}`);
      throw error;
    }
  }

  /**
   * Lists all available plans
   * 
   * @returns Array of plans
   */
  async listPlans(): Promise<Plan[]> {
    try {
      const files = fs.readdirSync(this.plansDirectory);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const plans: Plan[] = [];
      for (const file of jsonFiles) {
        const planPath = path.join(this.plansDirectory, file);
        const planData = fs.readFileSync(planPath, 'utf8');
        const plan = JSON.parse(planData) as Plan;
        plans.push(plan);
      }
      
      return plans;
    } catch (error) {
      this.logger.error(`Error listing plans: ${error}`);
      return [];
    }
  }

  /**
   * Deletes a plan
   * 
   * @param planId - The ID of the plan to delete
   * @returns True if successful, false otherwise
   */
  async deletePlan(planId: string): Promise<boolean> {
    try {
      const jsonPath = path.join(this.plansDirectory, `${planId}.json`);
      const mdPath = path.join(this.plansDirectory, `${planId}.md`);
      
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath);
      }
      
      if (fs.existsSync(mdPath)) {
        fs.unlinkSync(mdPath);
      }
      
      this.logger.info(`Deleted plan: ${planId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting plan ${planId}: ${error}`);
      return false;
    }
  }
}
