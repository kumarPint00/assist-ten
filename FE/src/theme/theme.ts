import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
      light: '#8b5cf6',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    info: {
      main: '#3b82f6',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
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
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 1px rgba(0, 0, 0, 0.14)',
    '0px 3px 6px rgba(0, 0, 0, 0.15), 0px 2px 4px rgba(0, 0, 0, 0.12)',
    '0px 6px 12px rgba(0, 0, 0, 0.15), 0px 4px 6px rgba(0, 0, 0, 0.12)',
    '0px 10px 20px rgba(0, 0, 0, 0.15), 0px 6px 8px rgba(0, 0, 0, 0.12)',
    '0px 15px 30px rgba(0, 0, 0, 0.15), 0px 8px 10px rgba(0, 0, 0, 0.12)',
    '0px 20px 40px rgba(0, 0, 0, 0.15), 0px 10px 12px rgba(0, 0, 0, 0.12)',
    '0px 25px 50px rgba(0, 0, 0, 0.15), 0px 12px 14px rgba(0, 0, 0, 0.12)',
    '0px 30px 60px rgba(0, 0, 0, 0.15), 0px 14px 16px rgba(0, 0, 0, 0.12)',
    '0px 35px 70px rgba(0, 0, 0, 0.15), 0px 16px 18px rgba(0, 0, 0, 0.12)',
    '0px 40px 80px rgba(0, 0, 0, 0.15), 0px 18px 20px rgba(0, 0, 0, 0.12)',
    '0px 45px 90px rgba(0, 0, 0, 0.15), 0px 20px 22px rgba(0, 0, 0, 0.12)',
    '0px 50px 100px rgba(0, 0, 0, 0.15), 0px 22px 24px rgba(0, 0, 0, 0.12)',
    '0px 55px 110px rgba(0, 0, 0, 0.15), 0px 24px 26px rgba(0, 0, 0, 0.12)',
    '0px 60px 120px rgba(0, 0, 0, 0.15), 0px 26px 28px rgba(0, 0, 0, 0.12)',
    '0px 65px 130px rgba(0, 0, 0, 0.15), 0px 28px 30px rgba(0, 0, 0, 0.12)',
    '0px 70px 140px rgba(0, 0, 0, 0.15), 0px 30px 32px rgba(0, 0, 0, 0.12)',
    '0px 75px 150px rgba(0, 0, 0, 0.15), 0px 32px 34px rgba(0, 0, 0, 0.12)',
    '0px 80px 160px rgba(0, 0, 0, 0.15), 0px 34px 36px rgba(0, 0, 0, 0.12)',
    '0px 85px 170px rgba(0, 0, 0, 0.15), 0px 36px 38px rgba(0, 0, 0, 0.12)',
    '0px 90px 180px rgba(0, 0, 0, 0.15), 0px 38px 40px rgba(0, 0, 0, 0.12)',
    '0px 95px 190px rgba(0, 0, 0, 0.15), 0px 40px 42px rgba(0, 0, 0, 0.12)',
    '0px 100px 200px rgba(0, 0, 0, 0.15), 0px 42px 44px rgba(0, 0, 0, 0.12)',
    '0px 105px 210px rgba(0, 0, 0, 0.15), 0px 44px 46px rgba(0, 0, 0, 0.12)',
    '0px 110px 220px rgba(0, 0, 0, 0.15), 0px 46px 48px rgba(0, 0, 0, 0.12)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '12px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: '#6366f1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366f1',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});