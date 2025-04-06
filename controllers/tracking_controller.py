from flask import Blueprint, request, jsonify, session
import uuid
from utils.markdown_tracker import MarkdownTracker

# Initialize markdown tracker
markdown_tracker = MarkdownTracker()

# Create blueprint
tracking_bp = Blueprint('tracking', __name__, url_prefix='/api/tracking')

@tracking_bp.route('/get/<plan_id>', methods=['GET'])
def get_plan(plan_id):
    """API endpoint to get a plan's markdown content."""
    content = markdown_tracker.get_plan_content(plan_id)
    
    if content is None:
        return jsonify({
            'status': 'error',
            'message': 'Plan not found'
        }), 404
    
    html_content = markdown_tracker.get_plan_html(plan_id)
    steps = markdown_tracker.get_plan_steps(plan_id)
    progress = markdown_tracker.get_plan_progress(plan_id)
    
    return jsonify({
        'status': 'success',
        'plan': {
            'plan_id': plan_id,
            'content': content,
            'html_content': html_content,
            'steps': steps,
            'progress': progress
        }
    })

@tracking_bp.route('/mark-completed/<plan_id>/<int:step_index>', methods=['POST'])
def mark_step_completed(plan_id, step_index):
    """API endpoint to mark a step as completed."""
    success = markdown_tracker.mark_step_completed(plan_id, step_index)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to mark step as completed'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Step marked as completed'
    })

@tracking_bp.route('/mark-uncompleted/<plan_id>/<int:step_index>', methods=['POST'])
def mark_step_uncompleted(plan_id, step_index):
    """API endpoint to mark a step as uncompleted."""
    success = markdown_tracker.mark_step_uncompleted(plan_id, step_index)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to mark step as uncompleted'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Step marked as uncompleted'
    })

@tracking_bp.route('/add-step/<plan_id>', methods=['POST'])
def add_step(plan_id):
    """API endpoint to add a new step to the plan."""
    data = request.json
    step_description = data.get('description')
    completed = data.get('completed', False)
    
    if not step_description:
        return jsonify({
            'status': 'error',
            'message': 'Step description is required'
        }), 400
    
    success = markdown_tracker.add_step(plan_id, step_description, completed)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to add step'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Step added successfully'
    })

@tracking_bp.route('/add-note/<plan_id>', methods=['POST'])
def add_note(plan_id):
    """API endpoint to add a note to the plan."""
    data = request.json
    note = data.get('note')
    
    if not note:
        return jsonify({
            'status': 'error',
            'message': 'Note content is required'
        }), 400
    
    success = markdown_tracker.add_note(plan_id, note)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to add note'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Note added successfully'
    })

@tracking_bp.route('/create/<plan_id>', methods=['POST'])
def create_plan(plan_id):
    """API endpoint to create a new plan from template."""
    data = request.json
    task = data.get('task')
    template = data.get('template')
    
    if not task:
        return jsonify({
            'status': 'error',
            'message': 'Task description is required'
        }), 400
    
    success = markdown_tracker.create_plan_from_template(plan_id, task, template)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to create plan (may already exist)'
        }), 400
    
    return jsonify({
        'status': 'success',
        'message': 'Plan created successfully'
    })

@tracking_bp.route('/update/<plan_id>', methods=['POST'])
def update_plan(plan_id):
    """API endpoint to update the entire content of a plan."""
    data = request.json
    content = data.get('content')
    
    if not content:
        return jsonify({
            'status': 'error',
            'message': 'Plan content is required'
        }), 400
    
    success = markdown_tracker.update_plan_content(plan_id, content)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to update plan'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Plan updated successfully'
    })

@tracking_bp.route('/list', methods=['GET'])
def list_plans():
    """API endpoint to get a list of all plans."""
    plans = markdown_tracker.get_all_plans()
    
    return jsonify({
        'status': 'success',
        'plans': plans
    })

@tracking_bp.route('/progress/<plan_id>', methods=['GET'])
def get_progress(plan_id):
    """API endpoint to get the progress of a plan."""
    progress = markdown_tracker.get_plan_progress(plan_id)
    
    return jsonify({
        'status': 'success',
        'progress': progress
    })
