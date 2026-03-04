import { Card, CardContent, Typography, Box } from '@mui/material';

export default function StatCard({ title, value, subtitle, icon, color = 'primary.main' }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.8rem' }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {icon && (
                        <Box
                            sx={{
                                p: 1.2,
                                borderRadius: 2,
                                bgcolor: `${typeof color === 'string' && color.includes('.') ? color.split('.')[0] : color}`,
                                background: `linear-gradient(135deg, ${color === 'primary.main' ? '#E30611' : color === 'success.main' ? '#00C853' : color === 'info.main' ? '#2979FF' : color === 'warning.main' ? '#FFB300' : '#E30611'}22, ${color === 'primary.main' ? '#E30611' : color === 'success.main' ? '#00C853' : color === 'info.main' ? '#2979FF' : color === 'warning.main' ? '#FFB300' : '#E30611'}11)`,
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}