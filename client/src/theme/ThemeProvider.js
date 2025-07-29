import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme';

// Create context for theme management
const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  isDarkMode: false
});

// Hook to use theme context
export const useThemeMode = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Get stored theme preference or default to light
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Effect to store theme preference
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Toggle theme function
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Memoize theme to prevent unnecessary re-renders
  const theme = useMemo(() => {
    return mode === 'light' ? lightTheme : darkTheme;
  }, [mode]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    mode,
    toggleTheme,
    isDarkMode: mode === 'dark'
  }), [mode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 