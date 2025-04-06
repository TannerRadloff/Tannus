import React from 'react';
import { Box, Typography, useMediaQuery, useTheme, IconButton, Tooltip } from '@mui/material';
import { TouchApp, Mouse, DevicesOther } from '@mui/icons-material';

interface ResponsiveTouchTargetsProps {
  children: React.ReactNode;
  showIndicator?: boolean;
}

/**
 * A component that enhances touch targets for better mobile usability
 * while maintaining desktop aesthetics
 * 
 * @param children - The content to render with enhanced touch targets
 * @param showIndicator - Whether to show the device type indicator
 */
const ResponsiveTouchTargets: React.FC<ResponsiveTouchTargetsProps> = ({
  children,
  showIndicator = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isTouchDevice = isMobile || isTablet;
  
  // Apply different spacing and sizing based on device type
  const touchStyles = {
    button: {
      minHeight: isTouchDevice ? '48px' : '36px',
      minWidth: isTouchDevice ? '48px' : '36px',
      padding: isTouchDevice ? theme.spacing(1.5) : theme.spacing(1),
    },
    clickable: {
      padding: isTouchDevice ? theme.spacing(1.5) : theme.spacing(0.75),
      cursor: 'pointer',
    },
    input: {
      height: isTouchDevice ? '48px' : '36px',
      padding: isTouchDevice ? theme.spacing(1.5, 2) : theme.spacing(1, 1.5),
    },
    spacing: {
      marginBottom: isTouchDevice ? theme.spacing(2) : theme.spacing(1.5),
    }
  };
  
  // Clone children and apply touch-friendly styles
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    
    // Apply appropriate styles based on element type
    const childType = child.type as any;
    const elementName = childType?.displayName || childType?.name || '';
    
    if (elementName.includes('Button')) {
      return React.cloneElement(child, {
        style: { ...touchStyles.button, ...child.props.style },
      });
    } else if (elementName.includes('Input') || elementName.includes('TextField')) {
      return React.cloneElement(child, {
        style: { ...touchStyles.input, ...child.props.style },
      });
    } else if (child.props.onClick) {
      return React.cloneElement(child, {
        style: { ...touchStyles.clickable, ...child.props.style },
      });
    }
    
    return child;
  });
  
  return (
    <Box>
      {showIndicator && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Tooltip title={isMobile ? 'Mobile View' : isTablet ? 'Tablet View' : 'Desktop View'}>
            <IconButton size="small" color="inherit" sx={{ opacity: 0.5 }}>
              {isMobile ? <TouchApp fontSize="small" /> : 
               isTablet ? <DevicesOther fontSize="small" /> : 
               <Mouse fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {enhancedChildren}
    </Box>
  );
};

interface ResponsiveTypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2';
  component?: React.ElementType;
  [key: string]: any; // For other Typography props
}

/**
 * Typography component that adjusts size based on screen size
 * 
 * @param children - The text content
 * @param variant - Typography variant
 * @param component - The component to render as
 */
const ResponsiveTypography: React.FC<ResponsiveTypographyProps> = ({
  children,
  variant = 'body1',
  component,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Adjust variant based on screen size
  let responsiveVariant = variant;
  if (isMobile) {
    // Scale down headings on mobile
    if (variant === 'h1') responsiveVariant = 'h2';
    else if (variant === 'h2') responsiveVariant = 'h3';
    else if (variant === 'h3') responsiveVariant = 'h4';
    else if (variant === 'h4') responsiveVariant = 'h5';
    else if (variant === 'h5') responsiveVariant = 'h6';
  }
  
  return (
    <Typography 
      variant={responsiveVariant} 
      component={component || responsiveVariant} 
      {...props}
    >
      {children}
    </Typography>
  );
};

interface ResponsiveSpacingProps {
  children: React.ReactNode;
  spacing?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  direction?: 'row' | 'column';
}

/**
 * Component that provides responsive spacing between children
 * 
 * @param children - The content to apply spacing to
 * @param spacing - Spacing values for different breakpoints
 * @param direction - Direction of the flex container
 */
const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  children,
  spacing = { xs: 2, sm: 2, md: 3, lg: 3, xl: 4 },
  direction = 'column'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isExtraLargeDesktop = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Determine the appropriate spacing
  let currentSpacing = spacing.xs;
  if (isExtraLargeDesktop && spacing.xl !== undefined) currentSpacing = spacing.xl;
  else if (isLargeDesktop && spacing.lg !== undefined) currentSpacing = spacing.lg;
  else if (isDesktop && spacing.md !== undefined) currentSpacing = spacing.md;
  else if (isTablet && spacing.sm !== undefined) currentSpacing = spacing.sm;
  
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: direction,
      gap: theme.spacing(currentSpacing)
    }}>
      {children}
    </Box>
  );
};

export {
  ResponsiveTouchTargets,
  ResponsiveTypography,
  ResponsiveSpacing
};
