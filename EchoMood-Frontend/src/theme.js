import { createTheme } from '@mui/material/styles';

// App brand colors
export const brandColors = {
  primary: '#4300FF',
  secondary: '#0065F8',
  accent1: '#00CAFF',
  accent2: '#00FFDE',
  bg: '#0b0c12',
  surface: '#12131a',
  text: '#e6f2ff',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: brandColors.primary },
    secondary: { main: brandColors.secondary },
    info: { main: brandColors.accent1 },
    success: { main: brandColors.accent2 },
    background: {
      default: brandColors.bg,
      paper: brandColors.surface,
    },
    text: {
      primary: brandColors.text,
      secondary: '#b8c6db',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    body1: { lineHeight: 1.6 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;