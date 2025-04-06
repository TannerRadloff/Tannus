# Tannus - AI Agents Webapp

Tannus is a powerful AI agents webapp that allows AI agents to run indefinitely to complete complex tasks. The application features a robust planning system where agents create and maintain plans in markdown format, track progress by checking off completed steps, and update plans as goals change or challenges arise.

![Tannus AI Agents Webapp](https://via.placeholder.com/1200x600?text=Tannus+AI+Agents+Webapp)

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
- **Deployment**: Cloudflare Pages, Workers, and D1 database

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/TannerRadloff/Tannus.git
cd Tannus
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

## Deployment

### Cloudflare Deployment

To deploy the application to Cloudflare:

1. Make sure you have a Cloudflare account
2. Run the deployment script:
```bash
./deploy_all.sh
```

3. Follow the prompts to configure your custom domain and monitoring preferences

Once complete, your application will be available at:
- Frontend: https://ai-agents-webapp.pages.dev
- API: https://ai-agents-webapp-worker.workers.dev
- Custom domain (if configured): https://your-domain.com

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

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for the Agents SDK
- Cloudflare for hosting infrastructure
- Material UI for frontend components
