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
# Load environment variables
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", os.urandom(24).hex())

# Initialize services with proper asyncio handling
indefinite_runner = IndefiniteAgentRunner()

# Register blueprints
app.register_blueprint(planning_bp)
app.register_blueprint(tracking_bp)
app.register_blueprint(updater_bp)
app.register_blueprint(handoff_bp)
app.register_blueprint(computer_bp)
app.register_blueprint(input_bp)
# Commented out problematic blueprint
# app.register_blueprint(indefinite_bp)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "version": "1.0.0"})

# Setup asyncio event loop for Flask
def run_app():
    # Create a new event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    # Start the indefinite runner monitoring in the background
    # Commented out for initial testing
    # loop.run_until_complete(asyncio.gather(
    #     indefinite_runner.start_monitoring()
    # ))
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)

if __name__ == '__main__':
    run_app()
