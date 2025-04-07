import React from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Checkbox, Typography, Box, Divider } from '@mui/material';

export interface PlanStep {
  id: number;
  description: string;
  completed: boolean;
  status?: string;
}

interface PlanStepsListProps {
  steps: PlanStep[];
  onToggleStep?: (stepIndex: number, completed: boolean) => void;
}

const PlanStepsList: React.FC<PlanStepsListProps> = ({ steps, onToggleStep }) => {
  if (!steps || steps.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary">
        No plan steps available.
      </Typography>
    );
  }

  const handleToggle = (stepIndex: number, completed: boolean) => {
    if (onToggleStep) {
      onToggleStep(stepIndex, !completed);
    }
  };

  return (
    <List sx={{ width: '100%' }}>
      {steps.map((step, index) => {
        const labelId = `step-${step.id}`;
        
        return (
          <React.Fragment key={step.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem
              alignItems="flex-start"
              sx={{
                opacity: step.completed ? 0.7 : 1,
                textDecoration: step.completed ? 'line-through' : 'none',
              }}
            >
              {onToggleStep && (
                <ListItemIcon sx={{ minWidth: 42 }}>
                  <Checkbox
                    edge="start"
                    checked={step.completed}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': labelId }}
                    onChange={() => handleToggle(step.id, step.completed)}
                  />
                </ListItemIcon>
              )}
              <ListItemText
                id={labelId}
                primary={
                  <Typography
                    variant="body1"
                    component="span"
                    sx={{ fontWeight: 500 }}
                  >
                    {step.description}
                  </Typography>
                }
                secondary={
                  step.status && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                      >
                        {step.status}
                      </Typography>
                    </Box>
                  )
                }
              />
            </ListItem>
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default PlanStepsList;
