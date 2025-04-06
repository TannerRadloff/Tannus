import React from 'react';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, PaletteMode } from '@mui/material/styles';

// Define theme context type
interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
  theme: Theme;
}

// Create context with default values
const ThemeContext = React.createContext<ThemeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
  theme: createTheme(),
});

// Custom hook to use theme context
export const useTheme = () => React.useContext(ThemeContext);

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
}

// Create theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get saved theme from localStorage or default to system preference
  const getInitialMode = (): PaletteMode => {
    const savedMode = localStorage.getItem('themeMode') as PaletteMode | null;
    if (savedMode) return savedMode;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };
  
  const [mode, setMode] = React.useState<PaletteMode>(getInitialMode);

  // Toggle between light and dark mode
  const toggleColorMode = React.useCallback(() => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  }, []);

  // Listen for system preference changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only change if user hasn't explicitly set a preference
      if (!localStorage.getItem('themeMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    // Add listener for preference changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Create theme based on current mode
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#4a6bdf',
            light: mode === 'light' ? '#6b8ae5' : '#5d7de3',
            dark: mode === 'light' ? '#3a5bc0' : '#3a5bc0',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#6c757d',
            light: mode === 'light' ? '#868e96' : '#7d868d',
            dark: mode === 'light' ? '#5a6268' : '#5a6268',
            contrastText: '#ffffff',
          },
          error: {
            main: '#dc3545',
            light: mode === 'light' ? '#e35d6a' : '#e04b59',
            dark: mode === 'light' ? '#bd2130' : '#bd2130',
          },
          warning: {
            main: '#ffc107',
            light: mode === 'light' ? '#ffcd39' : '#ffca2c',
            dark: mode === 'light' ? '#d39e00' : '#d39e00',
          },
          info: {
            main: '#17a2b8',
            light: mode === 'light' ? '#1fc8e3' : '#1ab6cf',
            dark: mode === 'light' ? '#138496' : '#138496',
          },
          success: {
            main: '#28a745',
            light: mode === 'light' ? '#48c664' : '#34b556',
            dark: mode === 'light' ? '#218838' : '#218838',
          },
          background: {
            default: mode === 'light' ? '#f5f7fa' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
          text: {
            primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
            secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.38)' : 'rgba(255, 255, 255, 0.38)',
          },
          divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
          action: {
            active: mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)',
            hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
            selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
            disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
            disabledBackground: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
          },
        },
        typography: {
          fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            lineHeight: 1.2,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 600,
            lineHeight: 1.3,
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            lineHeight: 1.3,
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4,
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.5,
          },
          subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
          },
          subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.57,
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.43,
          },
          button: {
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.75,
            textTransform: 'none',
          },
          caption: {
            fontSize: '0.75rem',
            lineHeight: 1.66,
          },
          overline: {
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 2.66,
            textTransform: 'uppercase',
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: mode === 'light' ? '#f1f1f1' : '#2d2d2d',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: mode === 'light' ? '#c1c1c1' : '#5c5c5c',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: mode === 'light' ? '#a8a8a8' : '#6e6e6e',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: mode === 'light' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                '&:hover': {
                  boxShadow: mode === 'light' ? '0 4px 8px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.3)',
                },
              },
              containedPrimary: {
                '&:hover': {
                  backgroundColor: mode === 'light' ? '#3a5bc0' : '#5d7de3',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light' 
                  ? '0 4px 12px rgba(0, 0, 0, 0.05)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: mode === 'light' 
                    ? '0 6px 16px rgba(0, 0, 0, 0.1)' 
                    : '0 6px 16px rgba(0, 0, 0, 0.3)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
              elevation1: {
                boxShadow: mode === 'light' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.05)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
              },
              elevation2: {
                boxShadow: mode === 'light' 
                  ? '0 4px 12px rgba(0, 0, 0, 0.05)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.05)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                borderRight: mode === 'light' 
                  ? '1px solid rgba(0, 0, 0, 0.08)' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: mode === 'light' 
                  ? '1px solid rgba(0, 0, 0, 0.08)' 
                  : '1px solid rgba(255, 255, 255, 0.08)',
              },
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
              },
            },
          },
        },
        transitions: {
          easing: {
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
            easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
          },
          duration: {
            shortest: 150,
            shorter: 200,
            short: 250,
            standard: 300,
            complex: 375,
            enteringScreen: 225,
            leavingScreen: 195,
          },
        },
      }),
    [mode],
  );

  // Global styles for dark mode transitions
  const globalStyles = (
    <GlobalStyles
      styles={{
        '*, *::before, *::after': {
          transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        },
        body: {
          transition: 'background-color 0.3s ease',
        },
      }}
    />
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode, theme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {globalStyles}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
