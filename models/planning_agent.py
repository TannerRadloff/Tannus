import os
import json
from datetime import datetime
from models.planning_system import PlanningSystem, Plan, PlanStep
from agents import Agent, Runner, function_tool

class PlanningAgent:
    """
    Agent specialized in creating and managing plans for complex tasks.
    This agent is responsible for analyzing tasks, creating detailed plans,
    and updating plans as tasks progress or requirements change.
    """
    
    def __init__(self, planning_system=None, plans_dir=None):
        """Initialize the PlanningAgent with a planning system."""
        self.planning_system = planning_system or PlanningSystem(plans_dir)
    
    async def create_plan_for_task(self, task, session_id):
        """
        Create a detailed plan for a given task using an AI agent.
        
        Args:
            task (str): The task description
            session_id (str): The session identifier
            
        Returns:
            str: The plan ID
        """
        # First create an initial plan with default steps
        plan_id = self.planning_system.create_initial_plan(task, session_id)
        
        # Get the initial plan
        initial_plan = self.planning_system.get_plan(plan_id)
        
        # Create a planning agent to analyze the task and improve the plan
        planning_agent = self._create_planning_agent(plan_id, task, initial_plan)
        
        # Run the planning agent to analyze the task and create a detailed plan
        result = await Runner.run(planning_agent, 
                                 f"Analyze this task and create a detailed plan: {task}")
        
        # Return the plan ID
        return plan_id
    
    async def update_plan_for_changes(self, plan_id, changes_description):
        """
        Update a plan based on changes in requirements or new information.
        
        Args:
            plan_id (str): The plan identifier
            changes_description (str): Description of changes or new information
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        # Get the current plan
        current_plan = self.planning_system.get_plan(plan_id)
        if "error" in current_plan:
            return False
        
        # Create a planning agent to update the plan
        planning_agent = self._create_planning_agent(plan_id, current_plan["task"], current_plan)
        
        # Run the planning agent to update the plan
        result = await Runner.run(planning_agent, 
                                 f"Update the plan based on these changes: {changes_description}")
        
        return True
    
    def _create_planning_agent(self, plan_id, task, current_plan):
        """
        Create an agent specialized in planning.
        
        Args:
            plan_id (str): The plan identifier
            task (str): The task description
            current_plan (dict): The current plan data
            
        Returns:
            Agent: The configured planning agent
        """
        # Define tools for the planning agent
        @function_tool
        def update_plan(plan_updates: str) -> str:
            """
            Update the current plan with new information or mark steps as completed.
            
            Args:
                plan_updates: JSON string containing updates to the plan, which can include:
                    - completed_steps: List of indices of steps to mark as completed
                    - new_steps: List of new steps to add to the plan
                    - notes: Additional notes to append
            
            Returns:
                A confirmation message indicating the plan was updated
            """
            try:
                updates = json.loads(plan_updates)
                success = self.planning_system.update_plan(plan_id, updates)
                if success:
                    return "Plan updated successfully"
                else:
                    return "Failed to update plan"
            except Exception as e:
                return f"Error updating plan: {str(e)}"
        
        @function_tool
        def get_current_plan() -> str:
            """
            Get the current plan content.
            
            Returns:
                The current plan content as markdown
            """
            plan_data = self.planning_system.get_plan(plan_id)
            return plan_data.get('content', 'No plan content found')
        
        @function_tool
        def analyze_task(task_description: str) -> str:
            """
            Analyze a task to identify key components, requirements, and potential challenges.
            
            Args:
                task_description: The task to analyze
            
            Returns:
                Analysis of the task including components, requirements, and challenges
            """
            # In a real implementation, this could use another agent or more sophisticated analysis
            return f"Task analysis for: {task_description}\n\n" + \
                   "This is a placeholder for task analysis. In a real implementation, " + \
                   "this would provide a detailed breakdown of the task components, " + \
                   "requirements, and potential challenges."
        
        # Create the planning agent with tools and instructions
        planning_agent = Agent(
            name="Planning Agent",
            instructions=f"""You are a specialized AI agent focused on creating and managing detailed plans for complex tasks.

Your primary responsibility is to analyze tasks, break them down into clear, actionable steps, and organize them into a comprehensive plan.

CURRENT TASK:
{task}

CURRENT PLAN:
{current_plan.get('content', 'No plan available yet')}

PLANNING GUIDELINES:
1. Analyze the task thoroughly to understand all requirements and constraints.
2. Break down complex tasks into smaller, manageable steps.
3. Ensure steps are specific, actionable, and measurable.
4. Include steps for research, implementation, testing, and validation.
5. Consider potential challenges and include steps to address them.
6. Organize steps in a logical sequence.
7. Update the plan when new information becomes available or requirements change.
8. Use the update_plan tool to modify the plan.

When creating or updating a plan:
- Each step should be clear and actionable
- Steps should be ordered logically
- Include research and preparation steps
- Include implementation steps
- Include testing and validation steps
- Include finalization and delivery steps

Always use the get_current_plan tool to see the latest version of the plan before making updates.
""",
            tools=[
                update_plan,
                get_current_plan,
                analyze_task
            ],
        )
        
        return planning_agent
