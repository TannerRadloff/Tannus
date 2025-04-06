import os
import json
from datetime import datetime
from agents import Agent, Runner, function_tool

class AgentHandoffManager:
    """
    Manages handoffs between agents with context preservation.
    Enables agents to delegate tasks to other specialized agents while
    maintaining context and plan awareness.
    """
    
    def __init__(self, plans_dir=None):
        """Initialize the AgentHandoffManager with a directory for storing context."""
        self.plans_dir = plans_dir or os.path.join(os.getcwd(), 'plans')
        self.context_dir = os.path.join(os.getcwd(), 'agent_contexts')
        os.makedirs(self.context_dir, exist_ok=True)
    
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
    
    def save_context(self, handoff_id, context_data):
        """
        Save context data for a handoff.
        
        Args:
            handoff_id (str): The handoff identifier
            context_data (dict): The context data to save
            
        Returns:
            bool: True if save was successful, False otherwise
        """
        context_path = os.path.join(self.context_dir, f"{handoff_id}.json")
        
        try:
            with open(context_path, 'w') as f:
                json.dump(context_data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving context: {str(e)}")
            return False
    
    def get_context(self, handoff_id):
        """
        Get context data for a handoff.
        
        Args:
            handoff_id (str): The handoff identifier
            
        Returns:
            dict: The context data, or None if not found
        """
        context_path = os.path.join(self.context_dir, f"{handoff_id}.json")
        
        if not os.path.exists(context_path):
            return None
        
        try:
            with open(context_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading context: {str(e)}")
            return None
    
    async def create_handoff(self, from_agent_id, to_agent_type, task, plan_id, additional_context=None):
        """
        Create a handoff from one agent to another.
        
        Args:
            from_agent_id (str): The ID of the agent initiating the handoff
            to_agent_type (str): The type of agent to hand off to
            task (str): The task to hand off
            plan_id (str): The plan identifier
            additional_context (dict, optional): Additional context data
            
        Returns:
            str: The handoff ID
        """
        # Generate handoff ID
        handoff_id = f"handoff_{datetime.now().strftime('%Y%m%d%H%M%S')}_{from_agent_id}_{to_agent_type}"
        
        # Get plan content
        plan_content = self.get_plan_content(plan_id)
        
        # Create context data
        context_data = {
            'handoff_id': handoff_id,
            'from_agent_id': from_agent_id,
            'to_agent_type': to_agent_type,
            'task': task,
            'plan_id': plan_id,
            'plan_content': plan_content,
            'timestamp': datetime.now().isoformat(),
            'additional_context': additional_context or {}
        }
        
        # Save context
        self.save_context(handoff_id, context_data)
        
        return handoff_id
    
    async def execute_handoff(self, handoff_id):
        """
        Execute a handoff by creating and running the target agent.
        
        Args:
            handoff_id (str): The handoff identifier
            
        Returns:
            dict: The result of the handoff
        """
        # Get context
        context = self.get_context(handoff_id)
        
        if context is None:
            return {'error': 'Handoff context not found'}
        
        # Create the target agent based on agent type
        agent = self._create_agent_by_type(
            context['to_agent_type'],
            context['task'],
            context['plan_id'],
            context['plan_content'],
            context
        )
        
        # Run the agent
        try:
            result = await Runner.run(agent, context['task'])
            
            # Save result to context
            context['result'] = {
                'final_output': result.final_output,
                'completed_at': datetime.now().isoformat()
            }
            self.save_context(handoff_id, context)
            
            return {
                'handoff_id': handoff_id,
                'status': 'completed',
                'result': result.final_output
            }
        except Exception as e:
            # Save error to context
            context['error'] = str(e)
            self.save_context(handoff_id, context)
            
            return {
                'handoff_id': handoff_id,
                'status': 'error',
                'error': str(e)
            }
    
    def _create_agent_by_type(self, agent_type, task, plan_id, plan_content, context):
        """
        Create an agent of the specified type.
        
        Args:
            agent_type (str): The type of agent to create
            task (str): The task for the agent
            plan_id (str): The plan identifier
            plan_content (str): The plan content
            context (dict): The handoff context
            
        Returns:
            Agent: The created agent
        """
        # Define common tools for all agent types
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
                from utils.plan_updater import PlanUpdater
                updater = PlanUpdater()
                
                updates = json.loads(plan_updates)
                success = updater.update_plan_content(plan_id, updates.get('content', ''))
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
            return plan_content or "No plan content found"
        
        @function_tool
        def create_handoff(to_agent_type: str, subtask: str) -> str:
            """
            Create a handoff to another agent.
            
            Args:
                to_agent_type: The type of agent to hand off to
                subtask: The subtask to hand off
            
            Returns:
                The handoff ID
            """
            handoff_id = f"handoff_{datetime.now().strftime('%Y%m%d%H%M%S')}_{agent_type}_{to_agent_type}"
            
            # Save context for the new handoff
            new_context = {
                'handoff_id': handoff_id,
                'from_agent_type': agent_type,
                'to_agent_type': to_agent_type,
                'task': subtask,
                'plan_id': plan_id,
                'plan_content': plan_content,
                'parent_handoff_id': context['handoff_id'],
                'timestamp': datetime.now().isoformat()
            }
            
            self.save_context(handoff_id, new_context)
            
            return f"Handoff created with ID: {handoff_id}"
        
        # Create agent based on type
        if agent_type == 'research':
            # Research agent specializes in gathering information
            agent = Agent(
                name="Research Agent",
                instructions=f"""You are a specialized research agent that excels at gathering information.

Your task is: {task}

You have access to the current plan:
{plan_content}

GUIDELINES:
1. Focus on thorough information gathering from reliable sources
2. Organize information in a clear, structured manner
3. Cite sources for all information
4. Update the plan with your findings
5. If you need help from another specialist, use the create_handoff tool

Always refer to the plan to understand the context of your task and update it as you make progress.
""",
                tools=[update_plan, get_current_plan, create_handoff],
            )
        
        elif agent_type == 'coding':
            # Coding agent specializes in writing code
            agent = Agent(
                name="Coding Agent",
                instructions=f"""You are a specialized coding agent that excels at writing and debugging code.

Your task is: {task}

You have access to the current plan:
{plan_content}

GUIDELINES:
1. Write clean, well-documented code
2. Follow best practices for the language/framework you're using
3. Include error handling and edge cases
4. Test your code thoroughly
5. Update the plan with your progress
6. If you need help from another specialist, use the create_handoff tool

Always refer to the plan to understand the context of your task and update it as you make progress.
""",
                tools=[update_plan, get_current_plan, create_handoff],
            )
        
        elif agent_type == 'planning':
            # Planning agent specializes in creating and updating plans
            agent = Agent(
                name="Planning Agent",
                instructions=f"""You are a specialized planning agent that excels at creating and updating plans.

Your task is: {task}

You have access to the current plan:
{plan_content}

GUIDELINES:
1. Break down complex tasks into clear, actionable steps
2. Ensure steps are specific, measurable, and achievable
3. Consider dependencies between steps
4. Organize steps in a logical sequence
5. Update the plan as new information becomes available
6. If you need help from another specialist, use the create_handoff tool

Always refer to the plan to understand the context of your task and update it as you make progress.
""",
                tools=[update_plan, get_current_plan, create_handoff],
            )
        
        else:
            # Default general-purpose agent
            agent = Agent(
                name="Task Agent",
                instructions=f"""You are a versatile agent tasked with completing: {task}

You have access to the current plan:
{plan_content}

GUIDELINES:
1. Follow the plan to complete your task
2. Update the plan as you make progress
3. Mark steps as completed when done
4. Add new steps if needed
5. If you need help from a specialist, use the create_handoff tool

Always refer to the plan to understand the context of your task and update it as you make progress.
""",
                tools=[update_plan, get_current_plan, create_handoff],
            )
        
        return agent
