import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#E30611',
            light: '#FF4444',
            dark: '#B00000',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#1A1A2E',
            light: '#2D2D44',
            dark: '#0F0F1A',
        },
        background: {
            default: '#0A0A1A',
            paper: '#12122A',
        },
        success: {
            main: '#00C853',
        },
        warning: {
            main: '#FFB300',
        },
        error: {
            main: '#E30611',
        },
        info: {
            main: '#2979FF',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0B0C8',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid rgba(255,255,255,0.08)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                    padding: '8px 20px',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundImage: 'none',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                },
            },
        },
    },
});

export default theme;