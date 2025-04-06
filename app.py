from utils.performance_optimizer import PerformanceOptimizer
from flask import Flask, render_template, request, jsonify, session
import os
from dotenv import load_dotenv
import uuid
import asyncio

# Import custom modules
from utils.agent_manager import AgentManager
from utils.plan_manager import PlanManager
from utils.markdown_tracker import MarkdownTracker
from utils.plan_updater import PlanUpdater
from utils.handoff_manager import AgentHandoffManager
from utils.computer_tool_manager import RemoteComputerToolManager
from utils.indefinite_runner import IndefiniteAgentRunner

# Import controllers
from controllers.planning_controller import planning_bp
from controllers.tracking_controller import tracking_bp
from controllers.updater_controller import updater_bp
from controllers.handoff_controller import handoff_bp
from controllers.computer_controller import computer_bp
from controllers.input_controller import input_bp
from controllers.indefinite_controller import indefinite_bp

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", os.urandom(24).hex())

# Register blueprints
app.register_blueprint(planning_bp)
app.register_blueprint(tracking_bp)
app.register_blueprint(updater_bp)
app.register_blueprint(handoff_bp)
app.register_blueprint(computer_bp)
app.register_blueprint(input_bp)
app.register_blueprint(indefinite_bp)

# Initialize managers
agent_manager = AgentManager()
plan_manager = PlanManager()
markdown_tracker = MarkdownTracker()
plan_updater = PlanUpdater()
handoff_manager = AgentHandoffManager()
computer_tool_manager = RemoteComputerToolManager()
indefinite_runner = IndefiniteAgentRunner()

# Initialize and apply performance optimizer
performance_optimizer = PerformanceOptimizer()
performance_optimizer.optimize_flask_app(app)
performance_optimizer.optimize_plan_updates(plan_updater)
performance_optimizer.optimize_agent_execution(indefinite_runner)

# Create necessary directories
os.makedirs('plans', exist_ok=True)
os.makedirs('agent_states', exist_ok=True)
os.makedirs('agent_workspace', exist_ok=True)

@app.route('/')
def index():
    """Render the main page of the application."""
    # Generate a new session ID if one doesn't exist
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    return render_template('index.html')

@app.route('/api/health')
def health_check():
    """API endpoint to check the health of the application."""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'components': {
            'planning': 'active',
            'tracking': 'active',
            'updating': 'active',
            'handoff': 'active',
            'computer': 'active',
            'input': 'active',
            'indefinite': 'active'
        }
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
