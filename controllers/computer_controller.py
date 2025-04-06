from flask import Blueprint, request, jsonify
import asyncio
from utils.computer_tool_manager import RemoteComputerToolManager

# Initialize computer tool manager
computer_tool_manager = RemoteComputerToolManager()

# Create blueprint
computer_bp = Blueprint('computer', __name__, url_prefix='/api/computer')

@computer_bp.route('/run', methods=['POST'])
def run_agent_with_computer_access():
    """API endpoint to run an agent with computer access."""
    data = request.json
    task = data.get('task')
    plan_id = data.get('plan_id')
    session_id = data.get('session_id')
    
    if not all([task, plan_id, session_id]):
        return jsonify({
            'status': 'error',
            'message': 'Missing required parameters'
        }), 400
    
    # Start async task to run the agent
    asyncio.create_task(computer_tool_manager.run_agent_with_computer_access(
        task, plan_id, session_id
    ))
    
    return jsonify({
        'status': 'success',
        'message': 'Agent with computer access started',
        'session_id': session_id
    })

@computer_bp.route('/workspace/<session_id>/files', methods=['GET'])
def list_workspace_files(session_id):
    """API endpoint to list files in an agent's workspace."""
    workspace_dir = f"{computer_tool_manager.workspace_dir}/{session_id}"
    
    try:
        import os
        file_list = []
        for root, dirs, files in os.walk(workspace_dir):
            for file in files:
                rel_path = os.path.relpath(os.path.join(root, file), workspace_dir)
                file_list.append(rel_path)
        
        return jsonify({
            'status': 'success',
            'files': file_list
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error listing files: {str(e)}'
        }), 500

@computer_bp.route('/workspace/<session_id>/file', methods=['GET'])
def get_workspace_file(session_id):
    """API endpoint to get a file from an agent's workspace."""
    file_path = request.args.get('path')
    
    if not file_path:
        return jsonify({
            'status': 'error',
            'message': 'File path is required'
        }), 400
    
    full_path = f"{computer_tool_manager.workspace_dir}/{session_id}/{file_path}"
    
    try:
        with open(full_path, 'r') as f:
            content = f.read()
        
        return jsonify({
            'status': 'success',
            'content': content
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error reading file: {str(e)}'
        }), 500

@computer_bp.route('/workspace/<session_id>/logs', methods=['GET'])
def get_workspace_logs(session_id):
    """API endpoint to get logs for an agent's workspace."""
    log_path = f"{computer_tool_manager.log_dir}/{session_id}_script_log.jsonl"
    
    try:
        import json
        logs = []
        
        if os.path.exists(log_path):
            with open(log_path, 'r') as f:
                for line in f:
                    logs.append(json.loads(line))
        
        return jsonify({
            'status': 'success',
            'logs': logs
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error reading logs: {str(e)}'
        }), 500
