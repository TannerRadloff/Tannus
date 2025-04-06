import React from 'react';
import { Box, useMediaQuery, useTheme, Container, Grid, Paper } from '@mui/material';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  spacing?: number;
  padding?: number;
}

/**
 * A responsive container component that adjusts layout based on screen size
 * 
 * @param children - The content to render inside the container
 * @param maxWidth - Maximum width of the container (follows MUI container maxWidth)
 * @param spacing - Grid spacing between items
 * @param padding - Container padding
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  spacing = 3,
  padding = 3
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  return (
    <Container 
      maxWidth={maxWidth}
      sx={{ 
        px: isMobile ? 2 : 3,
        py: isMobile ? 2 : 3,
      }}
    >
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: spacing
      }}>
        {children}
      </Box>
    </Container>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  columns?: { xs: number; sm: number; md: number; lg: number; xl: number; };
}

/**
 * A responsive grid component that adjusts columns based on screen size
 * 
 * @param children - The content to render inside the grid
 * @param spacing - Grid spacing between items
 * @param columns - Number of columns at different breakpoints
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 3,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }
}) => {
  return (
    <Grid container spacing={spacing}>
      {React.Children.map(children, (child) => (
        <Grid 
          item 
          xs={12 / columns.xs} 
          sm={12 / columns.sm} 
          md={12 / columns.md} 
          lg={12 / columns.lg} 
          xl={12 / columns.xl}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  elevation?: number;
  height?: string | number;
}

/**
 * A responsive card component with consistent styling
 * 
 * @param children - The content to render inside the card
 * @param elevation - Card elevation (shadow depth)
 * @param height - Card height
 */
const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  elevation = 2,
  height = 'auto'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Paper
      elevation={elevation}
      sx={{
        p: isMobile ? 2 : 3,
        height,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: elevation + 2,
          transform: 'translateY(-4px)'
        }
      }}
    >
      {children}
    </Paper>
  );
};

interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number;
  rightWidth?: number;
  spacing?: number;
  reverseOnMobile?: boolean;
}

/**
 * A responsive two-column layout that stacks on mobile
 * 
 * @param left - Content for the left column
 * @param right - Content for the right column
 * @param leftWidth - Width of left column (out of 12)
 * @param rightWidth - Width of right column (out of 12)
 * @param spacing - Spacing between columns
 * @param reverseOnMobile - Whether to reverse column order on mobile
 */
const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  left,
  right,
  leftWidth = 8,
  rightWidth = 4,
  spacing = 3,
  reverseOnMobile = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Grid 
      container 
      spacing={spacing}
      direction={isMobile && reverseOnMobile ? 'column-reverse' : 'row'}
    >
      <Grid item xs={12} md={leftWidth}>
        {left}
      </Grid>
      <Grid item xs={12} md={rightWidth}>
        {right}
      </Grid>
    </Grid>
  );
};

export { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveCard, 
  TwoColumnLayout 
};
