from flask import Blueprint, request, jsonify
import asyncio
from utils.plan_updater import PlanUpdater

# Initialize plan updater
plan_updater = PlanUpdater()

# Create blueprint
updater_bp = Blueprint('updater', __name__, url_prefix='/api/updater')

@updater_bp.route('/mark-completed/<plan_id>', methods=['POST'])
def mark_step_completed(plan_id):
    """API endpoint to mark a step as completed by description."""
    data = request.json
    step_description = data.get('step_description')
    
    if not step_description:
        return jsonify({
            'status': 'error',
            'message': 'Step description is required'
        }), 400
    
    success = plan_updater.mark_step_completed(plan_id, step_description)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to mark step as completed'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Step marked as completed'
    })

@updater_bp.route('/add-steps/<plan_id>', methods=['POST'])
def add_steps_based_on_progress(plan_id):
    """API endpoint to add new steps based on progress description."""
    data = request.json
    progress_description = data.get('progress_description')
    
    if not progress_description:
        return jsonify({
            'status': 'error',
            'message': 'Progress description is required'
        }), 400
    
    # Start async task to update the plan
    asyncio.create_task(plan_updater.add_steps_based_on_progress(plan_id, progress_description))
    
    return jsonify({
        'status': 'success',
        'message': 'Plan update started'
    })

@updater_bp.route('/update-for-challenges/<plan_id>', methods=['POST'])
def update_plan_for_challenges(plan_id):
    """API endpoint to update plan for challenges encountered."""
    data = request.json
    challenge_description = data.get('challenge_description')
    
    if not challenge_description:
        return jsonify({
            'status': 'error',
            'message': 'Challenge description is required'
        }), 400
    
    # Start async task to update the plan
    asyncio.create_task(plan_updater.update_plan_for_challenges(plan_id, challenge_description))
    
    return jsonify({
        'status': 'success',
        'message': 'Plan update started'
    })

@updater_bp.route('/update-for-goal-change/<plan_id>', methods=['POST'])
def update_plan_for_goal_change(plan_id):
    """API endpoint to update plan for goal changes."""
    data = request.json
    new_goal_description = data.get('new_goal_description')
    
    if not new_goal_description:
        return jsonify({
            'status': 'error',
            'message': 'New goal description is required'
        }), 400
    
    # Start async task to update the plan
    asyncio.create_task(plan_updater.update_plan_for_goal_change(plan_id, new_goal_description))
    
    return jsonify({
        'status': 'success',
        'message': 'Plan update started'
    })

@updater_bp.route('/reorganize/<plan_id>', methods=['POST'])
def reorganize_plan_steps(plan_id):
    """API endpoint to reorganize plan steps."""
    # Start async task to reorganize the plan
    asyncio.create_task(plan_updater.reorganize_plan_steps(plan_id))
    
    return jsonify({
        'status': 'success',
        'message': 'Plan reorganization started'
    })

@updater_bp.route('/simplify/<plan_id>', methods=['POST'])
def simplify_plan(plan_id):
    """API endpoint to simplify a complex plan."""
    # Start async task to simplify the plan
    asyncio.create_task(plan_updater.simplify_plan(plan_id))
    
    return jsonify({
        'status': 'success',
        'message': 'Plan simplification started'
    })

@updater_bp.route('/expand/<plan_id>', methods=['POST'])
def expand_plan_detail(plan_id):
    """API endpoint to expand a plan with more detailed steps."""
    # Start async task to expand the plan
    asyncio.create_task(plan_updater.expand_plan_detail(plan_id))
    
    return jsonify({
        'status': 'success',
        'message': 'Plan expansion started'
    })
