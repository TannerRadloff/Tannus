import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  LinearProgress, 
  Box, 
  Chip,
  Skeleton,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import TaskStatusBadge from '../components/TaskStatusBadge';
import TaskProgressBar from '../components/TaskProgressBar';
import { formatDate } from '../utils/dateUtils';
import { Task } from '../types/Task';
import api from '../services/api';
import Grid from '../components/Grid';

const Dashboard: React.FC = () => {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('task_update', handleTaskUpdate);
      socket.on('task_completed', handleTaskCompleted);
      
      return () => {
        socket.off('task_update');
        socket.off('task_completed');
      };
    }
  }, [socket]);

  // Fetch all tasks from the API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const activeResponse = await api.get('/api/planning/list?status=active');
      const completedResponse = await api.get('/api/planning/list?status=completed');
      
      setActiveTasks(activeResponse.data.plans || []);
      setCompletedTasks(completedResponse.data.plans || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time task updates
  const handleTaskUpdate = (updatedTask: Task) => {
    setActiveTasks(prev => 
      prev.map(task => 
        task.plan_id === updatedTask.plan_id ? updatedTask : task
      )
    );
  };

  // Handle task completion
  const handleTaskCompleted = (completedTask: Task) => {
    // Remove from active tasks
    setActiveTasks(prev => 
      prev.filter(task => task.plan_id !== completedTask.plan_id)
    );
    
    // Add to completed tasks
    setCompletedTasks(prev => [completedTask, ...prev]);
  };

  // Navigate to task detail page
  const handleViewTask = (taskId: string) => {
    navigate(`/task/${taskId}`);
  };

  // Control task execution
  const handleStartTask = async (taskId: string) => {
    try {
      await api.post(`/api/indefinite/resume/${taskId}`);
      fetchTasks(); // Refresh task list
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handlePauseTask = async (taskId: string) => {
    try {
      await api.post(`/api/indefinite/pause/${taskId}`);
      fetchTasks(); // Refresh task list
    } catch (error) {
      console.error('Error pausing task:', error);
    }
  };

  const handleStopTask = async (taskId: string) => {
    try {
      await api.post(`/api/indefinite/stop/${taskId}`);
      fetchTasks(); // Refresh task list
    } catch (error) {
      console.error('Error stopping task:', error);
    }
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Grid item xs={12} md={6} lg={4} key={`skeleton-${index}`}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="40%" height={24} />
            <Box sx={{ mt: 2, mb: 1 }}>
              <Skeleton variant="rectangular" height={8} />
            </Box>
            <Skeleton variant="text" width="30%" height={24} />
          </CardContent>
          <CardActions>
            <Skeleton variant="rectangular" width={80} height={36} />
            <Skeleton variant="rectangular" width={80} height={36} sx={{ ml: 1 }} />
          </CardActions>
        </Card>
      </Grid>
    ));
  };

  // Render task cards
  const renderTaskCard = (task: Task) => {
    const isRunning = task.status === 'running';
    const isPaused = task.status === 'paused';
    
    return (
      <Grid item xs={12} md={6} lg={4} key={task.plan_id}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" component="h2" noWrap title={task.task}>
                {task.task}
              </Typography>
              <TaskStatusBadge status={task.status} />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Created: {formatDate(task.created_at)}
            </Typography>
            
            <Box sx={{ mt: 2, mb: 1 }}>
              <TaskProgressBar progress={task.progress_percentage || 0} />
            </Box>
            
            <Typography variant="body2">
              {task.progress_percentage || 0}% Complete
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<ViewIcon />}
              onClick={() => handleViewTask(task.plan_id)}
            >
              View
            </Button>
            
            {isRunning && (
              <Tooltip title="Pause">
                <IconButton 
                  color="primary" 
                  onClick={() => handlePauseTask(task.plan_id)}
                  size="small"
                >
                  <PauseIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {isPaused && (
              <Tooltip title="Resume">
                <IconButton 
                  color="primary" 
                  onClick={() => handleStartTask(task.plan_id)}
                  size="small"
                >
                  <StartIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Stop">
              <IconButton 
                color="error" 
                onClick={() => handleStopTask(task.plan_id)}
                size="small"
              >
                <StopIcon />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip 
            label={connected ? 'Connected' : 'Disconnected'} 
            color={connected ? 'success' : 'error'} 
            size="small"
            sx={{ mr: 2 }}
          />
          
          <Button 
            variant="contained" 
            onClick={() => navigate('/new-task')}
            sx={{ mr: 2 }}
          >
            New Task
          </Button>
          
          <Tooltip title="Refresh">
            <IconButton onClick={fetchTasks}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Active Tasks Section */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Active Tasks
      </Typography>
      
      <Grid container spacing={3}>
        {loading ? (
          renderSkeletons()
        ) : activeTasks.length > 0 ? (
          activeTasks.map(renderTaskCard)
        ) : (
          <Grid item xs={12}>
            <Box sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="body1" color="text.secondary">
                No active tasks. Create a new task to get started!
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/new-task')}
                sx={{ mt: 2 }}
              >
                Create Task
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Completed Tasks Section */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 6 }}>
        Completed Tasks
      </Typography>
      
      <Grid container spacing={3}>
        {loading ? (
          renderSkeletons()
        ) : completedTasks.length > 0 ? (
          completedTasks.map(renderTaskCard)
        ) : (
          <Grid item xs={12}>
            <Box sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              border: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="body1" color="text.secondary">
                No completed tasks yet.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
