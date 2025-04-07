import React from 'react';
import { List, ListItem, ListItemText, Typography, Box, Divider } from '@mui/material';

interface AgentAction {
  id: string;
  type: string;
  content: string;
  timestamp: string;
}

interface AgentActionsListProps {
  sessionId: string;
}

const AgentActionsList: React.FC<AgentActionsListProps> = ({ sessionId }) => {
  // This is a stub implementation
  // In a real implementation, we would fetch actions from an API
  const [actions, setActions] = React.useState<AgentAction[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Simulate loading actions
    setLoading(true);
    
    // Mock data
    const mockActions: AgentAction[] = [
      {
        id: '1',
        type: 'thought',
        content: 'I need to analyze the data provided by the user.',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'action',
        content: 'Searching for relevant information...',
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        type: 'result',
        content: 'Found 3 relevant articles that match the query.',
        timestamp: new Date().toISOString()
      }
    ];
    
    // Simulate API delay
    setTimeout(() => {
      setActions(mockActions);
      setLoading(false);
    }, 500);
  }, [sessionId]);

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading agent actions...
      </Typography>
    );
  }

  if (actions.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary">
        No agent actions recorded for this session.
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%' }}>
      {actions.map((action, index) => (
        <React.Fragment key={action.id}>
          {index > 0 && <Divider component="li" />}
          <ListItem alignItems="flex-start">
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ 
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    color: action.type === 'thought' ? 'primary.main' : 
                           action.type === 'action' ? 'secondary.main' : 'success.main'
                  }}
                >
                  {action.type}
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body1" component="span">
                    {action.content}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
};

export default AgentActionsList;
