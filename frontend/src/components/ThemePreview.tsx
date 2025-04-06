import React, { useEffect } from 'react';
import { Box, Paper, Typography, useTheme as useMuiTheme, Switch, FormControlLabel, useMediaQuery } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import DarkModeToggle from './DarkModeToggle';

interface ThemePreviewProps {
  showControls?: boolean;
}

/**
 * A component that displays a preview of both light and dark themes
 * with controls to switch between them
 * 
 * @param showControls - Whether to show theme switching controls
 */
const ThemePreview: React.FC<ThemePreviewProps> = ({
  showControls = true
}) => {
  const { mode, toggleColorMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // Create a sample of UI elements to showcase the theme
  const renderThemeSample = (sampleMode: 'light' | 'dark') => {
    const isCurrentMode = mode === sampleMode;
    const bgColor = sampleMode === 'light' ? '#f5f7fa' : '#121212';
    const textColor = sampleMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)';
    const paperBgColor = sampleMode === 'light' ? '#ffffff' : '#1e1e1e';
    const primaryColor = '#4a6bdf';
    const secondaryColor = '#6c757d';
    const borderColor = sampleMode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
    
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: bgColor,
          color: textColor,
          borderRadius: 2,
          border: isCurrentMode ? `2px solid ${primaryColor}` : `1px solid ${borderColor}`,
          flex: 1,
          minWidth: isMobile ? '100%' : '45%',
          maxWidth: isMobile ? '100%' : '45%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isCurrentMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: primaryColor,
              color: '#fff',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            ACTIVE
          </Box>
        )}
        
        <Typography variant="h6" gutterBottom sx={{ color: textColor }}>
          {sampleMode.charAt(0).toUpperCase() + sampleMode.slice(1)} Theme
        </Typography>
        
        <Paper
          sx={{
            p: 2,
            bgcolor: paperBgColor,
            color: textColor,
            mb: 2,
          }}
        >
          <Typography variant="body1" sx={{ color: textColor }}>
            This is how content looks in {sampleMode} mode.
          </Typography>
        </Paper>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Box
            sx={{
              p: 1,
              bgcolor: primaryColor,
              color: '#fff',
              borderRadius: 1,
              fontSize: '0.875rem',
            }}
          >
            Primary
          </Box>
          <Box
            sx={{
              p: 1,
              bgcolor: secondaryColor,
              color: '#fff',
              borderRadius: 1,
              fontSize: '0.875rem',
            }}
          >
            Secondary
          </Box>
        </Box>
        
        <Box
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 1,
            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
          }}
        />
      </Box>
    );
  };
  
  return (
    <Box>
      {showControls && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Theme Settings</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggleColorMode}
                  color="primary"
                />
              }
              label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            />
            <DarkModeToggle iconOnly />
          </Box>
        </Box>
      )}
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          justifyContent: 'space-between',
        }}
      >
        {renderThemeSample('light')}
        {renderThemeSample('dark')}
      </Box>
      
      {showControls && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            The theme will be saved in your browser and applied to all pages. It will also respect your system preferences if you haven't explicitly chosen a theme.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ThemePreview;
