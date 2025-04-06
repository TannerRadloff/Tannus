import os
import markdown
from datetime import datetime

class PlanManager:
    """
    Manages the creation, retrieval, and updating of agent plans.
    Plans are stored as markdown files with checkboxes for tracking progress.
    """
    
    def __init__(self, plans_dir=None):
        """Initialize the PlanManager with a directory for storing plans."""
        self.plans_dir = plans_dir or os.path.join(os.getcwd(), 'plans')
        os.makedirs(self.plans_dir, exist_ok=True)
    
    def create_plan(self, task, session_id):
        """
        Create a new plan for a task.
        
        Args:
            task (str): The task description
            session_id (str): The session identifier
            
        Returns:
            str: The plan ID
        """
        # Generate a plan ID based on timestamp and session
        plan_id = f"{session_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create initial plan content with task description and timestamp
        plan_content = f"""# Plan for: {task}

*Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*

## Task Description
{task}

## Steps
- [ ] Analyze task requirements
- [ ] Research necessary information
- [ ] Develop initial solution
- [ ] Implement solution
- [ ] Test and validate
- [ ] Finalize and deliver

## Notes
- Plan will be updated as the agent progresses
- Additional steps may be added based on task complexity
"""
        
        # Save the plan to a markdown file
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        with open(plan_path, 'w') as f:
            f.write(plan_content)
        
        return plan_id
    
    def get_plan(self, plan_id):
        """
        Retrieve a plan by its ID.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            dict: The plan details including content, HTML representation, and metadata
        """
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        
        if not os.path.exists(plan_path):
            return {"error": "Plan not found"}
        
        with open(plan_path, 'r') as f:
            content = f.read()
        
        # Convert markdown to HTML for display
        html_content = markdown.markdown(content)
        
        # Extract metadata
        lines = content.split('\n')
        task = lines[0].replace('# Plan for: ', '') if lines and lines[0].startswith('# Plan for: ') else "Unknown task"
        
        # Count completed vs total steps
        completed_steps = content.count('- [x]')
        total_steps = content.count('- [ ]') + completed_steps
        
        return {
            "plan_id": plan_id,
            "task": task,
            "content": content,
            "html_content": html_content,
            "completed_steps": completed_steps,
            "total_steps": total_steps,
            "progress_percentage": (completed_steps / total_steps * 100) if total_steps > 0 else 0
        }
    
    def update_plan(self, plan_id, updates):
        """
        Update a plan with new content or mark steps as completed.
        
        Args:
            plan_id (str): The plan identifier
            updates (dict): Updates to apply to the plan, which can include:
                - completed_steps (list): Indices of steps to mark as completed
                - new_steps (list): New steps to add to the plan
                - notes (str): Additional notes to append
                - content (str): Complete replacement of plan content
                
        Returns:
            bool: True if update was successful, False otherwise
        """
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        
        if not os.path.exists(plan_path):
            return False
        
        with open(plan_path, 'r') as f:
            content = f.read()
        
        # If full content replacement is provided, use it
        if updates.get('content'):
            updated_content = updates['content']
        else:
            lines = content.split('\n')
            
            # Mark steps as completed
            if updates.get('completed_steps'):
                step_lines = [i for i, line in enumerate(lines) if line.strip().startswith('- [ ]')]
                for step_idx in updates['completed_steps']:
                    if 0 <= step_idx < len(step_lines):
                        line_idx = step_lines[step_idx]
                        lines[line_idx] = lines[line_idx].replace('- [ ]', '- [x]')
            
            # Add new steps
            if updates.get('new_steps'):
                # Find the steps section
                steps_section_idx = -1
                for i, line in enumerate(lines):
                    if line.strip() == '## Steps':
                        steps_section_idx = i
                        break
                
                if steps_section_idx >= 0:
                    # Find where to insert new steps (after last step)
                    insert_idx = steps_section_idx + 1
                    while insert_idx < len(lines) and (lines[insert_idx].strip().startswith('- [ ]') or lines[insert_idx].strip().startswith('- [x]')):
                        insert_idx += 1
                    
                    # Insert new steps
                    for step in updates['new_steps']:
                        lines.insert(insert_idx, f"- [ ] {step}")
                        insert_idx += 1
            
            # Add notes
            if updates.get('notes'):
                notes_section_idx = -1
                for i, line in enumerate(lines):
                    if line.strip() == '## Notes':
                        notes_section_idx = i
                        break
                
                if notes_section_idx >= 0:
                    # Add note after the Notes section header
                    lines.insert(notes_section_idx + 1, f"- {updates['notes']} _{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_")
            
            updated_content = '\n'.join(lines)
        
        # Write updated content back to file
        with open(plan_path, 'w') as f:
            f.write(updated_content)
        
        return True
    
    def mark_step_completed(self, plan_id, step_index):
        """
        Mark a specific step as completed in the plan.
        
        Args:
            plan_id (str): The plan identifier
            step_index (int): The index of the step to mark as completed
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        return self.update_plan(plan_id, {'completed_steps': [step_index]})
    
    def add_steps(self, plan_id, new_steps):
        """
        Add new steps to the plan.
        
        Args:
            plan_id (str): The plan identifier
            new_steps (list): List of new steps to add
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        return self.update_plan(plan_id, {'new_steps': new_steps})
    
    def add_note(self, plan_id, note):
        """
        Add a note to the plan.
        
        Args:
            plan_id (str): The plan identifier
            note (str): The note to add
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        return self.update_plan(plan_id, {'notes': note})
