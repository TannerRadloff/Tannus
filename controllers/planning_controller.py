from flask import Blueprint, request, jsonify, session
import uuid
from models.planning_system import PlanningSystem
from models.planning_agent import PlanningAgent
import asyncio

# Initialize planning system and agent
planning_system = PlanningSystem()
planning_agent = PlanningAgent(planning_system)

# Create blueprint
planning_bp = Blueprint('planning', __name__, url_prefix='/api/planning')

@planning_bp.route('/create', methods=['POST'])
def create_plan():
    """API endpoint to create a new plan for a task."""
    data = request.json
    task = data.get('task')
    
    if not task:
        return jsonify({
            'status': 'error',
            'message': 'Task description is required'
        }), 400
    
    # Get or create session ID
    session_id = session.get('session_id', str(uuid.uuid4()))
    if 'session_id' not in session:
        session['session_id'] = session_id
    
    # Create initial plan
    plan_id = planning_system.create_initial_plan(task, session_id)
    
    # Start async task to improve the plan using AI
    asyncio.create_task(planning_agent.create_plan_for_task(task, session_id))
    
    return jsonify({
        'status': 'success',
        'message': 'Plan creation started',
        'plan_id': plan_id
    })

@planning_bp.route('/get/<plan_id>', methods=['GET'])
def get_plan(plan_id):
    """API endpoint to get a plan by ID."""
    plan = planning_system.get_plan(plan_id)
    
    if "error" in plan:
        return jsonify({
            'status': 'error',
            'message': plan["error"]
        }), 404
    
    return jsonify({
        'status': 'success',
        'plan': plan
    })

@planning_bp.route('/update/<plan_id>', methods=['POST'])
def update_plan(plan_id):
    """API endpoint to update a plan."""
    data = request.json
    updates = data.get('updates', {})
    
    if not updates:
        return jsonify({
            'status': 'error',
            'message': 'No updates provided'
        }), 400
    
    success = planning_system.update_plan(plan_id, updates)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to update plan'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Plan updated successfully'
    })

@planning_bp.route('/analyze/<plan_id>', methods=['GET'])
def analyze_plan(plan_id):
    """API endpoint to analyze plan progress."""
    analysis = planning_system.analyze_plan_progress(plan_id)
    
    if "error" in analysis:
        return jsonify({
            'status': 'error',
            'message': analysis["error"]
        }), 404
    
    return jsonify({
        'status': 'success',
        'analysis': analysis
    })

@planning_bp.route('/update-for-changes/<plan_id>', methods=['POST'])
def update_plan_for_changes(plan_id):
    """API endpoint to update a plan based on changes in requirements."""
    data = request.json
    changes_description = data.get('changes_description')
    
    if not changes_description:
        return jsonify({
            'status': 'error',
            'message': 'Changes description is required'
        }), 400
    
    # Start async task to update the plan using AI
    asyncio.create_task(planning_agent.update_plan_for_changes(plan_id, changes_description))
    
    return jsonify({
        'status': 'success',
        'message': 'Plan update started'
    })
