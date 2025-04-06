import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import ReactMarkdown from 'react-markdown';
import { Task, PlanStep } from '../types/Task';
import api from '../services/api';
import TaskStatusBadge from '../components/TaskStatusBadge';
import TaskProgressBar from '../components/TaskProgressBar';
import { formatDate } from '../utils/dateUtils';
import PlanStepsList from '../components/PlanStepsList';
import AgentActionsList from '../components/AgentActionsList';

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  // Fetch task details on component mount and when taskId changes
  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (socket && taskId) {
      socket.on(`task_update_${taskId}`, handleTaskUpdate);
      
      return () => {
        socket.off(`task_update_${taskId}`);
      };
    }
  }, [socket, taskId]);

  // Fetch task details from API
  const fetchTaskDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/planning/get/${taskId}`);
      
      if (response.data.status === 'success') {
        setTask(response.data.plan);
      } else {
        setError('Failed to load task details');
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      setError('An error occurred while loading task details');
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time task updates
  const handleTaskUpdate = (updatedTask: Task) => {
    setTask(updatedTask);
  };

  // Handle step completion toggle
  const handleStepToggle = async (stepIndex: number, completed: boolean) => {
    if (!taskId) return;
    
    try {
      const endpoint = completed 
        ? `/api/tracking/mark-completed/${taskId}/${stepIndex}`
        : `/api/tracking/mark-uncompleted/${taskId}/${stepIndex}`;
        
      await api.post(endpoint);
      fetchTaskDetails(); // Refresh task details
    } catch (error) {
      console.error('Error toggling step completion:', error);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskId || !feedback.trim()) return;
    
    setSubmittingFeedback(true);
    setFeedbackSuccess(false);
    
    try {
      await api.post('/api/input/feedback', {
        session_id: task?.session_id,
        feedback
      });
      
      setFeedbackSuccess(true);
      setFeedback('');
      
      // Refresh task details after a short delay
      setTimeout(fetchTaskDetails, 1000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Control task execution
  const handleResumeTask = async () => {
    if (!taskId) return;
    
    try {
      await api.post(`/api/indefinite/resume/${taskId}`);
      fetchTaskDetails(); // Refresh task details
    } catch (error) {
      console.error('Error resuming task:', error);
    }
  };

  const handlePauseTask = async () => {
    if (!taskId) return;
    
    try {
      await api.post(`/api/indefinite/pause/${taskId}`);
      fetchTaskDetails(); // Refresh task details
    } catch (error) {
      console.error('Error pausing task:', error);
    }
  };

  const handleStopTask = async () => {
    if (!taskId) return;
    
    try {
      await api.post(`/api/indefinite/stop/${taskId}`);
      fetchTaskDetails(); // Refresh task details
    } catch (error) {
      console.error('Error stopping task:', error);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render error state
  if (error || !task) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Task not found'}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  // Determine task status and actions
  const isRunning = task.status === 'running';
  const isPaused = task.status === 'paused';
  const isCompleted = task.status === 'completed';
  const progress = task.progress_percentage || 0;

  return (
    <Container maxWidth="lg">
      {/* Task Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {task.task}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TaskStatusBadge status={task.status} />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Created: {formatDate(task.created_at)}
              </Typography>
              {task.completed_at && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  Completed: {formatDate(task.completed_at)}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/')}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            
            {!isCompleted && (
              <>
                {isRunning ? (
                  <Button 
                    variant="contained" 
                    color="warning"
                    onClick={handlePauseTask}
                    sx={{ mr: 2 }}
                  >
                    Pause
                  </Button>
                ) : isPaused && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleResumeTask}
                    sx={{ mr: 2 }}
                  >
                    Resume
                  </Button>
                )}
                
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={handleStopTask}
                >
                  Stop
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, mb: 4 }}>
          <TaskProgressBar progress={progress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {progress}% Complete
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Plan */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Plan
            </Typography>
            
            {task.steps && task.steps.length > 0 ? (
              <PlanStepsList 
                steps={task.steps} 
                onToggleStep={handleStepToggle}
              />
            ) : (
              <Typography variant="body1" color="text.secondary">
                No plan steps available.
              </Typography>
            )}
          </Paper>
          
          {/* Agent Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Agent Actions
            </Typography>
            
            <AgentActionsList sessionId={task.session_id} />
          </Paper>
        </Grid>
        
        {/* Right Column - Notes and Feedback */}
        <Grid item xs={12} md={5}>
          {/* Task Notes */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Notes
            </Typography>
            
            {task.notes && task.notes.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                <ReactMarkdown>
                  {task.notes}
                </ReactMarkdown>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No notes available.
              </Typography>
            )}
          </Paper>
          
          {/* Feedback Form */}
          {!isCompleted && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Provide Feedback
              </Typography>
              
              <form onSubmit={handleFeedbackSubmit}>
                <TextField
                  label="Your feedback"
                  multiline
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  fullWidth
                  margin="normal"
                  placeholder="Provide feedback, additional information, or change requirements..."
                />
                
                {feedbackSuccess && (
                  <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                    Feedback submitted successfully!
                  </Alert>
                )}
                
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!feedback.trim() || submittingFeedback}
                  sx={{ mt: 2 }}
                >
                  {submittingFeedback ? <CircularProgress size={24} /> : 'Submit Feedback'}
                </Button>
              </form>
            </Paper>
          )}
          
          {/* Connection Status */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Chip 
              label={connected ? 'Real-time updates active' : 'Real-time updates inactive'} 
              color={connected ? 'success' : 'error'} 
              size="small"
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TaskDetail;
