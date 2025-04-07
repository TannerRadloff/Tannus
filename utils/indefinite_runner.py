import os
import json
import asyncio
import time
import uuid
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
        
        # Initialize the monitoring coroutine but don't start it yet
        self._monitor_task = None
    
    def start_monitoring(self):
        """Start the background monitoring task if an event loop is running."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                self._monitor_task = asyncio.create_task(self._monitor_agents())
        except RuntimeError:
            print("No running event loop detected. Monitoring will be started when needed.")
    
    async def start_indefinite_agent(self, task, plan_id, session_id):
        """
        Start an agent that can run indefinitely until the task is completed.
        
        Args:
            task (str): The task description for the agent
            plan_id (str): Identifier for the plan
            session_id (str): Unique session identifier
            
        Returns:
            str: Agent ID of the created agent
        """
        # Ensure monitoring is running
        if not self._monitor_task:
            self._monitor_task = asyncio.create_task(self._monitor_agents())
            
        agent_id = f"agent_{uuid.uuid4().hex[:8]}"
        agent_workspace = os.path.join(self.workspace_dir, agent_id)
        os.makedirs(agent_workspace, exist_ok=True)
        
        # Initialize agent with tools
        agent = Agent(
            tools=[
                ComputerTool(),
                WebSearchTool(),
                function_tool(self.update_plan, "update_plan", "Update the current plan with new steps or modifications")
            ]
        )
        
        # Create runner
        runner = Runner(agent)
        
        # Store agent information
        self.running_agents[agent_id] = {
            "runner": runner,
            "task": task,
            "plan_id": plan_id,
            "session_id": session_id,
            "workspace": agent_workspace,
            "start_time": datetime.now(),
            "last_checkpoint": datetime.now()
        }
        
        self.agent_statuses[agent_id] = {
            "status": "running",
            "progress": 0,
            "last_update": datetime.now().isoformat()
        }
        
        # Start agent in background
        asyncio.create_task(self._run_agent(agent_id))
        
        return agent_id
    
    async def _run_agent(self, agent_id):
        """Run the agent until completion or failure."""
        if agent_id not in self.running_agents:
            return
            
        agent_info = self.running_agents[agent_id]
        runner = agent_info["runner"]
        task = agent_info["task"]
        
        try:
            # Start the agent with the task
            await runner.start(task)
            
            # Main agent loop
            while True:
                # Check if task is complete
                if await self._check_task_completion(agent_id):
                    self.agent_statuses[agent_id]["status"] = "completed"
                    break
                    
                # Run one step of the agent
                await runner.step()
                
                # Create checkpoint
                if datetime.now() - agent_info["last_checkpoint"] > timedelta(minutes=5):
                    self._create_checkpoint(agent_id)
                    agent_info["last_checkpoint"] = datetime.now()
                
                # Update status
                self.agent_statuses[agent_id]["last_update"] = datetime.now().isoformat()
                
                # Small delay to prevent CPU hogging
                await asyncio.sleep(0.1)
                
        except Exception as e:
            self.agent_statuses[agent_id]["status"] = "failed"
            self.agent_statuses[agent_id]["error"] = str(e)
            print(f"Agent {agent_id} failed: {e}")
    
    async def _check_task_completion(self, agent_id):
        """Check if the agent has completed its task."""
        # This is a placeholder - in a real implementation, you would have 
        # logic to determine if the task is complete based on agent output
        agent_info = self.running_agents[agent_id]
        plan_id = agent_info["plan_id"]
        
        # Check if plan is marked as complete
        plan_file = os.path.join(self.plans_dir, f"{plan_id}.md")
        if os.path.exists(plan_file):
            with open(plan_file, 'r') as f:
                content = f.read()
                # Simple check - all tasks have [x]
                if "[x]" in content and "[ ]" not in content:
                    return True
        
        return False
    
    def _create_checkpoint(self, agent_id):
        """Create a checkpoint for the agent state."""
        agent_info = self.running_agents[agent_id]
        checkpoint_file = os.path.join(self.state_dir, f"{agent_id}_checkpoint.json")
        
        checkpoint_data = {
            "agent_id": agent_id,
            "task": agent_info["task"],
            "plan_id": agent_info["plan_id"],
            "session_id": agent_info["session_id"],
            "start_time": agent_info["start_time"].isoformat(),
            "checkpoint_time": datetime.now().isoformat(),
            "status": self.agent_statuses[agent_id]
        }
        
        with open(checkpoint_file, 'w') as f:
            json.dump(checkpoint_data, f, indent=2)
    
    async def _monitor_agents(self):
        """Background task to monitor all running agents."""
        while True:
            # Check for stalled agents
            current_time = datetime.now()
            for agent_id, status in self.agent_statuses.items():
                if status["status"] == "running":
                    last_update = datetime.fromisoformat(status["last_update"])
                    if current_time - last_update > timedelta(minutes=30):
                        # Agent might be stalled
                        status["status"] = "stalled"
                        print(f"Agent {agent_id} appears to be stalled")
                        
                        # Attempt recovery
                        asyncio.create_task(self._recover_agent(agent_id))
            
            # Sleep for a while before next check
            await asyncio.sleep(60)
    
    async def _recover_agent(self, agent_id):
        """Attempt to recover a stalled agent."""
        if agent_id not in self.running_agents:
            return
            
        print(f"Attempting to recover agent {agent_id}")
        
        # Load latest checkpoint
        checkpoint_file = os.path.join(self.state_dir, f"{agent_id}_checkpoint.json")
        if not os.path.exists(checkpoint_file):
            print(f"No checkpoint found for agent {agent_id}")
            return
            
        # In a real implementation, you would have logic to restart the agent
        # from the checkpoint
        
        # For now, just mark it as recovered and restart
        self.agent_statuses[agent_id]["status"] = "recovered"
        asyncio.create_task(self._run_agent(agent_id))
    
    def update_plan(self, plan_id, updates):
        """
        Update the plan with new steps or modifications.
        
        Args:
            plan_id (str): Identifier for the plan
            updates (dict): Updates to apply to the plan
        
        Returns:
            bool: True if update was successful
        """
        plan_file = os.path.join(self.plans_dir, f"{plan_id}.md")
        if not os.path.exists(plan_file):
            return False
            
        # In a real implementation, you would have logic to update the plan
        # based on the provided updates
        
        return True
    
    def get_agent_status(self, agent_id):
        """Get the current status of an agent."""
        if agent_id not in self.agent_statuses:
            return None
            
        return self.agent_statuses[agent_id]
    
    def list_agents(self):
        """List all agents and their statuses."""
        return {
            agent_id: {
                "task": self.running_agents[agent_id]["task"],
                "status": self.agent_statuses[agent_id]["status"],
                "start_time": self.running_agents[agent_id]["start_time"].isoformat()
            }
            for agent_id in self.running_agents
        }
