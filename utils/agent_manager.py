import os
import asyncio
import json
import uuid
from datetime import datetime
from agents import Agent, Runner, ComputerTool, WebSearchTool, function_tool
from utils.plan_manager import PlanManager

class AgentManager:
    """
    Manages the creation, execution, and monitoring of AI agents.
    Handles agent lifecycle, context preservation, and handoffs between agents.
    """
    
    def __init__(self, plans_dir=None):
        """Initialize the AgentManager with a directory for storing agent states."""
        self.agents = {}  # Dictionary to store active agents by session_id
        self.agent_statuses = {}  # Dictionary to store agent status by session_id
        self.plan_manager = PlanManager(plans_dir)
        self.agents_dir = os.path.join(os.getcwd(), 'agent_states')
        os.makedirs(self.agents_dir, exist_ok=True)
    
    def start_agent(self, task, plan_id, session_id):
        """
        Start a new agent to work on a task.
        
        Args:
            task (str): The task description
            plan_id (str): The plan identifier
            session_id (str): The session identifier
            
        Returns:
            str: The agent ID
        """
        # Create a unique agent ID
        agent_id = f"agent_{uuid.uuid4()}"
        
        # Get the plan content
        plan_data = self.plan_manager.get_plan(plan_id)
        plan_content = plan_data.get('content', '')
        
        # Update agent status
        self.agent_statuses[session_id] = {
            'agent_id': agent_id,
            'status': 'starting',
            'task': task,
            'plan_id': plan_id,
            'start_time': datetime.now().isoformat(),
            'last_update': datetime.now().isoformat()
        }
        
        # Start the agent in a background task
        asyncio.create_task(self._run_agent(agent_id, task, plan_id, plan_content, session_id))
        
        return agent_id
    
    async def _run_agent(self, agent_id, task, plan_id, plan_content, session_id):
        """
        Run the agent asynchronously.
        
        Args:
            agent_id (str): The agent identifier
            task (str): The task description
            plan_id (str): The plan identifier
            plan_content (str): The plan content
            session_id (str): The session identifier
        """
        try:
            # Update status to running
            self.agent_statuses[session_id]['status'] = 'running'
            self.agent_statuses[session_id]['last_update'] = datetime.now().isoformat()
            
            # Create agent with tools
            agent = self._create_agent(task, plan_content)
            self.agents[session_id] = agent
            
            # Run the agent
            result = await Runner.run(agent, task)
            
            # Update status to completed
            self.agent_statuses[session_id]['status'] = 'completed'
            self.agent_statuses[session_id]['last_update'] = datetime.now().isoformat()
            self.agent_statuses[session_id]['result'] = result.final_output
            
            # Save agent state for potential future use
            self._save_agent_state(session_id, agent_id, task, plan_id, result)
            
        except Exception as e:
            # Update status to error
            self.agent_statuses[session_id]['status'] = 'error'
            self.agent_statuses[session_id]['last_update'] = datetime.now().isoformat()
            self.agent_statuses[session_id]['error'] = str(e)
    
    def _create_agent(self, task, plan_content):
        """
        Create an agent with appropriate tools and instructions.
        
        Args:
            task (str): The task description
            plan_content (str): The plan content
            
        Returns:
            Agent: The configured agent
        """
        # Define tools for the agent
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
                plan_id = self.agent_statuses.get(session_id, {}).get('plan_id')
                if plan_id:
                    success = self.plan_manager.update_plan(plan_id, updates)
                    if success:
                        return "Plan updated successfully"
                    else:
                        return "Failed to update plan"
                else:
                    return "No active plan found"
            except Exception as e:
                return f"Error updating plan: {str(e)}"
        
        @function_tool
        def get_current_plan() -> str:
            """
            Get the current plan content.
            
            Returns:
                The current plan content as markdown
            """
            plan_id = self.agent_statuses.get(session_id, {}).get('plan_id')
            if plan_id:
                plan_data = self.plan_manager.get_plan(plan_id)
                return plan_data.get('content', 'No plan content found')
            else:
                return "No active plan found"
        
        # Create the agent with tools and instructions
        agent = Agent(
            name="Task Agent",
            instructions=f"""You are a powerful AI agent tasked with completing complex tasks. 
            
Your primary goal is to complete the following task:
{task}

You have access to a plan that outlines the steps needed to complete this task. Always refer to this plan and keep it updated:
{plan_content}

IMPORTANT GUIDELINES:
1. Always start by analyzing the task and updating the plan if needed.
2. Mark steps as completed in the plan as you progress.
3. If you encounter challenges or the goal changes, update the plan accordingly.
4. Use the tools available to you, especially the computer tool for tasks requiring system access.
5. Work methodically and thoroughly to complete all steps in the plan.
6. Provide clear explanations of your actions and reasoning.
7. If you need to hand off to another agent, ensure they have access to the updated plan.

Remember that you can run indefinitely as needed to complete the task. Take your time and be thorough.
""",
            tools=[
                update_plan,
                get_current_plan,
                WebSearchTool(),
                ComputerTool()
            ],
        )
        
        return agent
    
    def get_status(self, session_id):
        """
        Get the current status of an agent.
        
        Args:
            session_id (str): The session identifier
            
        Returns:
            dict: The agent status
        """
        return self.agent_statuses.get(session_id, {'status': 'not_found'})
    
    def _save_agent_state(self, session_id, agent_id, task, plan_id, result):
        """
        Save the agent state for potential future use.
        
        Args:
            session_id (str): The session identifier
            agent_id (str): The agent identifier
            task (str): The task description
            plan_id (str): The plan identifier
            result: The agent execution result
        """
        state_path = os.path.join(self.agents_dir, f"{agent_id}.json")
        
        # Extract messages from result
        messages = []
        for msg in result.messages:
            message_data = {
                'role': msg.role,
                'content': msg.content
            }
            if msg.tool_calls:
                message_data['tool_calls'] = [
                    {
                        'name': tc.name,
                        'arguments': tc.arguments
                    }
                    for tc in msg.tool_calls
                ]
            messages.append(message_data)
        
        state = {
            'agent_id': agent_id,
            'session_id': session_id,
            'task': task,
            'plan_id': plan_id,
            'start_time': self.agent_statuses[session_id]['start_time'],
            'end_time': datetime.now().isoformat(),
            'status': self.agent_statuses[session_id]['status'],
            'messages': messages,
            'final_output': result.final_output
        }
        
        with open(state_path, 'w') as f:
            json.dump(state, f, indent=2)
    
    def continue_agent(self, session_id, new_input):
        """
        Continue an existing agent with new input.
        
        Args:
            session_id (str): The session identifier
            new_input (str): The new input for the agent
            
        Returns:
            bool: True if agent was continued successfully, False otherwise
        """
        if session_id not in self.agents:
            return False
        
        # Update status
        self.agent_statuses[session_id]['status'] = 'running'
        self.agent_statuses[session_id]['last_update'] = datetime.now().isoformat()
        
        # Start the agent in a background task
        agent = self.agents[session_id]
        plan_id = self.agent_statuses[session_id]['plan_id']
        asyncio.create_task(self._continue_agent(agent, new_input, session_id, plan_id))
        
        return True
    
    async def _continue_agent(self, agent, new_input, session_id, plan_id):
        """
        Continue an agent asynchronously.
        
        Args:
            agent: The agent to continue
            new_input (str): The new input for the agent
            session_id (str): The session identifier
            plan_id (str): The plan identifier
        """
        try:
            # Run the agent with new input
            result = await Runner.run(agent, new_input)
            
            # Update status
            self.agent_statuses[session_id]['status'] = 'completed'
            self.agent_statuses[session_id]['last_update'] = datetime.now().isoformat()
            self.agent_statuses[session_id]['result'] = result.final_output
            
            # Save agent state
            self._save_agent_state(session_id, self.agent_statuses[session_id]['agent_id'], 
                                  self.agent_statuses[session_id]['task'], plan_id, result)
            
        except Exception as e:
            # Update status to error
            self.agent_statuses[session_id]['status'] = 'error'
            self.agent_statuses[session_id]['last_update'] = datetime.now().isoformat()
            self.agent_statuses[session_id]['error'] = str(e)
