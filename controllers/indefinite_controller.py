from flask import Blueprint, request, jsonify
import asyncio
from utils.indefinite_runner import IndefiniteAgentRunner

# Initialize indefinite runner
indefinite_runner = IndefiniteAgentRunner()

# Create blueprint
indefinite_bp = Blueprint('indefinite', __name__, url_prefix='/api/indefinite')

@indefinite_bp.route('/start', methods=['POST'])
def start_indefinite_agent():
    """API endpoint to start an agent that runs indefinitely."""
    data = request.json
    task = data.get('task')
    plan_id = data.get('plan_id')
    session_id = data.get('session_id')
    
    if not all([task, plan_id, session_id]):
        return jsonify({
            'status': 'error',
            'message': 'Missing required parameters'
        }), 400
    
    # Start async task to run the agent indefinitely
    asyncio.create_task(indefinite_runner.start_indefinite_agent(
        task, plan_id, session_id
    ))
    
    return jsonify({
        'status': 'success',
        'message': 'Indefinite agent started',
        'session_id': session_id
    })

@indefinite_bp.route('/status/<session_id>', methods=['GET'])
def get_agent_status(session_id):
    """API endpoint to get the status of an indefinite agent."""
    status = indefinite_runner.get_agent_status(session_id)
    
    return jsonify({
        'status': 'success',
        'agent_status': status
    })

@indefinite_bp.route('/pause/<session_id>', methods=['POST'])
def pause_agent(session_id):
    """API endpoint to pause an indefinite agent."""
    success = indefinite_runner.pause_agent(session_id)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to pause agent'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Agent paused successfully'
    })

@indefinite_bp.route('/resume/<session_id>', methods=['POST'])
def resume_agent(session_id):
    """API endpoint to resume a paused indefinite agent."""
    success = indefinite_runner.resume_agent(session_id)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to resume agent'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Agent resumed successfully'
    })

@indefinite_bp.route('/stop/<session_id>', methods=['POST'])
def stop_agent(session_id):
    """API endpoint to stop an indefinite agent."""
    success = indefinite_runner.stop_agent(session_id)
    
    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to stop agent'
        }), 404
    
    return jsonify({
        'status': 'success',
        'message': 'Agent stopped successfully'
    })
