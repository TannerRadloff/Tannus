import socketio
from flask import Flask, request, jsonify, session
from flask_socketio import SocketIO, emit

class WebSocketManager:
    """
    Manages WebSocket connections and real-time updates for the AI Agents Webapp.
    Provides functionality for emitting events to clients and handling client events.
    """
    
    def __init__(self, app=None):
        """Initialize the WebSocketManager."""
        self.socketio = None
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the WebSocketManager with a Flask app."""
        self.socketio = SocketIO(
            app, 
            cors_allowed_origins="*",
            async_mode='gevent',
            logger=True,
            engineio_logger=True
        )
        self._register_handlers()
    
    def _register_handlers(self):
        """Register WebSocket event handlers."""
        @self.socketio.on('connect')
        def handle_connect():
            """Handle client connection."""
            client_id = request.sid
            print(f"Client connected: {client_id}")
            emit('connection_status', {'status': 'connected', 'client_id': client_id})
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection."""
            client_id = request.sid
            print(f"Client disconnected: {client_id}")
        
        @self.socketio.on('subscribe_to_task')
        def handle_subscribe_to_task(data):
            """
            Handle client subscription to task updates.
            
            Args:
                data (dict): Contains task_id to subscribe to
            """
            task_id = data.get('task_id')
            client_id = request.sid
            
            if task_id:
                print(f"Client {client_id} subscribed to task {task_id}")
                # Join a room specific to this task
                self.socketio.server.enter_room(client_id, f"task_{task_id}")
                emit('subscription_status', {
                    'status': 'subscribed',
                    'task_id': task_id
                })
        
        @self.socketio.on('unsubscribe_from_task')
        def handle_unsubscribe_from_task(data):
            """
            Handle client unsubscription from task updates.
            
            Args:
                data (dict): Contains task_id to unsubscribe from
            """
            task_id = data.get('task_id')
            client_id = request.sid
            
            if task_id:
                print(f"Client {client_id} unsubscribed from task {task_id}")
                # Leave the room specific to this task
                self.socketio.server.leave_room(client_id, f"task_{task_id}")
                emit('subscription_status', {
                    'status': 'unsubscribed',
                    'task_id': task_id
                })
    
    def emit_task_update(self, task_id, task_data):
        """
        Emit a task update event to all clients subscribed to the task.
        
        Args:
            task_id (str): ID of the task that was updated
            task_data (dict): Updated task data
        """
        if self.socketio:
            # Emit to the task-specific room
            self.socketio.emit('task_update', task_data, room=f"task_{task_id}")
            # Also emit to a specific event for this task
            self.socketio.emit(f'task_update_{task_id}', task_data)
            # Emit a general task update event
            self.socketio.emit('task_update', task_data)
    
    def emit_task_completed(self, task_id, task_data):
        """
        Emit a task completed event to all clients.
        
        Args:
            task_id (str): ID of the task that was completed
            task_data (dict): Completed task data
        """
        if self.socketio:
            # Emit to the task-specific room
            self.socketio.emit('task_completed', task_data, room=f"task_{task_id}")
            # Also emit to a specific event for this task
            self.socketio.emit(f'task_completed_{task_id}', task_data)
            # Emit a general task completed event
            self.socketio.emit('task_completed', task_data)
    
    def emit_plan_updated(self, plan_id, plan_data):
        """
        Emit a plan updated event to all clients.
        
        Args:
            plan_id (str): ID of the plan that was updated
            plan_data (dict): Updated plan data
        """
        if self.socketio:
            # Emit to the plan-specific room
            self.socketio.emit('plan_updated', plan_data, room=f"plan_{plan_id}")
            # Also emit to a specific event for this plan
            self.socketio.emit(f'plan_updated_{plan_id}', plan_data)
            # Emit a general plan updated event
            self.socketio.emit('plan_updated', plan_data)
    
    def emit_step_completed(self, plan_id, step_index, step_data):
        """
        Emit a step completed event to all clients.
        
        Args:
            plan_id (str): ID of the plan containing the step
            step_index (int): Index of the step that was completed
            step_data (dict): Step data
        """
        if self.socketio:
            event_data = {
                'plan_id': plan_id,
                'step_index': step_index,
                'step_data': step_data
            }
            # Emit to the plan-specific room
            self.socketio.emit('step_completed', event_data, room=f"plan_{plan_id}")
            # Also emit to a specific event for this plan
            self.socketio.emit(f'step_completed_{plan_id}', event_data)
    
    def emit_agent_status_update(self, session_id, status_data):
        """
        Emit an agent status update event to all clients.
        
        Args:
            session_id (str): ID of the agent session
            status_data (dict): Status data
        """
        if self.socketio:
            # Emit to the session-specific room
            self.socketio.emit('agent_status_update', status_data, room=f"session_{session_id}")
            # Also emit to a specific event for this session
            self.socketio.emit(f'agent_status_update_{session_id}', status_data)
            # Emit a general agent status update event
            self.socketio.emit('agent_status_update', status_data)
    
    def emit_agent_action(self, session_id, action_data):
        """
        Emit an agent action event to all clients.
        
        Args:
            session_id (str): ID of the agent session
            action_data (dict): Action data
        """
        if self.socketio:
            # Emit to the session-specific room
            self.socketio.emit('agent_action', action_data, room=f"session_{session_id}")
            # Also emit to a specific event for this session
            self.socketio.emit(f'agent_action_{session_id}', action_data)
    
    def emit_error(self, error_data):
        """
        Emit an error event to all clients.
        
        Args:
            error_data (dict): Error data
        """
        if self.socketio:
            self.socketio.emit('error', error_data)
    
    def run(self, app, host='0.0.0.0', port=5000, debug=False):
        """
        Run the Flask app with SocketIO.
        
        Args:
            app: Flask application
            host (str): Host to run on
            port (int): Port to run on
            debug (bool): Whether to run in debug mode
        """
        if self.socketio:
            self.socketio.run(app, host=host, port=port, debug=debug)
