import { Box, Typography, LinearProgress } from '@mui/material';

export default function ResourceBar({ label, used, total, unit = '' }) {
    const percent = total > 0 ? Math.round((used / total) * 100) : 0;

    const getColor = (p) => {
        if (p >= 90) return 'error';
        if (p >= 70) return 'warning';
        return 'primary';
    };

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {used}{unit} / {total}{unit} ({percent}%)
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={percent}
                color={getColor(percent)}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.05)',
                }}
            />
        </Box>
    );
}