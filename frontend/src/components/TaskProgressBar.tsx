import React from 'react';
import { LinearProgress, Box, Typography } from '@mui/material';

interface TaskProgressBarProps {
  progress: number;
}

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({ progress }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 10, 
          borderRadius: 5,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            backgroundColor: progress === 100 ? '#4caf50' : '#2196f3',
          }
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {`${Math.round(progress)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

export default TaskProgressBar;
