import React from 'react';
import { Box, useMediaQuery, useTheme, Paper, Divider } from '@mui/material';
import { ResponsiveTypography } from './ResponsiveUtils';

interface ResponsiveCardGridProps {
  items: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    footer?: React.ReactNode;
  }>;
  columns?: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
  spacing?: number;
  cardHeight?: string | number;
}

/**
 * A responsive grid of cards that adjusts columns based on screen size
 * 
 * @param items - Array of items to display in cards
 * @param columns - Number of columns at different breakpoints
 * @param spacing - Grid spacing between cards
 * @param cardHeight - Height of each card
 */
const ResponsiveCardGrid: React.FC<ResponsiveCardGridProps> = ({
  items,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  spacing = 3,
  cardHeight = 'auto'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: {
        xs: `repeat(${columns.xs}, 1fr)`,
        sm: `repeat(${columns.sm}, 1fr)`,
        md: `repeat(${columns.md}, 1fr)`,
        lg: `repeat(${columns.lg}, 1fr)`
      },
      gap: theme.spacing(spacing)
    }}>
      {items.map(item => (
        <Paper
          key={item.id}
          elevation={2}
          sx={{
            height: cardHeight,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4
            }
          }}
        >
          <Box sx={{ p: isMobile ? 2 : 3, flexGrow: 1 }}>
            <ResponsiveTypography variant="h6" gutterBottom>
              {item.title}
            </ResponsiveTypography>
            <Box>{item.content}</Box>
          </Box>
          
          {item.footer && (
            <>
              <Divider />
              <Box sx={{ p: isMobile ? 2 : 3 }}>
                {item.footer}
              </Box>
            </>
          )}
        </Paper>
      ))}
    </Box>
  );
};

interface ResponsiveTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
  }>;
  defaultTab?: string;
  orientation?: 'horizontal' | 'vertical';
  onChange?: (tabId: string) => void;
}

/**
 * Responsive tabs component that switches between horizontal and vertical layouts
 * based on screen size
 * 
 * @param tabs - Array of tab objects with id, label, and content
 * @param defaultTab - ID of the default selected tab
 * @param orientation - Preferred orientation (will still adapt to screen size)
 * @param onChange - Callback when tab changes
 */
const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  defaultTab,
  orientation = 'horizontal',
  onChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedTab, setSelectedTab] = React.useState(defaultTab || tabs[0]?.id);
  
  // Force horizontal orientation on mobile
  const effectiveOrientation = isMobile ? 'horizontal' : orientation;
  
  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };
  
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: effectiveOrientation === 'horizontal' ? 'column' : 'row',
      height: '100%'
    }}>
      {/* Tab headers */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: effectiveOrientation === 'horizontal' ? 'row' : 'column',
        overflowX: effectiveOrientation === 'horizontal' ? 'auto' : 'visible',
        overflowY: effectiveOrientation === 'horizontal' ? 'visible' : 'auto',
        borderBottom: effectiveOrientation === 'horizontal' ? `1px solid ${theme.palette.divider}` : 'none',
        borderRight: effectiveOrientation === 'vertical' ? `1px solid ${theme.palette.divider}` : 'none',
        flexShrink: 0,
        width: effectiveOrientation === 'vertical' ? 200 : '100%',
        ...(isMobile && { width: '100%' })
      }}>
        {tabs.map(tab => (
          <Box
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            sx={{
              p: 2,
              cursor: 'pointer',
              fontWeight: selectedTab === tab.id ? 'bold' : 'normal',
              color: selectedTab === tab.id ? 'primary.main' : 'text.primary',
              borderBottom: effectiveOrientation === 'horizontal' && selectedTab === tab.id 
                ? `2px solid ${theme.palette.primary.main}` 
                : effectiveOrientation === 'horizontal'
                  ? '2px solid transparent'
                  : 'none',
              borderRight: effectiveOrientation === 'vertical' && selectedTab === tab.id
                ? `2px solid ${theme.palette.primary.main}`
                : effectiveOrientation === 'vertical'
                  ? '2px solid transparent'
                  : 'none',
              backgroundColor: selectedTab === tab.id 
                ? theme.palette.action.selected 
                : 'transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            {tab.label}
          </Box>
        ))}
      </Box>
      
      {/* Tab content */}
      <Box sx={{ 
        p: 2,
        flexGrow: 1,
        overflow: 'auto'
      }}>
        {tabs.find(tab => tab.id === selectedTab)?.content}
      </Box>
    </Box>
  );
};

export {
  ResponsiveCardGrid,
  ResponsiveTabs
};
