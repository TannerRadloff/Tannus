import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Grid } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TaskStatusChartProps {
  activeTasks: number;
  pausedTasks: number;
  completedTasks: number;
}

const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ 
  activeTasks, 
  pausedTasks, 
  completedTasks 
}) => {
  const [data, setData] = useState<any[]>([]);
  const { connected } = useSocket();
  
  // Colors for the chart segments
  const COLORS = ['#4caf50', '#ff9800', '#2196f3'];
  
  // Update chart data when props change
  useEffect(() => {
    setData([
      { name: 'Completed', value: completedTasks },
      { name: 'Paused', value: pausedTasks },
      { name: 'Active', value: activeTasks }
    ]);
  }, [activeTasks, pausedTasks, completedTasks]);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="body2" color="textPrimary">
            {`${payload[0].name}: ${payload[0].value} tasks`}
          </Typography>
        </Paper>
      );
    }
    return null;
  };
  
  // If there are no tasks, show a message
  if (activeTasks === 0 && pausedTasks === 0 && completedTasks === 0) {
    return (
      <Box sx={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Typography variant="body1" color="textSecondary" align="center">
          No tasks available to display
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: 300, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TaskStatusChart;
