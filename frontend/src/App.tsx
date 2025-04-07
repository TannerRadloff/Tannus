import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, Container, Paper } from '@mui/material';
import Dashboard from './pages/Dashboard';
import NewTask from './pages/NewTask';
import TaskDetail from './pages/TaskDetail';
import AgentSDKTest from './components/AgentSDKTest';
import APITest from './components/APITest';

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Tannus AI Agents
            </Typography>
            <Button color="inherit" component={Link} to="/">Dashboard</Button>
            <Button color="inherit" component={Link} to="/new-task">New Task</Button>
            <Button color="inherit" component={Link} to="/test">Test SDK</Button>
            <Button color="inherit" component={Link} to="/api-test">API Test</Button>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
            <Typography variant="h6" gutterBottom>API Status</Typography>
            <APITest />
          </Paper>
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-task" element={<NewTask />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/test" element={<AgentSDKTest />} />
            <Route path="/api-test" element={<APITest />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;
