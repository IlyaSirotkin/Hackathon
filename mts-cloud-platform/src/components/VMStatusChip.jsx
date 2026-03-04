import { Chip } from '@mui/material';
import {
    PlayArrow as RunningIcon,
    Stop as StoppedIcon,
    HourglassEmpty as PendingIcon,
} from '@mui/icons-material';

const statusConfig = {
    running: { label: 'Работает', color: 'success', icon: <RunningIcon sx={{ fontSize: 16 }} /> },
    stopped: { label: 'Остановлена', color: 'default', icon: <StoppedIcon sx={{ fontSize: 16 }} /> },
    creating: { label: 'Создаётся', color: 'info', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
    error: { label: 'Ошибка', color: 'error', icon: null },
};

export default function VMStatusChip({ status }) {
    const config = statusConfig[status] || statusConfig.stopped;
    return (
        <Chip
            label={config.label}
            color={config.color}
            icon={config.icon}
            size="small"
            variant="outlined"
        />
    );
}