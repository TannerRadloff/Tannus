import os
import json
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class PlanStep(BaseModel):
    """Model for a single step in a plan"""
    description: str
    completed: bool = False
    added_at: str = datetime.now().isoformat()
    completed_at: Optional[str] = None

class Plan(BaseModel):
    """Model for a complete plan"""
    plan_id: str
    task: str
    steps: List[PlanStep] = []
    notes: List[str] = []
    created_at: str = datetime.now().isoformat()
    updated_at: str = datetime.now().isoformat()
    
    def to_markdown(self) -> str:
        """Convert the plan to markdown format with checkboxes"""
        md_content = f"# Plan for: {self.task}\n\n"
        md_content += f"*Created: {self.created_at}*\n"
        md_content += f"*Last Updated: {self.updated_at}*\n\n"
        
        md_content += "## Task Description\n"
        md_content += f"{self.task}\n\n"
        
        md_content += "## Steps\n"
        for step in self.steps:
            checkbox = "[x]" if step.completed else "[ ]"
            md_content += f"- {checkbox} {step.description}\n"
        
        md_content += "\n## Notes\n"
        for note in self.notes:
            md_content += f"- {note}\n"
        
        return md_content
    
    @classmethod
    def from_markdown(cls, plan_id: str, markdown_content: str) -> 'Plan':
        """Create a Plan object from markdown content"""
        lines = markdown_content.split('\n')
        
        # Extract task
        task = lines[0].replace('# Plan for: ', '') if lines and lines[0].startswith('# Plan for: ') else "Unknown task"
        
        # Extract dates
        created_at = datetime.now().isoformat()
        updated_at = datetime.now().isoformat()
        for line in lines:
            if line.startswith('*Created:'):
                try:
                    created_at = line.replace('*Created:', '').replace('*', '').strip()
                except:
                    pass
            if line.startswith('*Last Updated:'):
                try:
                    updated_at = line.replace('*Last Updated:', '').replace('*', '').strip()
                except:
                    pass
        
        # Extract steps
        steps = []
        in_steps_section = False
        for line in lines:
            if line.strip() == '## Steps':
                in_steps_section = True
                continue
            if in_steps_section and line.strip().startswith('##'):
                in_steps_section = False
                continue
            if in_steps_section and line.strip().startswith('- ['):
                completed = '[x]' in line
                description = line.split(']', 1)[1].strip()
                steps.append(PlanStep(
                    description=description,
                    completed=completed,
                    added_at=created_at,
                    completed_at=datetime.now().isoformat() if completed else None
                ))
        
        # Extract notes
        notes = []
        in_notes_section = False
        for line in lines:
            if line.strip() == '## Notes':
                in_notes_section = True
                continue
            if in_notes_section and line.strip().startswith('##'):
                in_notes_section = False
                continue
            if in_notes_section and line.strip().startswith('- '):
                notes.append(line.strip()[2:])
        
        return cls(
            plan_id=plan_id,
            task=task,
            steps=steps,
            notes=notes,
            created_at=created_at,
            updated_at=updated_at
        )

class PlanningSystem:
    """
    Advanced planning system for AI agents.
    Enables agents to create, retrieve, update, and analyze plans.
    """
    
    def __init__(self, plans_dir=None):
        """Initialize the PlanningSystem with a directory for storing plans."""
        self.plans_dir = plans_dir or os.path.join(os.getcwd(), 'plans')
        os.makedirs(self.plans_dir, exist_ok=True)
    
    def create_initial_plan(self, task: str, session_id: str) -> str:
        """
        Create an initial plan for a task with default steps based on task analysis.
        
        Args:
            task (str): The task description
            session_id (str): The session identifier
            
        Returns:
            str: The plan ID
        """
        # Generate a plan ID based on timestamp and session
        plan_id = f"{session_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create initial plan with default steps
        plan = Plan(
            plan_id=plan_id,
            task=task,
            steps=[
                PlanStep(description="Analyze task requirements and constraints"),
                PlanStep(description="Research necessary information"),
                PlanStep(description="Develop initial solution approach"),
                PlanStep(description="Break down solution into implementable steps"),
                PlanStep(description="Implement solution"),
                PlanStep(description="Test and validate solution"),
                PlanStep(description="Refine solution based on testing"),
                PlanStep(description="Finalize and deliver solution")
            ],
            notes=[
                "Initial plan created automatically based on task description",
                "Plan will be updated as the agent progresses",
                "Additional steps may be added based on task complexity"
            ]
        )
        
        # Save the plan to a markdown file
        self._save_plan_to_markdown(plan)
        
        # Also save as JSON for easier programmatic access
        self._save_plan_to_json(plan)
        
        return plan_id
    
    def get_plan(self, plan_id: str) -> Dict[str, Any]:
        """
        Retrieve a plan by its ID.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            dict: The plan details including content, HTML representation, and metadata
        """
        # Try to load from JSON first for more structured data
        json_path = os.path.join(self.plans_dir, f"{plan_id}.json")
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                plan_data = json.load(f)
                
            # Get markdown content too
            md_path = os.path.join(self.plans_dir, f"{plan_id}.md")
            if os.path.exists(md_path):
                with open(md_path, 'r') as f:
                    md_content = f.read()
            else:
                # Regenerate markdown if file doesn't exist
                plan = Plan(**plan_data)
                md_content = plan.to_markdown()
                
            # Count completed vs total steps
            completed_steps = sum(1 for step in plan_data.get('steps', []) if step.get('completed', False))
            total_steps = len(plan_data.get('steps', []))
            
            return {
                "plan_id": plan_id,
                "task": plan_data.get('task', ''),
                "steps": plan_data.get('steps', []),
                "notes": plan_data.get('notes', []),
                "content": md_content,
                "completed_steps": completed_steps,
                "total_steps": total_steps,
                "progress_percentage": (completed_steps / total_steps * 100) if total_steps > 0 else 0,
                "created_at": plan_data.get('created_at', ''),
                "updated_at": plan_data.get('updated_at', '')
            }
        
        # Fall back to markdown if JSON doesn't exist
        md_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        if not os.path.exists(md_path):
            return {"error": "Plan not found"}
        
        with open(md_path, 'r') as f:
            md_content = f.read()
        
        # Parse markdown to create a Plan object
        plan = Plan.from_markdown(plan_id, md_content)
        
        # Count completed vs total steps
        completed_steps = sum(1 for step in plan.steps if step.completed)
        total_steps = len(plan.steps)
        
        return {
            "plan_id": plan_id,
            "task": plan.task,
            "steps": [step.dict() for step in plan.steps],
            "notes": plan.notes,
            "content": md_content,
            "completed_steps": completed_steps,
            "total_steps": total_steps,
            "progress_percentage": (completed_steps / total_steps * 100) if total_steps > 0 else 0,
            "created_at": plan.created_at,
            "updated_at": plan.updated_at
        }
    
    def update_plan(self, plan_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a plan with new content or mark steps as completed.
        
        Args:
            plan_id (str): The plan identifier
            updates (dict): Updates to apply to the plan, which can include:
                - completed_steps (list): Indices of steps to mark as completed
                - new_steps (list): New steps to add to the plan
                - notes (list/str): Additional notes to append
                - content (str): Complete replacement of plan content
                
        Returns:
            bool: True if update was successful, False otherwise
        """
        # Get current plan
        plan_data = self.get_plan(plan_id)
        if "error" in plan_data:
            return False
        
        # If we have JSON data, use that for more structured updates
        json_path = os.path.join(self.plans_dir, f"{plan_id}.json")
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                plan_dict = json.load(f)
            
            plan = Plan(**plan_dict)
            
            # Update plan based on provided updates
            if 'completed_steps' in updates:
                for step_idx in updates['completed_steps']:
                    if 0 <= step_idx < len(plan.steps):
                        plan.steps[step_idx].completed = True
                        plan.steps[step_idx].completed_at = datetime.now().isoformat()
            
            if 'new_steps' in updates:
                for step_desc in updates['new_steps']:
                    plan.steps.append(PlanStep(description=step_desc))
            
            if 'notes' in updates:
                if isinstance(updates['notes'], list):
                    plan.notes.extend(updates['notes'])
                else:
                    plan.notes.append(updates['notes'])
            
            # Update timestamp
            plan.updated_at = datetime.now().isoformat()
            
            # Save updated plan
            self._save_plan_to_json(plan)
            self._save_plan_to_markdown(plan)
            
            return True
        
        # Fall back to markdown updates if JSON doesn't exist
        md_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        if not os.path.exists(md_path):
            return False
        
        with open(md_path, 'r') as f:
            content = f.read()
        
        # If full content replacement is provided, use it
        if 'content' in updates:
            updated_content = updates['content']
            with open(md_path, 'w') as f:
                f.write(updated_content)
            
            # Try to parse and save as JSON too
            try:
                plan = Plan.from_markdown(plan_id, updated_content)
                self._save_plan_to_json(plan)
            except:
                pass
            
            return True
        
        # Otherwise, parse and update the markdown
        plan = Plan.from_markdown(plan_id, content)
        
        # Update plan based on provided updates
        if 'completed_steps' in updates:
            for step_idx in updates['completed_steps']:
                if 0 <= step_idx < len(plan.steps):
                    plan.steps[step_idx].completed = True
                    plan.steps[step_idx].completed_at = datetime.now().isoformat()
        
        if 'new_steps' in updates:
            for step_desc in updates['new_steps']:
                plan.steps.append(PlanStep(description=step_desc))
        
        if 'notes' in updates:
            if isinstance(updates['notes'], list):
                plan.notes.extend(updates['notes'])
            else:
                plan.notes.append(updates['notes'])
        
        # Update timestamp
        plan.updated_at = datetime.now().isoformat()
        
        # Save updated plan
        self._save_plan_to_markdown(plan)
        self._save_plan_to_json(plan)
        
        return True
    
    def analyze_plan_progress(self, plan_id: str) -> Dict[str, Any]:
        """
        Analyze the progress of a plan.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            dict: Analysis of plan progress including completion percentage, 
                  estimated time to completion, and recommendations
        """
        plan_data = self.get_plan(plan_id)
        if "error" in plan_data:
            return {"error": "Plan not found"}
        
        # Basic progress metrics
        completed_steps = plan_data["completed_steps"]
        total_steps = plan_data["total_steps"]
        progress_percentage = plan_data["progress_percentage"]
        
        # Calculate time metrics if possible
        time_analysis = {}
        if "created_at" in plan_data and "updated_at" in plan_data:
            try:
                created_time = datetime.fromisoformat(plan_data["created_at"])
                updated_time = datetime.fromisoformat(plan_data["updated_at"])
                elapsed_time = (updated_time - created_time).total_seconds()
                
                if completed_steps > 0:
                    avg_time_per_step = elapsed_time / completed_steps
                    estimated_remaining_time = avg_time_per_step * (total_steps - completed_steps)
                    
                    time_analysis = {
                        "elapsed_time_seconds": elapsed_time,
                        "avg_time_per_step_seconds": avg_time_per_step,
                        "estimated_remaining_time_seconds": estimated_remaining_time,
                        "estimated_completion_time": (datetime.now() + datetime.timedelta(seconds=estimated_remaining_time)).isoformat()
                    }
            except:
                pass
        
        # Generate recommendations based on progress
        recommendations = []
        if progress_percentage < 10:
            recommendations.append("Plan is in early stages. Focus on completing initial analysis steps.")
        elif progress_percentage < 50:
            recommendations.append("Plan is progressing. Consider adding more detailed steps for upcoming work.")
        elif progress_percentage < 90:
            recommendations.append("Plan is well advanced. Focus on completing remaining steps and validating results.")
        else:
            recommendations.append("Plan is nearly complete. Ensure all deliverables are finalized and validated.")
        
        # Check for stalled progress
        if "updated_at" in plan_data:
            try:
                last_update = datetime.fromisoformat(plan_data["updated_at"])
                time_since_update = (datetime.now() - last_update).total_seconds()
                
                if time_since_update > 3600:  # More than an hour
                    recommendations.append(f"No updates in {time_since_update/3600:.1f} hours. Consider reviewing progress.")
            except:
                pass
        
        return {
            "plan_id": plan_id,
            "progress": {
                "completed_steps": completed_steps,
                "total_steps": total_steps,
                "progress_percentage": progress_percentage
            },
            "time_analysis": time_analysis,
            "recommendations": recommendations
        }
    
    def _save_plan_to_markdown(self, plan: Plan) -> None:
        """Save a plan to a markdown file."""
        md_content = plan.to_markdown()
        md_path = os.path.join(self.plans_dir, f"{plan.plan_id}.md")
        
        with open(md_path, 'w') as f:
            f.write(md_content)
    
    def _save_plan_to_json(self, plan: Plan) -> None:
        """Save a plan to a JSON file for easier programmatic access."""
        json_path = os.path.join(self.plans_dir, f"{plan.plan_id}.json")
        
        with open(json_path, 'w') as f:
            json.dump(plan.dict(), f, indent=2)
