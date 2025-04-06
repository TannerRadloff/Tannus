# AI Agents Webapp Documentation

## Overview

The AI Agents Webapp is a powerful application that allows AI agents to run indefinitely to complete complex tasks. The application features a robust planning system where agents create and maintain plans in markdown format, track progress by checking off completed steps, and update plans as goals change or challenges arise.

## Key Features

- **AI Agent Planning System**: Agents create structured plans for completing complex tasks
- **Markdown Plan Tracking**: Plans are stored as markdown files with checkboxes for tracking progress
- **Plan Updating Mechanism**: Agents can update plans as goals change or challenges arise
- **Agent Handoff with Context Preservation**: Agents can delegate tasks while maintaining context
- **Remote Computer Tool Access**: Agents can interact with the system to complete tasks
- **Indefinite Agent Running**: Agents can run until tasks are completed with checkpointing
- **Real-time Updates**: WebSocket integration for live updates of agent progress
- **Modern React UI**: Responsive design with Material UI components
- **Dark Mode Support**: Complete theming system with system preference detection
- **Visualization Tools**: Charts and graphs for monitoring agent progress

## Architecture

The application follows a modular architecture with dependency injection for better testability and maintenance:

- **Frontend**: React with TypeScript, Material UI, and WebSockets
- **Backend**: Node.js with Express, WebSockets, and OpenAI SDK
- **Data Storage**: File-based storage for plans and agent state

### Component Structure

```
ai_agents_webapp/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React context providers
│   │   ├── pages/           # Page components
│   │   └── utils/           # Frontend utilities
├── controllers/             # API controllers
├── models/                  # Data models and types
├── services/                # Core services
├── utils/                   # Utility classes
├── interfaces/              # TypeScript interfaces
├── config/                  # Configuration management
└── tests/                   # Unit and integration tests
```

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai_agents_webapp.git
cd ai_agents_webapp
```

2. Install dependencies:
```bash
./setup.sh
```

3. Configure your OpenAI API key in the `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

4. Start the application:
```bash
./start.sh
```

5. Access the webapp at: http://localhost:5000

## Usage

### Creating a New Task

1. Navigate to the "New Task" page
2. Enter your task description in the input field
3. Click "Submit Task"
4. The agent will create a plan and begin working on the task

### Monitoring Task Progress

1. Navigate to the "Dashboard" page to see all tasks
2. Click on a task to view its details
3. The plan will be displayed with checkboxes showing completed steps
4. Real-time updates will show agent progress

### Viewing Agent Actions

1. On the task detail page, the "Agent Actions" tab shows all actions taken
2. The "Logs" tab provides detailed information about agent operations
3. The "Performance" tab shows charts of agent performance metrics

### Managing Tasks

1. Use the "Pause" button to temporarily halt agent execution
2. Use the "Resume" button to continue execution
3. Use the "Stop" button to permanently stop the agent

## Configuration

The application can be configured through environment variables or the `config.json` file:

### Server Configuration

```json
{
  "server": {
    "port": 5000,
    "host": "0.0.0.0",
    "environment": "development"
  }
}
```

### OpenAI Configuration

```json
{
  "openai": {
    "defaultModel": "gpt-4o",
    "defaultTemperature": 0.7,
    "defaultMaxTokens": 2000
  }
}
```

### Agent Configuration

```json
{
  "agent": {
    "enablePlanCreation": true,
    "enableIndefiniteRunning": true,
    "defaultCheckpointInterval": 300000,
    "maxRuntime": 3600000
  }
}
```

## API Reference

The application provides a RESTful API for interacting with agents and plans:

### Plans API

- `GET /api/plans` - List all plans
- `GET /api/plans/:id` - Get a specific plan
- `POST /api/plans` - Create a new plan
- `PUT /api/plans/:id` - Update a plan
- `DELETE /api/plans/:id` - Delete a plan

### Agents API

- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get a specific agent
- `POST /api/agents` - Create a new agent
- `POST /api/agents/:id/run` - Run an agent
- `POST /api/agents/:id/stop` - Stop an agent
- `POST /api/agents/:id/pause` - Pause an agent
- `POST /api/agents/:id/resume` - Resume an agent

### Tasks API

- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Submit a new task
- `DELETE /api/tasks/:id` - Delete a task

## WebSocket Events

The application uses WebSockets for real-time updates:

- `plan:updated` - Emitted when a plan is updated
- `agent:status` - Emitted when an agent's status changes
- `task:progress` - Emitted when task progress changes
- `agent:action` - Emitted when an agent performs an action

## Development

### Running in Development Mode

```bash
./debug.sh
```

### Running Tests

```bash
./run_tests.sh
```

### Building for Production

```bash
./deploy.sh
```

## Deployment

### Traditional Deployment

1. Build the application:
```bash
./deploy.sh
```

2. Start with production settings:
```bash
NODE_ENV=production ./start.sh
```

### Docker Deployment

1. Build and run with Docker:
```bash
./docker_deploy.sh
```

## Recent Improvements

The application has recently undergone significant improvements:

### UI Improvements
- **Modern React Frontend**: Replaced vanilla JavaScript with React, TypeScript, and Material UI
- **Real-time Updates**: Added WebSockets for live updates of agent progress
- **Enhanced Responsive Design**: Improved mobile experience with better touch interactions
- **Visualization Tools**: Added charts for monitoring agent progress and plan completion
- **Dark Mode Support**: Implemented theme switching with system preference detection

### Code Improvements
- **Modular Architecture**: Refactored to dependency injection pattern for better testability
- **Standardized Async Patterns**: Added AsyncHandler utility for consistent error handling
- **Type Annotations**: Added TypeScript interfaces for all data structures and APIs
- **Centralized Configuration**: Implemented robust configuration system with validation
- **Standardized API Responses**: Created consistent API response format with proper error handling

## Troubleshooting

### Common Issues

1. **Agent not starting**: Check your OpenAI API key and quota
2. **WebSocket connection failing**: Ensure your firewall allows WebSocket connections
3. **UI not updating**: Clear browser cache or try a different browser

### Logs

Logs are stored in the `logs` directory and can be useful for diagnosing issues:

```bash
tail -f logs/app.log
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
