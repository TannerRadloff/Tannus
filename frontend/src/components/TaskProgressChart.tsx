import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Grid } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface TaskProgressChartProps {
  taskId: string;
  initialData?: any[];
}

const TaskProgressChart: React.FC<TaskProgressChartProps> = ({ 
  taskId,
  initialData = []
}) => {
  const [progressData, setProgressData] = useState<any[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const { socket, connected } = useSocket();
  
  // Load initial data and set up socket listeners
  useEffect(() => {
    // Simulate loading initial data
    // In a real app, this would fetch from an API
    setTimeout(() => {
      if (initialData.length === 0) {
        // Generate some sample data if none provided
        const sampleData = Array.from({ length: 10 }, (_, i) => ({
          time: new Date(Date.now() - (9 - i) * 600000).toLocaleTimeString(),
          progress: Math.floor(Math.random() * 20) + i * 10
        }));
        setProgressData(sampleData);
      }
      setLoading(false);
    }, 1000);
    
    // Subscribe to task updates
    if (socket && taskId) {
      console.log(`Subscribing to updates for task ${taskId}`);
      
      socket.emit('subscribe_to_task', { task_id: taskId });
      
      // Listen for task updates
      const handleTaskUpdate = (data: any) => {
        if (data.plan_id === taskId) {
          // Add new data point
          setProgressData(prev => [
            ...prev, 
            {
              time: new Date().toLocaleTimeString(),
              progress: data.progress_percentage || 0
            }
          ]);
        }
      };
      
      socket.on(`task_update_${taskId}`, handleTaskUpdate);
      
      // Cleanup
      return () => {
        socket.off(`task_update_${taskId}`);
        socket.emit('unsubscribe_from_task', { task_id: taskId });
      };
    }
  }, [socket, taskId, initialData]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="body2" color="textPrimary">
            {`Time: ${label}`}
          </Typography>
          <Typography variant="body2" color="primary">
            {`Progress: ${payload[0].value}%`}
          </Typography>
        </Paper>
      );
    }
    return null;
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (progressData.length === 0) {
    return (
      <Box sx={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Typography variant="body1" color="textSecondary" align="center">
          No progress data available
        </Typography>
        {!connected && (
          <Typography variant="body2" color="error" align="center" sx={{ mt: 1 }}>
            Real-time updates disconnected
          </Typography>
        )}
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: 300, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={progressData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            label={{ 
              value: 'Time', 
              position: 'insideBottomRight', 
              offset: -10 
            }} 
          />
          <YAxis 
            domain={[0, 100]} 
            label={{ 
              value: 'Progress (%)', 
              angle: -90, 
              position: 'insideLeft' 
            }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="progress" 
            stroke="#4a6bdf" 
            activeDot={{ r: 8 }} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {!connected && (
        <Typography variant="caption" color="error" align="center" sx={{ display: 'block', mt: 1 }}>
          Real-time updates disconnected
        </Typography>
      )}
    </Box>
  );
};

export default TaskProgressChart;
