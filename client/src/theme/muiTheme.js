import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', dark: '#4338ca', light: '#818cf8' },
    secondary: { main: '#06b6d4' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    background: { default: '#f1f5f9', paper: '#ffffff' }
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700, fontSize: '1.35rem' },
    h3: { fontWeight: 600, fontSize: '1.1rem' }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)' }
      }
    }
  }
});
