from flask import Blueprint, request, jsonify
import asyncio
from utils.handoff_manager import AgentHandoffManager

# Initialize handoff manager
handoff_manager = AgentHandoffManager()

# Create blueprint
handoff_bp = Blueprint('handoff', __name__, url_prefix='/api/handoff')

@handoff_bp.route('/create', methods=['POST'])
def create_handoff():
    """API endpoint to create a handoff between agents."""
    data = request.json
    from_agent_id = data.get('from_agent_id')
    to_agent_type = data.get('to_agent_type')
    task = data.get('task')
    plan_id = data.get('plan_id')
    additional_context = data.get('additional_context')
    
    if not all([from_agent_id, to_agent_type, task, plan_id]):
        return jsonify({
            'status': 'error',
            'message': 'Missing required parameters'
        }), 400
    
    # Start async task to create handoff
    handoff_task = asyncio.create_task(
        handoff_manager.create_handoff(
            from_agent_id, 
            to_agent_type, 
            task, 
            plan_id, 
            additional_context
        )
    )
    
    # Get handoff ID (this is a bit of a hack since we're using asyncio in a Flask route)
    try:
        handoff_id = asyncio.run(handoff_task)
    except RuntimeError:
        # If there's already an event loop running
        loop = asyncio.get_event_loop()
        handoff_id = loop.run_until_complete(handoff_task)
    
    return jsonify({
        'status': 'success',
        'message': 'Handoff created successfully',
        'handoff_id': handoff_id
    })

@handoff_bp.route('/execute/<handoff_id>', methods=['POST'])
def execute_handoff(handoff_id):
    """API endpoint to execute a handoff."""
    # Start async task to execute handoff
    asyncio.create_task(handoff_manager.execute_handoff(handoff_id))
    
    return jsonify({
        'status': 'success',
        'message': 'Handoff execution started',
        'handoff_id': handoff_id
    })

@handoff_bp.route('/status/<handoff_id>', methods=['GET'])
def get_handoff_status(handoff_id):
    """API endpoint to get the status of a handoff."""
    context = handoff_manager.get_context(handoff_id)
    
    if context is None:
        return jsonify({
            'status': 'error',
            'message': 'Handoff not found'
        }), 404
    
    # Determine status based on context
    if 'error' in context:
        status = 'error'
        result = {'error': context['error']}
    elif 'result' in context:
        status = 'completed'
        result = context['result']
    else:
        status = 'in_progress'
        result = None
    
    return jsonify({
        'status': 'success',
        'handoff': {
            'handoff_id': handoff_id,
            'from_agent_id': context.get('from_agent_id'),
            'to_agent_type': context.get('to_agent_type'),
            'task': context.get('task'),
            'plan_id': context.get('plan_id'),
            'timestamp': context.get('timestamp'),
            'status': status,
            'result': result
        }
    })

@handoff_bp.route('/list', methods=['GET'])
def list_handoffs():
    """API endpoint to list all handoffs."""
    # This would require additional implementation to list all handoffs
    # For now, return a placeholder
    return jsonify({
        'status': 'error',
        'message': 'Not implemented yet'
    }), 501
