import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';

interface AgentActionsListProps {
  sessionId: string;
  maxItems?: number;
}

const AgentActionsList: React.FC<AgentActionsListProps> = ({ 
  sessionId,
  maxItems = 10
}) => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { socket, connected } = useSocket();
  
  // Load initial data and set up socket listeners
  useEffect(() => {
    // Fetch initial actions
    const fetchActions = async () => {
      try {
        // In a real app, this would fetch from an API
        // For now, we'll simulate loading
        setTimeout(() => {
          setActions([
            { 
              id: '1', 
              timestamp: new Date().toISOString(),
              type: 'plan_creation',
              description: 'Created initial plan'
            },
            { 
              id: '2', 
              timestamp: new Date(Date.now() - 60000).toISOString(),
              type: 'step_completion',
              description: 'Completed step 1: Analyze requirements'
            }
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching agent actions:', error);
        setLoading(false);
      }
    };
    
    fetchActions();
    
    // Set up socket listener for real-time updates
    if (socket && sessionId) {
      console.log(`Subscribing to agent actions for session ${sessionId}`);
      
      // Listen for agent actions
      const handleAgentAction = (data: any) => {
        setActions(prev => {
          // Add new action to the beginning of the list
          const updated = [data, ...prev];
          // Limit the number of items
          return updated.slice(0, maxItems);
        });
      };
      
      socket.on(`agent_action_${sessionId}`, handleAgentAction);
      
      // Cleanup
      return () => {
        socket.off(`agent_action_${sessionId}`);
      };
    }
  }, [socket, sessionId, maxItems]);
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 3
      }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2">Loading agent actions...</Typography>
      </Box>
    );
  }
  
  if (actions.length === 0) {
    return (
      <Box sx={{ 
        p: 3,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Typography variant="body1" color="textSecondary" align="center">
          No agent actions recorded yet
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
    <Box>
      <List sx={{ width: '100%' }}>
        {actions.map((action, index) => (
          <React.Fragment key={action.id || index}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={action.description}
                secondary={
                  <React.Fragment>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'inline', mr: 1 }}
                    >
                      {action.type}
                    </Typography>
                    {formatTimestamp(action.timestamp)}
                  </React.Fragment>
                }
              />
            </ListItem>
            {index < actions.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
      
      {!connected && (
        <Typography variant="caption" color="error" align="center" sx={{ display: 'block', mt: 1, mb: 1 }}>
          Real-time updates disconnected
        </Typography>
      )}
    </Box>
  );
};

export default AgentActionsList;
