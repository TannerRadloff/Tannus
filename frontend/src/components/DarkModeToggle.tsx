import React from 'react';
import { Box, IconButton, Tooltip, useTheme as useMuiTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

interface DarkModeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left';
  iconOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A component that provides a toggle button for switching between light and dark mode
 * 
 * @param size - Size of the toggle button
 * @param showTooltip - Whether to show a tooltip on hover
 * @param tooltipPlacement - Placement of the tooltip
 * @param iconOnly - Whether to show only the icon without a container
 * @param className - Additional CSS class name
 * @param style - Additional inline styles
 */
const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  size = 'medium',
  showTooltip = true,
  tooltipPlacement = 'bottom',
  iconOnly = false,
  className,
  style
}) => {
  const { mode, toggleColorMode } = useTheme();
  const muiTheme = useMuiTheme();
  
  const isDark = mode === 'dark';
  
  // Determine icon size based on the size prop
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'medium';
    }
  };
  
  // Determine button size based on the size prop
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'medium';
    }
  };
  
  const toggleButton = (
    <IconButton
      onClick={toggleColorMode}
      color="inherit"
      size={getButtonSize()}
      className={className}
      style={style}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Brightness7 fontSize={getIconSize()} /> : <Brightness4 fontSize={getIconSize()} />}
    </IconButton>
  );
  
  // If iconOnly is true, return just the IconButton
  if (iconOnly) {
    return showTooltip ? (
      <Tooltip 
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} 
        placement={tooltipPlacement}
      >
        {toggleButton}
      </Tooltip>
    ) : toggleButton;
  }
  
  // Otherwise, return the IconButton with a container
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        borderRadius: 1,
        p: 0.5,
      }}
    >
      {showTooltip ? (
        <Tooltip 
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} 
          placement={tooltipPlacement}
        >
          {toggleButton}
        </Tooltip>
      ) : toggleButton}
    </Box>
  );
};

export default DarkModeToggle;
