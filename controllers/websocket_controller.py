from flask import Flask, Blueprint, request, jsonify
from flask_socketio import emit
from utils.websocket_manager import WebSocketManager

# Create blueprint for WebSocket controller
websocket_bp = Blueprint('websocket', __name__)

# Initialize WebSocket manager
websocket_manager = WebSocketManager()

def init_websocket(app):
    """Initialize WebSocket manager with the Flask app."""
    websocket_manager.init_app(app)
    app.register_blueprint(websocket_bp)

@websocket_bp.route('/api/websocket/status', methods=['GET'])
def get_websocket_status():
    """Get the status of the WebSocket connection."""
    return jsonify({
        'status': 'success',
        'websocket_enabled': True,
        'message': 'WebSocket server is running'
    })

@websocket_bp.route('/api/websocket/emit-task-update', methods=['POST'])
def emit_task_update():
    """
    Emit a task update event to all clients.
    This endpoint is for internal use by other controllers.
    """
    data = request.json
    task_id = data.get('task_id')
    task_data = data.get('task_data')
    
    if not task_id or not task_data:
        return jsonify({
            'status': 'error',
            'message': 'Missing task_id or task_data'
        }), 400
    
    websocket_manager.emit_task_update(task_id, task_data)
    
    return jsonify({
        'status': 'success',
        'message': f'Task update event emitted for task {task_id}'
    })

@websocket_bp.route('/api/websocket/emit-task-completed', methods=['POST'])
def emit_task_completed():
    """
    Emit a task completed event to all clients.
    This endpoint is for internal use by other controllers.
    """
    data = request.json
    task_id = data.get('task_id')
    task_data = data.get('task_data')
    
    if not task_id or not task_data:
        return jsonify({
            'status': 'error',
            'message': 'Missing task_id or task_data'
        }), 400
    
    websocket_manager.emit_task_completed(task_id, task_data)
    
    return jsonify({
        'status': 'success',
        'message': f'Task completed event emitted for task {task_id}'
    })

@websocket_bp.route('/api/websocket/emit-plan-updated', methods=['POST'])
def emit_plan_updated():
    """
    Emit a plan updated event to all clients.
    This endpoint is for internal use by other controllers.
    """
    data = request.json
    plan_id = data.get('plan_id')
    plan_data = data.get('plan_data')
    
    if not plan_id or not plan_data:
        return jsonify({
            'status': 'error',
            'message': 'Missing plan_id or plan_data'
        }), 400
    
    websocket_manager.emit_plan_updated(plan_id, plan_data)
    
    return jsonify({
        'status': 'success',
        'message': f'Plan updated event emitted for plan {plan_id}'
    })

@websocket_bp.route('/api/websocket/emit-step-completed', methods=['POST'])
def emit_step_completed():
    """
    Emit a step completed event to all clients.
    This endpoint is for internal use by other controllers.
    """
    data = request.json
    plan_id = data.get('plan_id')
    step_index = data.get('step_index')
    step_data = data.get('step_data')
    
    if not plan_id or step_index is None or not step_data:
        return jsonify({
            'status': 'error',
            'message': 'Missing plan_id, step_index, or step_data'
        }), 400
    
    websocket_manager.emit_step_completed(plan_id, step_index, step_data)
    
    return jsonify({
        'status': 'success',
        'message': f'Step completed event emitted for plan {plan_id}, step {step_index}'
    })

@websocket_bp.route('/api/websocket/emit-agent-status-update', methods=['POST'])
def emit_agent_status_update():
    """
    Emit an agent status update event to all clients.
    This endpoint is for internal use by other controllers.
    """
    data = request.json
    session_id = data.get('session_id')
    status_data = data.get('status_data')
    
    if not session_id or not status_data:
        return jsonify({
            'status': 'error',
            'message': 'Missing session_id or status_data'
        }), 400
    
    websocket_manager.emit_agent_status_update(session_id, status_data)
    
    return jsonify({
        'status': 'success',
        'message': f'Agent status update event emitted for session {session_id}'
    })

@websocket_bp.route('/api/websocket/emit-agent-action', methods=['POST'])
def emit_agent_action():
    """
    Emit an agent action event to all clients.
    This endpoint is for internal use by other controllers.
    """
    data = request.json
    session_id = data.get('session_id')
    action_data = data.get('action_data')
    
    if not session_id or not action_data:
        return jsonify({
            'status': 'error',
            'message': 'Missing session_id or action_data'
        }), 400
    
    websocket_manager.emit_agent_action(session_id, action_data)
    
    return jsonify({
        'status': 'success',
        'message': f'Agent action event emitted for session {session_id}'
    })

@websocket_bp.route('/api/websocket/emit-error', methods=['POST'])
def emit_error():
    """
    Emit an error event to all clients.
    This endpoint is for internal use by other controllers.
    """
    data = request.json
    error_data = data.get('error_data')
    
    if not error_data:
        return jsonify({
            'status': 'error',
            'message': 'Missing error_data'
        }), 400
    
    websocket_manager.emit_error(error_data)
    
    return jsonify({
        'status': 'success',
        'message': 'Error event emitted'
    })
