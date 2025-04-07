import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import agentTest from '../services/agentTest';
import { OpenAIAgent } from '../services/agentsSDK'; // Import from our custom implementation instead

/**
 * Component to test the OpenAI Agents SDK integration
 */
const AgentSDKTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const testResult = await agentTest.testAgentSDKIntegration();
      setResult(testResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        OpenAI Agents SDK Integration Test
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runTest} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? 'Testing...' : 'Run Integration Test'}
      </Button>
      
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Testing OpenAI Agents SDK integration...</Typography>
        </Box>
      )}
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography variant="subtitle1" color="error">
            Test Failed
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Paper>
      )}
      
      {result && (
        <Paper sx={{ p: 2, bgcolor: result.success ? '#e8f5e9' : '#ffebee' }}>
          <Typography variant="subtitle1" color={result.success ? 'success' : 'error'}>
            {result.success ? 'Test Successful' : 'Test Failed'}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {result.message}
          </Typography>
          {result.result && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Agent Response:</Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="body2">
                  {result.result}
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AgentSDKTest;
