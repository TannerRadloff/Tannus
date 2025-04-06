import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { 
  DarkMode as DarkModeIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { mode, toggleColorMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(true);
  const [performanceMode, setPerformanceMode] = React.useState('balanced');
  const [settingsSaved, setSettingsSaved] = React.useState(false);

  // Handle saving settings
  const handleSaveSettings = () => {
    // In a real app, this would save to backend or localStorage
    setSettingsSaved(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSettingsSaved(false);
    }, 3000);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your preferences for the AI Agents Webapp.
        </Typography>
      </Box>

      {settingsSaved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Appearance
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <DarkModeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Dark Mode" 
                  secondary="Switch between light and dark theme"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={mode === 'dark'} 
                      onChange={toggleColorMode} 
                      color="primary"
                    />
                  }
                  label={mode === 'dark' ? 'On' : 'Off'}
                  labelPlacement="start"
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h5" component="h2" gutterBottom>
              Notifications
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Task Notifications" 
                  secondary="Receive notifications when tasks are completed or require attention"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notificationsEnabled} 
                      onChange={(e) => setNotificationsEnabled(e.target.checked)} 
                      color="primary"
                    />
                  }
                  label={notificationsEnabled ? 'On' : 'Off'}
                  labelPlacement="start"
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h5" component="h2" gutterBottom>
              Performance
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <SpeedIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Performance Mode" 
                  secondary="Adjust performance settings based on your needs"
                />
                <Box sx={{ minWidth: 120 }}>
                  <TextField
                    select
                    value={performanceMode}
                    onChange={(e) => setPerformanceMode(e.target.value)}
                    SelectProps={{
                      native: true,
                    }}
                    size="small"
                  >
                    <option value="power-saver">Power Saver</option>
                    <option value="balanced">Balanced</option>
                    <option value="performance">Performance</option>
                  </TextField>
                </Box>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Auto-Save" 
                  secondary="Automatically save task progress"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={autoSaveEnabled} 
                      onChange={(e) => setAutoSaveEnabled(e.target.checked)} 
                      color="primary"
                    />
                  }
                  label={autoSaveEnabled ? 'On' : 'Off'}
                  labelPlacement="start"
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About AI Agents Webapp
              </Typography>
              <Typography variant="body2" paragraph>
                Version: 1.0.0
              </Typography>
              <Typography variant="body2" paragraph>
                The AI Agents Webapp allows AI agents to run indefinitely as needed to complete complex tasks. Agents create and maintain plans in markdown files, track progress with checkboxes, and update plans as goals change or challenges arise.
              </Typography>
              <Typography variant="body2">
                © 2025 AI Agents Team
              </Typography>
            </CardContent>
          </Card>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              System Information
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Security" 
                  secondary="All data is encrypted and securely stored"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <LanguageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="API Status" 
                  secondary="All systems operational"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Storage" 
                  secondary="Using secure cloud storage for all data"
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="outlined" 
                fullWidth
              >
                Check for Updates
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings;
