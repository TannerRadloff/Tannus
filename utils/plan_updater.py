import os
import json
from datetime import datetime
from agents import Agent, Runner, function_tool

class PlanUpdater:
    """
    Specialized component for updating plans as tasks progress or requirements change.
    Provides functionality for agents to update plans based on new information,
    completed steps, or changing requirements.
    """
    
    def __init__(self, plans_dir=None):
        """Initialize the PlanUpdater with a directory for storing plans."""
        self.plans_dir = plans_dir or os.path.join(os.getcwd(), 'plans')
        os.makedirs(self.plans_dir, exist_ok=True)
    
    def get_plan_content(self, plan_id):
        """
        Get the content of a plan markdown file.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            str: The markdown content of the plan
        """
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        
        if not os.path.exists(plan_path):
            return None
        
        with open(plan_path, 'r') as f:
            content = f.read()
        
        return content
    
    def update_plan_content(self, plan_id, new_content):
        """
        Update the entire content of a plan.
        
        Args:
            plan_id (str): The plan identifier
            new_content (str): The new content for the plan
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        
        if not os.path.exists(plan_path):
            return False
        
        with open(plan_path, 'w') as f:
            f.write(new_content)
        
        return True
    
    def mark_step_completed(self, plan_id, step_description):
        """
        Mark a step as completed based on its description.
        
        Args:
            plan_id (str): The plan identifier
            step_description (str): The description of the step to mark as completed
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        content = self.get_plan_content(plan_id)
        
        if content is None:
            return False
        
        # Find the step by description and mark it as completed
        lines = content.split('\n')
        updated = False
        
        for i, line in enumerate(lines):
            if line.strip().startswith('- [ ]') and step_description in line:
                lines[i] = line.replace('- [ ]', '- [x]')
                updated = True
                break
        
        if not updated:
            return False
        
        updated_content = '\n'.join(lines)
        
        return self.update_plan_content(plan_id, updated_content)
    
    def add_steps_based_on_progress(self, plan_id, progress_description):
        """
        Add new steps to the plan based on progress description.
        
        Args:
            plan_id (str): The plan identifier
            progress_description (str): Description of the progress made
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        # Create an agent to analyze progress and suggest new steps
        return self._use_agent_for_plan_update(
            plan_id, 
            f"Based on this progress: {progress_description}, suggest new steps to add to the plan."
        )
    
    def update_plan_for_challenges(self, plan_id, challenge_description):
        """
        Update the plan to address challenges encountered.
        
        Args:
            plan_id (str): The plan identifier
            challenge_description (str): Description of challenges encountered
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        # Create an agent to analyze challenges and update the plan
        return self._use_agent_for_plan_update(
            plan_id, 
            f"Based on these challenges: {challenge_description}, update the plan to address them."
        )
    
    def update_plan_for_goal_change(self, plan_id, new_goal_description):
        """
        Update the plan to reflect a change in goals or requirements.
        
        Args:
            plan_id (str): The plan identifier
            new_goal_description (str): Description of the new goal or requirements
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        # Create an agent to analyze the new goal and update the plan
        return self._use_agent_for_plan_update(
            plan_id, 
            f"The goal has changed to: {new_goal_description}. Update the plan to reflect this change."
        )
    
    async def _use_agent_for_plan_update(self, plan_id, instruction):
        """
        Use an AI agent to update the plan based on an instruction.
        
        Args:
            plan_id (str): The plan identifier
            instruction (str): Instruction for the agent
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        # Get current plan content
        current_plan = self.get_plan_content(plan_id)
        
        if current_plan is None:
            return False
        
        # Define tools for the agent
        @function_tool
        def update_plan(updated_plan_content: str) -> str:
            """
            Update the plan with new content.
            
            Args:
                updated_plan_content: The new content for the plan
            
            Returns:
                A confirmation message indicating the plan was updated
            """
            success = self.update_plan_content(plan_id, updated_plan_content)
            if success:
                return "Plan updated successfully"
            else:
                return "Failed to update plan"
        
        # Create the agent
        agent = Agent(
            name="Plan Updater",
            instructions=f"""You are a specialized AI agent focused on updating plans.

Your task is to update a plan based on the following instruction:
{instruction}

CURRENT PLAN:
{current_plan}

GUIDELINES FOR UPDATING PLANS:
1. Preserve the overall structure of the plan (headings, sections, etc.)
2. Keep the task description and creation date unchanged
3. Update the "Last Updated" timestamp to the current time
4. When adding new steps, place them in a logical sequence
5. When modifying existing steps, preserve their intent but clarify or expand as needed
6. When addressing challenges, add steps specifically to overcome those challenges
7. When the goal changes, update both the task description and the steps
8. Ensure all steps are specific, actionable, and measurable
9. Use the update_plan tool with the complete updated plan content

Always return the COMPLETE updated plan, not just the changes.
""",
            tools=[update_plan],
        )
        
        # Run the agent
        try:
            result = await Runner.run(agent, instruction)
            return True
        except Exception as e:
            print(f"Error updating plan: {str(e)}")
            return False
    
    def reorganize_plan_steps(self, plan_id):
        """
        Reorganize the steps in a plan to improve logical flow.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        return self._use_agent_for_plan_update(
            plan_id, 
            "Reorganize the steps in this plan to improve logical flow and ensure dependencies are properly ordered."
        )
    
    def simplify_plan(self, plan_id):
        """
        Simplify a complex plan by consolidating steps.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        return self._use_agent_for_plan_update(
            plan_id, 
            "Simplify this plan by consolidating related steps and removing unnecessary complexity."
        )
    
    def expand_plan_detail(self, plan_id):
        """
        Expand a plan with more detailed steps.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        return self._use_agent_for_plan_update(
            plan_id, 
            "Expand this plan with more detailed steps to provide clearer guidance."
        )
