import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NewTask: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle task submission
  const handleSubmitTask = async () => {
    if (!taskDescription.trim()) {
      setError('Please enter a task description');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/input/submit-task', {
        task: taskDescription
      });
      
      if (response.data.status === 'success') {
        setTaskId(response.data.plan_id);
        setSessionId(response.data.session_id);
        setActiveStep(1);
      } else {
        setError('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setError('An error occurred while creating the task');
    } finally {
      setLoading(false);
    }
  };

  // Handle starting the agent
  const handleStartAgent = async () => {
    if (!taskId || !sessionId) {
      setError('Task information is missing');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/indefinite/start', {
        task: taskDescription,
        plan_id: taskId,
        session_id: sessionId
      });
      
      if (response.data.status === 'success') {
        setActiveStep(2);
      } else {
        setError('Failed to start agent');
      }
    } catch (error) {
      console.error('Error starting agent:', error);
      setError('An error occurred while starting the agent');
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing the task
  const handleViewTask = () => {
    if (taskId) {
      navigate(`/task/${taskId}`);
    }
  };

  // Steps for the task creation process
  const steps = [
    {
      label: 'Describe your task',
      description: 'Provide a detailed description of what you want the AI agent to accomplish.',
      content: (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Task Description"
            multiline
            rows={6}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            fullWidth
            placeholder="Describe your task in detail. Be specific about what you want the agent to accomplish."
            disabled={loading}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmitTask}
              disabled={!taskDescription.trim() || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Task'}
            </Button>
          </Box>
        </Box>
      )
    },
    {
      label: 'Start the agent',
      description: 'Start the AI agent to work on your task indefinitely until completion.',
      content: (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Task created successfully! Task ID: {taskId}
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            Your task has been created. Click the button below to start the AI agent.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleStartAgent}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Start Agent'}
            </Button>
          </Box>
        </Box>
      )
    },
    {
      label: 'Monitor progress',
      description: 'Your agent is now working on the task. You can monitor its progress.',
      content: (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Agent started successfully! The agent will work on your task until completion.
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            You can now monitor the agent's progress and provide feedback if needed.
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleViewTask}
              sx={{ mr: 2 }}
            >
              View Task Progress
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Task
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new task for the AI agent to work on. The agent will run indefinitely until the task is completed.
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                {step.content}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tips for effective tasks
            </Typography>
            <Typography variant="body2" paragraph>
              • Be specific about what you want the agent to accomplish
            </Typography>
            <Typography variant="body2" paragraph>
              • Provide context and background information when relevant
            </Typography>
            <Typography variant="body2" paragraph>
              • Break complex tasks into smaller, manageable parts
            </Typography>
            <Typography variant="body2" paragraph>
              • Specify any constraints or requirements the agent should follow
            </Typography>
            <Typography variant="body2">
              • You can always provide additional feedback once the agent has started
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default NewTask;
