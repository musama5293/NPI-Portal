import React from 'react';
import { IconButton, Tooltip, alpha, styled } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../../theme/ThemeProvider';
import Fade from '@mui/material/Fade';

// Create a styled header icon button to match MainLayout
const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  transition: theme.transitions.create(['transform', 'background-color'], {
    duration: theme.transitions.duration.shortest,
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    transform: 'scale(1.05) rotate(30deg)',
  },
}));

/**
 * ThemeToggle component for switching between light and dark mode
 * 
 * @returns {JSX.Element} A toggle button for switching themes
 */
const ThemeToggle = () => {
  const { mode, toggleTheme } = useThemeMode();
  
  return (
    <Tooltip 
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      arrow
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 300 }}
    >
      <HeaderIconButton
        onClick={toggleTheme}
        aria-label="toggle light/dark theme"
      >
        {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
      </HeaderIconButton>
    </Tooltip>
  );
};

export default ThemeToggle; 