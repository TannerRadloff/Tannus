import os
import json
import asyncio
import time
from datetime import datetime, timedelta
from agents import Agent, Runner, ComputerTool, WebSearchTool, function_tool

class IndefiniteAgentRunner:
    """
    Manages the indefinite running of AI agents to complete complex tasks.
    Provides functionality for long-running agents, persistence, and recovery.
    """
    
    def __init__(self, workspace_dir=None):
        """Initialize the IndefiniteAgentRunner with a workspace directory."""
        self.workspace_dir = workspace_dir or os.path.join(os.getcwd(), 'agent_workspace')
        self.state_dir = os.path.join(os.getcwd(), 'agent_states')
        self.plans_dir = os.path.join(os.getcwd(), 'plans')
        
        os.makedirs(self.workspace_dir, exist_ok=True)
        os.makedirs(self.state_dir, exist_ok=True)
        os.makedirs(self.plans_dir, exist_ok=True)
        
        # Track running agents
        self.running_agents = {}
        self.agent_statuses = {}
        
        # Start background task to monitor agents
        asyncio.create_task(self._monitor_agents())
    
    async def start_indefinite_agent(self, task, plan_id, session_id):
        """
        Start an agent that can run indefinitely until the task is completed.
        
        Args:
            task (str): The task description
            plan_id (str): The plan identifier
            session_id (str): The session identifier
            
        Returns:
            dict: Status information about the started agent
        """
        # Create a workspace for this session
        session_workspace = os.path.join(self.workspace_dir, session_id)
        os.makedirs(session_workspace, exist_ok=True)
        
        # Get plan content
        plan_content = self._get_plan_content(plan_id)
        
        # Create the agent
        agent = await self._create_indefinite_agent(task, plan_id, plan_content, session_id, session_workspace)
        
        # Store the agent
        self.running_agents[session_id] = agent
        
        # Update status
        self.agent_statuses[session_id] = {
            'session_id': session_id,
            'plan_id': plan_id,
            'task': task,
            'status': 'starting',
            'start_time': datetime.now().isoformat(),
            'last_update': datetime.now().isoformat(),
            'progress': 0,
            'max_runtime': 24 * 60 * 60,  # 24 hours in seconds
            'checkpoint_interval': 15 * 60  # 15 minutes in seconds
        }
        
        # Start the agent in a background task
        asyncio.create_task(self._run_agent_indefinitely(session_id))
        
        return {
            'status': 'success',
            'message': 'Indefinite agent started',
            'session_id': session_id,
            'plan_id': plan_id
        }
    
    async def _create_indefinite_agent(self, task, plan_id, plan_content, session_id, workspace_dir):
        """
        Create an agent configured for indefinite running.
        
        Args:
            task (str): The task description
            plan_id (str): The plan identifier
            plan_content (str): The plan content
            session_id (str): The session identifier
            workspace_dir (str): The workspace directory
            
        Returns:
            Agent: The configured agent
        """
        # Define custom tools for the agent
        @function_tool
        def write_file(file_path: str, content: str) -> str:
            """
            Write content to a file in the agent's workspace.
            
            Args:
                file_path: The path to the file (relative to workspace)
                content: The content to write
            
            Returns:
                A confirmation message
            """
            # Ensure the file path is within the workspace
            full_path = os.path.join(workspace_dir, file_path)
            if not full_path.startswith(workspace_dir):
                return "Error: File path must be within the workspace"
            
            # Create directories if needed
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # Write the file
            try:
                with open(full_path, 'w') as f:
                    f.write(content)
                return f"File written successfully: {file_path}"
            except Exception as e:
                return f"Error writing file: {str(e)}"
        
        @function_tool
        def read_file(file_path: str) -> str:
            """
            Read content from a file in the agent's workspace.
            
            Args:
                file_path: The path to the file (relative to workspace)
            
            Returns:
                The file content
            """
            # Ensure the file path is within the workspace
            full_path = os.path.join(workspace_dir, file_path)
            if not full_path.startswith(workspace_dir):
                return "Error: File path must be within the workspace"
            
            # Read the file
            try:
                with open(full_path, 'r') as f:
                    return f.read()
            except Exception as e:
                return f"Error reading file: {str(e)}"
        
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
        def save_checkpoint(checkpoint_data: str) -> str:
            """
            Save a checkpoint of the agent's current state.
            
            Args:
                checkpoint_data: JSON string containing checkpoint data
            
            Returns:
                A confirmation message
            """
            try:
                checkpoint = json.loads(checkpoint_data)
                checkpoint['timestamp'] = datetime.now().isoformat()
                
                checkpoint_path = os.path.join(self.state_dir, f"{session_id}_checkpoint.json")
                with open(checkpoint_path, 'w') as f:
                    json.dump(checkpoint, f, indent=2)
                
                return "Checkpoint saved successfully"
            except Exception as e:
                return f"Error saving checkpoint: {str(e)}"
        
        @function_tool
        def load_checkpoint() -> str:
            """
            Load the latest checkpoint of the agent's state.
            
            Returns:
                The checkpoint data as a JSON string
            """
            checkpoint_path = os.path.join(self.state_dir, f"{session_id}_checkpoint.json")
            
            if not os.path.exists(checkpoint_path):
                return "No checkpoint found"
            
            try:
                with open(checkpoint_path, 'r') as f:
                    checkpoint = json.load(f)
                
                return json.dumps(checkpoint)
            except Exception as e:
                return f"Error loading checkpoint: {str(e)}"
        
        @function_tool
        def check_completion_status() -> str:
            """
            Check if the task is completed based on the plan.
            
            Returns:
                Status information about task completion
            """
            try:
                from utils.markdown_tracker import MarkdownTracker
                tracker = MarkdownTracker()
                
                progress = tracker.get_plan_progress(plan_id)
                completed = progress.get('completed_steps', 0)
                total = progress.get('total_steps', 0)
                percentage = progress.get('progress_percentage', 0)
                
                # Update the agent status
                if session_id in self.agent_statuses:
                    self.agent_statuses[session_id]['progress'] = percentage
                    self.agent_statuses[session_id]['last_update'] = datetime.now().isoformat()
                
                if percentage >= 100:
                    return f"Task is completed! All {total} steps are done."
                else:
                    return f"Task is {percentage:.1f}% complete. {completed} of {total} steps completed."
            except Exception as e:
                return f"Error checking completion status: {str(e)}"
        
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
            try:
                from utils.handoff_manager import AgentHandoffManager
                handoff_manager = AgentHandoffManager()
                
                handoff_id = f"handoff_{datetime.now().strftime('%Y%m%d%H%M%S')}_{session_id}_{to_agent_type}"
                
                # Create context for the handoff
                additional_context = {
                    'parent_session_id': session_id,
                    'parent_plan_id': plan_id,
                    'parent_task': task
                }
                
                # Start async task to create handoff
                asyncio.create_task(handoff_manager.create_handoff(
                    session_id, to_agent_type, subtask, plan_id, additional_context
                ))
                
                return f"Handoff created with ID: {handoff_id}"
            except Exception as e:
                return f"Error creating handoff: {str(e)}"
        
        # Create the agent with tools
        agent = Agent(
            name="Indefinite Agent",
            instructions=f"""You are an AI agent designed to run indefinitely until you complete complex tasks.

Your current task is: {task}

You have access to the current plan:
{plan_content}

GUIDELINES FOR INDEFINITE RUNNING:
1. Break down complex tasks into manageable steps
2. Update the plan as you make progress
3. Mark steps as completed when done
4. Add new steps if needed
5. Save checkpoints regularly to maintain state
6. Create handoffs to specialized agents when needed
7. Check completion status regularly
8. Continue working until the task is 100% complete

IMPORTANT:
- You can run for extended periods (up to 24 hours)
- Save your progress regularly using save_checkpoint
- If you encounter challenges, update the plan to address them
- If the goal changes, update the plan accordingly
- Always check if the task is complete before finishing

Use the tools available to you to complete the task efficiently and thoroughly.
""",
            tools=[
                write_file,
                read_file,
                update_plan,
                get_current_plan,
                save_checkpoint,
                load_checkpoint,
                check_completion_status,
                create_handoff,
                WebSearchTool(),
                ComputerTool()
            ],
        )
        
        return agent
    
    async def _run_agent_indefinitely(self, session_id):
        """
        Run an agent indefinitely until the task is completed.
        
        Args:
            session_id (str): The session identifier
        """
        if session_id not in self.running_agents or session_id not in self.agent_statuses:
            return
        
        agent = self.running_agents[session_id]
        status = self.agent_statuses[session_id]
        
        # Update status to running
        status['status'] = 'running'
        status['last_update'] = datetime.now().isoformat()
        
        # Get task and plan ID
        task = status['task']
        plan_id = status['plan_id']
        
        try:
            # Initial run
            result = await Runner.run(agent, task)
            
            # Save initial result
            self._save_agent_result(session_id, result)
            
            # Check if task is completed
            from utils.markdown_tracker import MarkdownTracker
            tracker = MarkdownTracker()
            
            while True:
                # Check progress
                progress = tracker.get_plan_progress(plan_id)
                percentage = progress.get('progress_percentage', 0)
                
                # Update status
                status['progress'] = percentage
                status['last_update'] = datetime.now().isoformat()
                
                # Check if task is completed
                if percentage >= 100:
                    status['status'] = 'completed'
                    break
                
                # Check if max runtime exceeded
                start_time = datetime.fromisoformat(status['start_time'])
                elapsed_seconds = (datetime.now() - start_time).total_seconds()
                
                if elapsed_seconds > status['max_runtime']:
                    status['status'] = 'timeout'
                    break
                
                # Continue with the next iteration
                continuation_prompt = "Continue working on the task. Check your progress and update the plan accordingly."
                result = await Runner.run(agent, continuation_prompt)
                
                # Save result
                self._save_agent_result(session_id, result)
                
                # Sleep for a short time to prevent excessive CPU usage
                await asyncio.sleep(5)
        
        except Exception as e:
            # Update status to error
            status['status'] = 'error'
            status['last_update'] = datetime.now().isoformat()
            status['error'] = str(e)
    
    def _save_agent_result(self, session_id, result):
        """
        Save the result of an agent run.
        
        Args:
            session_id (str): The session identifier
            result: The result of the agent run
        """
        if session_id not in self.agent_statuses:
            return
        
        status = self.agent_statuses[session_id]
        
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
        
        # Create result data
        result_data = {
            'session_id': session_id,
            'plan_id': status['plan_id'],
            'timestamp': datetime.now().isoformat(),
            'messages': messages,
            'final_output': result.final_output
        }
        
        # Save to file
        result_path = os.path.join(self.state_dir, f"{session_id}_latest_result.json")
        with open(result_path, 'w') as f:
            json.dump(result_data, f, indent=2)
    
    async def _monitor_agents(self):
        """
        Monitor running agents and manage their lifecycle.
        """
        while True:
            # Check all running agents
            for session_id, status in list(self.agent_statuses.items()):
                # Skip if agent is not running
                if status['status'] not in ['running', 'starting']:
                    continue
                
                # Check for inactivity
                try:
                    last_update = datetime.fromisoformat(status['last_update'])
                    inactive_seconds = (datetime.now() - last_update).total_seconds()
                    
                    # If inactive for more than 30 minutes, mark as stalled
                    if inactive_seconds > 30 * 60:
                        status['status'] = 'stalled'
                        
                        # Try to restart the agent
                        self._restart_stalled_agent(session_id)
                except Exception as e:
                    print(f"Error monitoring agent {session_id}: {str(e)}")
            
            # Sleep for a minute before checking again
            await asyncio.sleep(60)
    
    def _restart_stalled_agent(self, session_id):
        """
        Attempt to restart a stalled agent.
        
        Args:
            session_id (str): The session identifier
        """
        if session_id not in self.agent_statuses:
            return
        
        status = self.agent_statuses[session_id]
        
        # Update status
        status['status'] = 'restarting'
        status['last_update'] = datetime.now().isoformat()
        
        # Start a new background task to restart the agent
        asyncio.create_task(self._run_agent_indefinitely(session_id))
    
    def get_agent_status(self, session_id):
        """
        Get the status of an agent.
        
        Args:
            session_id (str): The session identifier
            
        Returns:
            dict: The agent status
        """
        if session_id not in self.agent_statuses:
            return {'status': 'not_found'}
        
        return self.agent_statuses[session_id]
    
    def pause_agent(self, session_id):
        """
        Pause a running agent.
        
        Args:
            session_id (str): The session identifier
            
        Returns:
            bool: True if agent was paused, False otherwise
        """
        if session_id not in self.agent_statuses:
            return False
        
        status = self.agent_statuses[session_id]
        
        if status['status'] not in ['running', 'starting']:
            return False
        
        # Update status
        status['status'] = 'paused'
        status['last_update'] = datetime.now().isoformat()
        
        return True
    
    def resume_agent(self, session_id):
        """
        Resume a paused agent.
        
        Args:
            session_id (str): The session identifier
            
        Returns:
            bool: True if agent was resumed, False otherwise
        """
        if session_id not in self.agent_statuses:
            return False
        
        status = self.agent_statuses[session_id]
        
        if status['status'] != 'paused':
            return False
        
        # Update status
        status['status'] = 'running'
        status['last_update'] = datetime.now().isoformat()
        
        # Start a new background task to resume the agent
        asyncio.create_task(self._run_agent_indefinitely(session_id))
        
        return True
    
    def stop_agent(self, session_id):
        """
        Stop a running agent.
        
        Args:
            session_id (str): The session identifier
            
        Returns:
            bool: True if agent was stopped, False otherwise
        """
        if session_id not in self.agent_statuses:
            return False
        
        # Update status
        self.agent_statuses[session_id]['status'] = 'stopped'
        self.agent_statuses[session_id]['last_update'] = datetime.now().isoformat()
        
        # Remove from running agents
        if session_id in self.running_agents:
            del self.running_agents[session_id]
        
        return True
    
    def _get_plan_content(self, plan_id):
        """
        Get the content of a plan markdown file.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            str: The markdown content of the plan, or None if not found
        """
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        
        if not os.path.exists(plan_path):
            return None
        
        try:
            with open(plan_path, 'r') as f:
                return f.read()
        except:
            return None
