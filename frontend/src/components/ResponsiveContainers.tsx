import React from 'react';
import { Box, useMediaQuery, useTheme, Paper, IconButton, Tooltip } from '@mui/material';
import { DesktopWindows, Smartphone, Tablet } from '@mui/icons-material';

interface ResponsiveViewportProps {
  children: React.ReactNode;
  showDeviceIndicator?: boolean;
}

/**
 * A component that wraps content and applies appropriate styles based on viewport size
 * Optionally shows a device type indicator
 * 
 * @param children - The content to render
 * @param showDeviceIndicator - Whether to show the device type indicator
 */
const ResponsiveViewport: React.FC<ResponsiveViewportProps> = ({
  children,
  showDeviceIndicator = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  return (
    <Box>
      {showDeviceIndicator && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 8,
          boxShadow: 2,
          p: 0.5
        }}>
          <Tooltip title={isMobile ? 'Mobile View' : isTablet ? 'Tablet View' : 'Desktop View'}>
            <IconButton size="small" color="primary">
              {isMobile ? <Smartphone /> : isTablet ? <Tablet /> : <DesktopWindows />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      
      <Box sx={{
        // Apply different padding based on device type
        px: isMobile ? 2 : isTablet ? 3 : 4,
        py: isMobile ? 2 : 3,
        // Adjust max width for readability on larger screens
        maxWidth: isDesktop ? '1600px' : '100%',
        mx: 'auto',
        // Ensure proper touch scrolling on mobile
        WebkitOverflowScrolling: 'touch',
        // Improve text rendering
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}>
        {children}
      </Box>
    </Box>
  );
};

interface ResponsiveScrollContainerProps {
  children: React.ReactNode;
  maxHeight?: string | number;
  fadeEdges?: boolean;
}

/**
 * A responsive scroll container with improved scrolling experience on mobile
 * 
 * @param children - The content to render
 * @param maxHeight - Maximum height of the container
 * @param fadeEdges - Whether to fade the edges of the content when scrolling
 */
const ResponsiveScrollContainer: React.FC<ResponsiveScrollContainerProps> = ({
  children,
  maxHeight = '400px',
  fadeEdges = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ 
      position: 'relative',
      maxHeight,
      overflow: 'auto',
      // Improve scrolling on mobile
      WebkitOverflowScrolling: 'touch',
      // Custom scrollbar styling
      scrollbarWidth: 'thin',
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
        '&:hover': {
          background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
        }
      },
      // Add padding for mobile to account for larger touch targets
      p: isMobile ? 1 : 0,
    }}>
      {children}
      
      {/* Fade edges when scrolling if enabled */}
      {fadeEdges && (
        <>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: `linear-gradient(to bottom, ${theme.palette.background.paper}, transparent)`,
            pointerEvents: 'none',
            zIndex: 1
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: `linear-gradient(to top, ${theme.palette.background.paper}, transparent)`,
            pointerEvents: 'none',
            zIndex: 1
          }} />
        </>
      )}
    </Box>
  );
};

export {
  ResponsiveViewport,
  ResponsiveScrollContainer
};
