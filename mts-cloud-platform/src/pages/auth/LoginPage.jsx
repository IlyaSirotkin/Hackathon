import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, TextField, Button, Typography,
    Alert, InputAdornment, IconButton, Divider, Chip,
} from '@mui/material';
import {
    Visibility, VisibilityOff, Cloud as CloudIcon,
    Email as EmailIcon, Lock as LockIcon,
} from '@mui/icons-material';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (role) => {
        if (role === 'admin') {
            setEmail('admin@mtscloud.ru');
            setPassword('admin123');
        } else {
            setEmail('client@company.ru');
            setPassword('client123');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                background: 'linear-gradient(135deg, #0A0A1A 0%, #1A0A0A 50%, #0A0A1A 100%)',
                p: 2,
            }}
        >
            <Card sx={{ maxWidth: 420, width: '100%', p: 1 }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <CloudIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
                            MTS Cloud
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Облачная платформа IaaS
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Пароль"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, py: 1.3 }}
                        >
                            {loading ? 'Вход...' : 'Войти'}
                        </Button>
                    </form>

                    <Divider sx={{ my: 3 }}>
                        <Chip label="Демо-доступ" size="small" variant="outlined" />
                    </Divider>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => fillDemo('admin')}
                            sx={{ fontSize: '0.75rem' }}
                        >
                            Админ
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => fillDemo('client')}
                            sx={{ fontSize: '0.75rem' }}
                        >
                            Клиент
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}