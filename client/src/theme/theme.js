import { createTheme } from '@mui/material/styles';

// Color palette based on NUST brand colors
const colors = {
  primary: {
    main: '#073c78', // NUST primary blue
    light: '#3466a3',
    dark: '#052950',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ffc107', // Gold accent
    light: '#ffcd38',
    dark: '#e0a800',
    contrastText: '#000000',
  },
  success: {
    main: '#2ecc71',
    light: '#58d68d',
    dark: '#27ae60',
    contrastText: '#ffffff',
  },
  error: {
    main: '#e74c3c',
    light: '#ec7063',
    dark: '#c0392b',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#f39c12',
    light: '#f5b041',
    dark: '#d68910',
    contrastText: '#ffffff',
  },
  info: {
    main: '#3498db',
    light: '#5dade2',
    dark: '#2980b9',
    contrastText: '#ffffff',
  },
  grey: {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
  text: {
    primary: '#212529',
    secondary: '#495057',
    disabled: '#adb5bd',
  },
  background: {
    default: '#f8f9fa',
    paper: '#ffffff',
    dark: '#1e293b',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

// Typography configuration
const typography = {
  fontFamily: [
    'Roboto',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontWeight: 700,
    fontSize: '2rem',
    lineHeight: 1.2,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.2,
    letterSpacing: '0em',
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.2,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.2,
    letterSpacing: '0em',
  },
  h6: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.2,
    letterSpacing: '0.0075em',
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  body1: {
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  button: {
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase',
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase',
  },
};

// Shape configurations
const shape = {
  borderRadius: 8,
};

// Shadows
const shadows = [
  'none',
  '0px 2px 1px -1px rgba(0,0,0,0.05),0px 1px 1px 0px rgba(0,0,0,0.03),0px 1px 3px 0px rgba(0,0,0,0.05)',
  '0px 3px 1px -2px rgba(0,0,0,0.05),0px 2px 2px 0px rgba(0,0,0,0.03),0px 1px 5px 0px rgba(0,0,0,0.05)',
  '0px 3px 3px -2px rgba(0,0,0,0.05),0px 3px 4px 0px rgba(0,0,0,0.03),0px 1px 8px 0px rgba(0,0,0,0.05)',
  '0px 2px 4px -1px rgba(0,0,0,0.05),0px 4px 5px 0px rgba(0,0,0,0.03),0px 1px 10px 0px rgba(0,0,0,0.05)',
  '0px 3px 5px -1px rgba(0,0,0,0.05),0px 5px 8px 0px rgba(0,0,0,0.03),0px 1px 14px 0px rgba(0,0,0,0.05)',
  '0px 3px 5px -1px rgba(0,0,0,0.05),0px 6px 10px 0px rgba(0,0,0,0.03),0px 1px 18px 0px rgba(0,0,0,0.05)',
  '0px 4px 5px -2px rgba(0,0,0,0.05),0px 7px 10px 1px rgba(0,0,0,0.03),0px 2px 16px 1px rgba(0,0,0,0.05)',
  '0px 5px 5px -3px rgba(0,0,0,0.05),0px 8px 10px 1px rgba(0,0,0,0.03),0px 3px 14px 2px rgba(0,0,0,0.05)',
  '0px 5px 6px -3px rgba(0,0,0,0.05),0px 9px 12px 1px rgba(0,0,0,0.03),0px 3px 16px 2px rgba(0,0,0,0.05)',
  '0px 6px 6px -3px rgba(0,0,0,0.05),0px 10px 14px 1px rgba(0,0,0,0.03),0px 4px 18px 3px rgba(0,0,0,0.05)',
  '0px 6px 7px -4px rgba(0,0,0,0.05),0px 11px 15px 1px rgba(0,0,0,0.03),0px 4px 20px 3px rgba(0,0,0,0.05)',
  '0px 7px 8px -4px rgba(0,0,0,0.05),0px 12px 17px 2px rgba(0,0,0,0.03),0px 5px 22px 4px rgba(0,0,0,0.05)',
  '0px 7px 8px -4px rgba(0,0,0,0.05),0px 13px 19px 2px rgba(0,0,0,0.03),0px 5px 24px 4px rgba(0,0,0,0.05)',
  '0px 7px 9px -4px rgba(0,0,0,0.05),0px 14px 21px 2px rgba(0,0,0,0.03),0px 5px 26px 4px rgba(0,0,0,0.05)',
  '0px 8px 9px -5px rgba(0,0,0,0.05),0px 15px 22px 2px rgba(0,0,0,0.03),0px 6px 28px 5px rgba(0,0,0,0.05)',
  '0px 8px 10px -5px rgba(0,0,0,0.05),0px 16px 24px 2px rgba(0,0,0,0.03),0px 6px 30px 5px rgba(0,0,0,0.05)',
  '0px 8px 11px -5px rgba(0,0,0,0.05),0px 17px 26px 2px rgba(0,0,0,0.03),0px 6px 32px 5px rgba(0,0,0,0.05)',
  '0px 9px 11px -5px rgba(0,0,0,0.05),0px 18px 28px 2px rgba(0,0,0,0.03),0px 7px 34px 6px rgba(0,0,0,0.05)',
  '0px 9px 12px -6px rgba(0,0,0,0.05),0px 19px 29px 2px rgba(0,0,0,0.03),0px 7px 36px 6px rgba(0,0,0,0.05)',
  '0px 10px 13px -6px rgba(0,0,0,0.05),0px 20px 31px 3px rgba(0,0,0,0.03),0px 8px 38px 7px rgba(0,0,0,0.05)',
  '0px 10px 13px -6px rgba(0,0,0,0.05),0px 21px 33px 3px rgba(0,0,0,0.03),0px 8px 40px 7px rgba(0,0,0,0.05)',
  '0px 10px 14px -6px rgba(0,0,0,0.05),0px 22px 35px 3px rgba(0,0,0,0.03),0px 8px 42px 7px rgba(0,0,0,0.05)',
  '0px 11px 14px -7px rgba(0,0,0,0.05),0px 23px 36px 3px rgba(0,0,0,0.03),0px 9px 44px 8px rgba(0,0,0,0.05)',
  '0px 11px 15px -7px rgba(0,0,0,0.05),0px 24px 38px 3px rgba(0,0,0,0.03),0px 9px 46px 8px rgba(0,0,0,0.05)',
];

// Create and export theme
const lightTheme = createTheme({
  palette: colors,
  typography,
  shape,
  shadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: colors.primary.dark,
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: colors.secondary.dark,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: colors.grey[100],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.dark,
          color: colors.grey[100],
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
      },
    },
    // Add Dialog styling
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          padding: '8px',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    // Add Chip styling
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        sizeSmall: {
          height: 24,
          fontSize: '0.75rem',
        },
      },
    },
    // Add List styling
    MuiList: {
      styleOverrides: {
        root: {
          padding: '8px 0',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    // Add Tab styling
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minWidth: 100,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    // Data Grid styling
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: colors.grey[100],
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${colors.grey[200]}`,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    // Alert styling
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: `${colors.success.light}20`,
          color: colors.success.dark,
        },
        standardError: {
          backgroundColor: `${colors.error.light}20`,
          color: colors.error.dark,
        },
        standardWarning: {
          backgroundColor: `${colors.warning.light}20`,
          color: colors.warning.dark,
        },
        standardInfo: {
          backgroundColor: `${colors.info.light}20`,
          color: colors.info.dark,
        },
      },
    },
    // Toggle button styling
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          border: `1px solid ${colors.grey[300]}`,
          '&.Mui-selected': {
            backgroundColor: `${colors.primary.main}20`,
            color: colors.primary.main,
            '&:hover': {
              backgroundColor: `${colors.primary.main}30`,
            },
          },
        },
      },
    },
    // Tooltip styling
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.grey[800],
          borderRadius: 6,
          fontSize: '0.75rem',
          padding: '8px 12px',
          fontWeight: 500,
        },
      },
    },
  },
});

// Create a dark theme by extending the light theme
const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    ...lightTheme.palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
      dark: '#0a0a0a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#6c6c6c',
    },
  },
  components: {
    ...lightTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#2d2d2d',
          color: '#ffffff',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: 'rgba(46, 204, 113, 0.15)',
          color: '#2ecc71',
        },
        standardError: {
          backgroundColor: 'rgba(231, 76, 60, 0.15)',
          color: '#e74c3c',
        },
        standardWarning: {
          backgroundColor: 'rgba(243, 156, 18, 0.15)',
          color: '#f39c12',
        },
        standardInfo: {
          backgroundColor: 'rgba(52, 152, 219, 0.15)',
          color: '#3498db',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
      },
    },
  },
});

export { lightTheme, darkTheme }; 