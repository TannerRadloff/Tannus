import React from 'react';
import { Chip, Typography } from '@mui/material';

interface TaskStatusBadgeProps {
  status: string;
}

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
  let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
  let label = status;

  switch (status?.toLowerCase()) {
    case 'running':
      color = 'primary';
      break;
    case 'completed':
      color = 'success';
      break;
    case 'failed':
      color = 'error';
      break;
    case 'paused':
      color = 'warning';
      break;
    case 'pending':
      color = 'info';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      label={label || 'Unknown'}
      color={color}
      size="small"
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

export default TaskStatusBadge;
