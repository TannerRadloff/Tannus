import os
import json
import asyncio
import subprocess
from datetime import datetime
from agents import Agent, Runner, ComputerTool, function_tool

class RemoteComputerToolManager:
    """
    Manages access to the remote computer tool for AI agents.
    Provides a secure and controlled interface for agents to interact with the system.
    """
    
    def __init__(self, workspace_dir=None):
        """Initialize the RemoteComputerToolManager with a workspace directory."""
        self.workspace_dir = workspace_dir or os.path.join(os.getcwd(), 'agent_workspace')
        os.makedirs(self.workspace_dir, exist_ok=True)
        
        # Create subdirectories for different types of operations
        self.file_dir = os.path.join(self.workspace_dir, 'files')
        self.script_dir = os.path.join(self.workspace_dir, 'scripts')
        self.log_dir = os.path.join(self.workspace_dir, 'logs')
        
        os.makedirs(self.file_dir, exist_ok=True)
        os.makedirs(self.script_dir, exist_ok=True)
        os.makedirs(self.log_dir, exist_ok=True)
    
    async def create_agent_with_computer_access(self, task, plan_id, session_id):
        """
        Create an agent with access to the remote computer tool.
        
        Args:
            task (str): The task description
            plan_id (str): The plan identifier
            session_id (str): The session identifier
            
        Returns:
            Agent: The configured agent
        """
        # Get plan content if available
        plan_content = self._get_plan_content(plan_id)
        
        # Create a workspace for this session
        session_workspace = os.path.join(self.workspace_dir, session_id)
        os.makedirs(session_workspace, exist_ok=True)
        
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
            full_path = os.path.join(session_workspace, file_path)
            if not full_path.startswith(session_workspace):
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
            full_path = os.path.join(session_workspace, file_path)
            if not full_path.startswith(session_workspace):
                return "Error: File path must be within the workspace"
            
            # Read the file
            try:
                with open(full_path, 'r') as f:
                    return f.read()
            except Exception as e:
                return f"Error reading file: {str(e)}"
        
        @function_tool
        def run_script(script_content: str, language: str = "python") -> str:
            """
            Run a script in the agent's workspace.
            
            Args:
                script_content: The content of the script to run
                language: The programming language (python, bash, etc.)
            
            Returns:
                The script output
            """
            # Create a temporary script file
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            script_filename = f"script_{timestamp}.{language}"
            script_path = os.path.join(session_workspace, script_filename)
            
            # Write the script
            with open(script_path, 'w') as f:
                f.write(script_content)
            
            # Make the script executable
            os.chmod(script_path, 0o755)
            
            # Run the script
            try:
                if language == "python":
                    cmd = ["python", script_path]
                elif language in ["bash", "sh"]:
                    cmd = ["bash", script_path]
                else:
                    return f"Unsupported language: {language}"
                
                # Run the command and capture output
                result = subprocess.run(
                    cmd,
                    cwd=session_workspace,
                    capture_output=True,
                    text=True,
                    timeout=60  # Timeout after 60 seconds
                )
                
                # Log the execution
                log_entry = {
                    "timestamp": datetime.now().isoformat(),
                    "script": script_filename,
                    "language": language,
                    "returncode": result.returncode,
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
                
                log_path = os.path.join(self.log_dir, f"{session_id}_script_log.jsonl")
                with open(log_path, 'a') as f:
                    f.write(json.dumps(log_entry) + '\n')
                
                # Return the result
                if result.returncode == 0:
                    return f"Script executed successfully:\n{result.stdout}"
                else:
                    return f"Script execution failed (code {result.returncode}):\n{result.stderr}"
            
            except subprocess.TimeoutExpired:
                return "Script execution timed out (60 seconds)"
            except Exception as e:
                return f"Error executing script: {str(e)}"
        
        @function_tool
        def list_files() -> str:
            """
            List files in the agent's workspace.
            
            Returns:
                A list of files in the workspace
            """
            try:
                file_list = []
                for root, dirs, files in os.walk(session_workspace):
                    for file in files:
                        rel_path = os.path.relpath(os.path.join(root, file), session_workspace)
                        file_list.append(rel_path)
                
                return "Files in workspace:\n" + "\n".join(file_list)
            except Exception as e:
                return f"Error listing files: {str(e)}"
        
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
        
        # Create the agent with tools
        agent = Agent(
            name="Computer Access Agent",
            instructions=f"""You are an AI agent with access to the remote computer system.

Your task is: {task}

You have access to the current plan:
{plan_content}

GUIDELINES FOR USING COMPUTER ACCESS:
1. Use the write_file tool to create files in your workspace
2. Use the read_file tool to read files from your workspace
3. Use the run_script tool to execute code (Python, Bash, etc.)
4. Use the list_files tool to see what files are in your workspace
5. Always update the plan as you make progress
6. Mark steps as completed when done
7. Add new steps if needed

SECURITY GUIDELINES:
1. Only access files within your workspace
2. Do not attempt to access system files or sensitive information
3. Limit script execution time to reasonable durations
4. Do not run potentially harmful commands

Always refer to the plan to understand the context of your task and update it as you make progress.
""",
            tools=[
                write_file,
                read_file,
                run_script,
                list_files,
                update_plan,
                get_current_plan,
                ComputerTool()  # Include the built-in ComputerTool
            ],
        )
        
        return agent
    
    def _get_plan_content(self, plan_id):
        """
        Get the content of a plan markdown file.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            str: The markdown content of the plan, or None if not found
        """
        plans_dir = os.path.join(os.getcwd(), 'plans')
        plan_path = os.path.join(plans_dir, f"{plan_id}.md")
        
        if not os.path.exists(plan_path):
            return None
        
        try:
            with open(plan_path, 'r') as f:
                return f.read()
        except:
            return None
    
    async def run_agent_with_computer_access(self, task, plan_id, session_id):
        """
        Create and run an agent with computer access.
        
        Args:
            task (str): The task description
            plan_id (str): The plan identifier
            session_id (str): The session identifier
            
        Returns:
            dict: The result of the agent run
        """
        # Create the agent
        agent = await self.create_agent_with_computer_access(task, plan_id, session_id)
        
        # Run the agent
        try:
            result = await Runner.run(agent, task)
            
            # Return the result
            return {
                'status': 'success',
                'session_id': session_id,
                'task': task,
                'plan_id': plan_id,
                'result': result.final_output
            }
        except Exception as e:
            # Return the error
            return {
                'status': 'error',
                'session_id': session_id,
                'task': task,
                'plan_id': plan_id,
                'error': str(e)
            }
