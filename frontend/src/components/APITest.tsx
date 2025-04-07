import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, TextField, Divider } from '@mui/material';
import api from '../services/api';
import { OpenAIAgent } from '../services/agentsSDK'; // Import from our custom implementation instead

/**
 * Component to test the API functionality
 */
const APITest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("What can you tell me about AI agents?");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<OpenAIAgent | null>(null);

  useEffect(() => {
    // Create agent on component mount
    createAgent();
  }, []);

  const createAgent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const agentResult = await api.agents.create(
        "You are a helpful assistant that provides concise, accurate information about AI and technology."
      );
      setAgent(agentResult.agent);
      console.log('Agent created successfully:', agentResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
      console.error('Error creating agent:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAgent = async () => {
    if (!agent) {
      setError('No agent available. Please create an agent first.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const runResult = await api.agents.run(agent, input);
      setResult(runResult.result);
      console.log('Agent run successful:', runResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run agent');
      console.error('Error running agent:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        API Functionality Test
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Agent Status: {agent ? 'Created' : 'Not Created'}
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={createAgent} 
          disabled={loading || !!agent}
          sx={{ mb: 2 }}
        >
          {loading ? 'Creating...' : agent ? 'Agent Created' : 'Create Agent'}
        </Button>
      </Paper>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Test Agent Interaction
        </Typography>
        
        <TextField
          fullWidth
          label="Input for Agent"
          variant="outlined"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || !agent}
          sx={{ mb: 2 }}
        />
        
        <Button 
          variant="contained" 
          onClick={runAgent} 
          disabled={loading || !agent}
          sx={{ mb: 2 }}
        >
          {loading ? 'Running...' : 'Run Agent'}
        </Button>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Processing...</Typography>
        </Box>
      )}
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography variant="subtitle1" color="error">
            Error
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Paper>
      )}
      
      {result && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Agent Response:
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">
            {result}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default APITest;
