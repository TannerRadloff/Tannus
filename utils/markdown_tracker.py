import os
import re
from datetime import datetime
import markdown
from markdown.extensions.toc import TocExtension

class MarkdownTracker:
    """
    Handles tracking of plan progress using markdown files with checkboxes.
    Provides functionality to read, update, and analyze markdown-based plans.
    """
    
    def __init__(self, plans_dir=None):
        """Initialize the MarkdownTracker with a directory for storing plans."""
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
    
    def get_plan_html(self, plan_id):
        """
        Get the HTML representation of a plan markdown file.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            str: The HTML representation of the plan
        """
        content = self.get_plan_content(plan_id)
        
        if content is None:
            return None
        
        # Convert markdown to HTML with table of contents
        html = markdown.markdown(content, extensions=[TocExtension(baselevel=1)])
        
        return html
    
    def get_plan_steps(self, plan_id):
        """
        Extract steps from a plan markdown file.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            list: List of dictionaries containing step information
        """
        content = self.get_plan_content(plan_id)
        
        if content is None:
            return []
        
        steps = []
        step_pattern = re.compile(r'- \[([ x])\] (.*)')
        
        for line in content.split('\n'):
            match = step_pattern.match(line.strip())
            if match:
                completed = match.group(1) == 'x'
                description = match.group(2)
                steps.append({
                    'description': description,
                    'completed': completed
                })
        
        return steps
    
    def mark_step_completed(self, plan_id, step_index):
        """
        Mark a specific step as completed in the plan.
        
        Args:
            plan_id (str): The plan identifier
            step_index (int): The index of the step to mark as completed
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        content = self.get_plan_content(plan_id)
        
        if content is None:
            return False
        
        lines = content.split('\n')
        step_count = 0
        
        for i, line in enumerate(lines):
            if line.strip().startswith('- [ ]'):
                if step_count == step_index:
                    lines[i] = line.replace('- [ ]', '- [x]')
                    break
                step_count += 1
        
        updated_content = '\n'.join(lines)
        
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        with open(plan_path, 'w') as f:
            f.write(updated_content)
        
        return True
    
    def mark_step_uncompleted(self, plan_id, step_index):
        """
        Mark a specific step as uncompleted in the plan.
        
        Args:
            plan_id (str): The plan identifier
            step_index (int): The index of the step to mark as uncompleted
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        content = self.get_plan_content(plan_id)
        
        if content is None:
            return False
        
        lines = content.split('\n')
        step_count = 0
        
        for i, line in enumerate(lines):
            if line.strip().startswith('- [x]'):
                if step_count == step_index:
                    lines[i] = line.replace('- [x]', '- [ ]')
                    break
                step_count += 1
        
        updated_content = '\n'.join(lines)
        
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        with open(plan_path, 'w') as f:
            f.write(updated_content)
        
        return True
    
    def add_step(self, plan_id, step_description, completed=False):
        """
        Add a new step to the plan.
        
        Args:
            plan_id (str): The plan identifier
            step_description (str): The description of the new step
            completed (bool): Whether the step is already completed
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        content = self.get_plan_content(plan_id)
        
        if content is None:
            return False
        
        lines = content.split('\n')
        steps_section_idx = -1
        
        # Find the steps section
        for i, line in enumerate(lines):
            if line.strip() == '## Steps':
                steps_section_idx = i
                break
        
        if steps_section_idx == -1:
            # If no steps section exists, add it at the end
            lines.append('\n## Steps')
            steps_section_idx = len(lines) - 1
        
        # Find where to insert the new step (after the last step)
        insert_idx = steps_section_idx + 1
        while insert_idx < len(lines) and (lines[insert_idx].strip().startswith('- [ ]') or lines[insert_idx].strip().startswith('- [x]')):
            insert_idx += 1
        
        # Insert the new step
        checkbox = "[x]" if completed else "[ ]"
        lines.insert(insert_idx, f"- {checkbox} {step_description}")
        
        updated_content = '\n'.join(lines)
        
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        with open(plan_path, 'w') as f:
            f.write(updated_content)
        
        return True
    
    def add_note(self, plan_id, note):
        """
        Add a note to the plan.
        
        Args:
            plan_id (str): The plan identifier
            note (str): The note to add
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        content = self.get_plan_content(plan_id)
        
        if content is None:
            return False
        
        lines = content.split('\n')
        notes_section_idx = -1
        
        # Find the notes section
        for i, line in enumerate(lines):
            if line.strip() == '## Notes':
                notes_section_idx = i
                break
        
        if notes_section_idx == -1:
            # If no notes section exists, add it at the end
            lines.append('\n## Notes')
            notes_section_idx = len(lines) - 1
        
        # Add the note with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        lines.insert(notes_section_idx + 1, f"- {note} _{timestamp}_")
        
        updated_content = '\n'.join(lines)
        
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        with open(plan_path, 'w') as f:
            f.write(updated_content)
        
        return True
    
    def get_plan_progress(self, plan_id):
        """
        Get the progress of a plan.
        
        Args:
            plan_id (str): The plan identifier
            
        Returns:
            dict: Progress information including completed steps, total steps, and percentage
        """
        steps = self.get_plan_steps(plan_id)
        
        if not steps:
            return {
                'completed_steps': 0,
                'total_steps': 0,
                'progress_percentage': 0
            }
        
        completed_steps = sum(1 for step in steps if step['completed'])
        total_steps = len(steps)
        
        return {
            'completed_steps': completed_steps,
            'total_steps': total_steps,
            'progress_percentage': (completed_steps / total_steps * 100) if total_steps > 0 else 0
        }
    
    def create_plan_from_template(self, plan_id, task, template=None):
        """
        Create a new plan from a template or with default content.
        
        Args:
            plan_id (str): The plan identifier
            task (str): The task description
            template (str, optional): Template content for the plan
            
        Returns:
            bool: True if creation was successful, False otherwise
        """
        plan_path = os.path.join(self.plans_dir, f"{plan_id}.md")
        
        if os.path.exists(plan_path):
            return False
        
        if template:
            content = template.replace('{{task}}', task).replace('{{date}}', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        else:
            # Default template
            content = f"""# Plan for: {task}

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
        
        with open(plan_path, 'w') as f:
            f.write(content)
        
        return True
    
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
    
    def get_all_plans(self):
        """
        Get a list of all plans.
        
        Returns:
            list: List of dictionaries containing plan information
        """
        plans = []
        
        for filename in os.listdir(self.plans_dir):
            if filename.endswith('.md'):
                plan_id = filename[:-3]  # Remove .md extension
                content = self.get_plan_content(plan_id)
                
                if content:
                    # Extract task name from first line
                    lines = content.split('\n')
                    task = lines[0].replace('# Plan for: ', '') if lines and lines[0].startswith('# Plan for: ') else "Unknown task"
                    
                    # Get progress
                    progress = self.get_plan_progress(plan_id)
                    
                    plans.append({
                        'plan_id': plan_id,
                        'task': task,
                        'progress': progress
                    })
        
        return plans
