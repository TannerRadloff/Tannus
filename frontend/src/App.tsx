import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import NewTask from './pages/NewTask';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function App() {
  return (
    <CustomThemeProvider>
      <SocketProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/task/:taskId" element={<TaskDetail />} />
              <Route path="/new-task" element={<NewTask />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
    </CustomThemeProvider>
  );
}

export default App;
