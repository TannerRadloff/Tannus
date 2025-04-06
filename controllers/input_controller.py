from flask import Blueprint, request, jsonify, session
import uuid
import json
from utils.agent_manager import AgentManager
from utils.plan_manager import PlanManager
from models.planning_system import PlanningSystem
from models.planning_agent import PlanningAgent

# Initialize managers
agent_manager = AgentManager()
plan_manager = PlanManager()
planning_system = PlanningSystem()
planning_agent = PlanningAgent(planning_system)

# Create blueprint
input_bp = Blueprint('input', __name__, url_prefix='/api/input')

@input_bp.route('/submit-task', methods=['POST'])
def submit_task():
    """API endpoint to submit a new task to the agent."""
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
    
    # Create a new plan for the task
    plan_id = planning_system.create_initial_plan(task, session_id)
    
    # Start the agent with the task and plan
    agent_manager.start_agent(task, plan_id, session_id)
    
    return jsonify({
        'status': 'success',
        'message': 'Task submitted successfully',
        'plan_id': plan_id,
        'session_id': session_id
    })

@input_bp.route('/continue-task', methods=['POST'])
def continue_task():
    """API endpoint to continue an existing task with new input."""
    data = request.json
    session_id = data.get('session_id')
    new_input = data.get('input')
    
    if not session_id or not new_input:
        return jsonify({
            'status': 'error',
            'message': 'Session ID and input are required'
        }), 400
    
    # Continue the agent with new input
    success = agent_manager.continue_agent(session_id, new_input)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to continue task. Agent may not exist or task may be completed.'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Task continued successfully'
    })

@input_bp.route('/update-plan', methods=['POST'])
def update_plan():
    """API endpoint to update a plan based on user input."""
    data = request.json
    plan_id = data.get('plan_id')
    updates = data.get('updates')
    
    if not plan_id or not updates:
        return jsonify({
            'status': 'error',
            'message': 'Plan ID and updates are required'
        }), 400
    
    # Update the plan
    success = plan_manager.update_plan(plan_id, updates)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to update plan'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Plan updated successfully'
    })

@input_bp.route('/change-goal', methods=['POST'])
def change_goal():
    """API endpoint to change the goal of an existing task."""
    data = request.json
    plan_id = data.get('plan_id')
    new_goal = data.get('new_goal')
    
    if not plan_id or not new_goal:
        return jsonify({
            'status': 'error',
            'message': 'Plan ID and new goal are required'
        }), 400
    
    # Get the current plan
    plan_data = planning_system.get_plan(plan_id)
    if "error" in plan_data:
        return jsonify({
            'status': 'error',
            'message': plan_data["error"]
        }), 404
    
    # Update the plan with the new goal
    from utils.plan_updater import PlanUpdater
    plan_updater = PlanUpdater()
    
    # Start async task to update the plan
    import asyncio
    asyncio.create_task(plan_updater.update_plan_for_goal_change(plan_id, new_goal))
    
    return jsonify({
        'status': 'success',
        'message': 'Goal change initiated'
    })

@input_bp.route('/add-challenge', methods=['POST'])
def add_challenge():
    """API endpoint to add a challenge to an existing task."""
    data = request.json
    plan_id = data.get('plan_id')
    challenge = data.get('challenge')
    
    if not plan_id or not challenge:
        return jsonify({
            'status': 'error',
            'message': 'Plan ID and challenge description are required'
        }), 400
    
    # Update the plan to address the challenge
    from utils.plan_updater import PlanUpdater
    plan_updater = PlanUpdater()
    
    # Start async task to update the plan
    import asyncio
    asyncio.create_task(plan_updater.update_plan_for_challenges(plan_id, challenge))
    
    return jsonify({
        'status': 'success',
        'message': 'Challenge added to plan'
    })

@input_bp.route('/feedback', methods=['POST'])
def provide_feedback():
    """API endpoint to provide feedback on agent progress."""
    data = request.json
    session_id = data.get('session_id')
    feedback = data.get('feedback')
    
    if not session_id or not feedback:
        return jsonify({
            'status': 'error',
            'message': 'Session ID and feedback are required'
        }), 400
    
    # Get the current status
    status = agent_manager.get_status(session_id)
    
    if status.get('status') == 'not_found':
        return jsonify({
            'status': 'error',
            'message': 'Agent not found'
        }), 404
    
    # Add feedback to the agent's context
    plan_id = status.get('plan_id')
    if plan_id:
        # Add a note to the plan
        plan_manager.add_note(plan_id, f"User feedback: {feedback}")
        
        # Continue the agent with the feedback
        agent_manager.continue_agent(session_id, f"User provided feedback: {feedback}")
    
    return jsonify({
        'status': 'success',
        'message': 'Feedback provided successfully'
    })

@input_bp.route('/stop-agent', methods=['POST'])
def stop_agent():
    """API endpoint to stop an agent."""
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({
            'status': 'error',
            'message': 'Session ID is required'
        }), 400
    
    # This would require additional implementation to stop an agent
    # For now, return a placeholder
    return jsonify({
        'status': 'success',
        'message': 'Agent stop requested'
    })
