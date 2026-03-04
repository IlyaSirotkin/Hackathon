import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Box, Card, CardContent, Typography, Button, Grid, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, Tooltip, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow,
} from '@mui/material';
import {
    Add as AddIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    Refresh as RestartIcon,
    Delete as DeleteIcon,
    Computer as VMIcon,
    ViewList as ListView,
    ViewModule as GridView,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import VMStatusChip from '../../components/VMStatusChip';
import { mockVMs, mockTenants } from '../../services/mockData';

const OS_OPTIONS = [
    'Ubuntu 22.04',
    'Ubuntu 24.04',
    'Debian 12',
    'CentOS 9',
    'RHEL 9',
    'Windows Server 2022',
];

export default function ClientVMs() {
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const [vms, setVms] = useState([]);
    const [tenant, setTenant] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [openDelete, setOpenDelete] = useState(null);
    const [gridMode, setGridMode] = useState(false);
    const [newVM, setNewVM] = useState({
        name: '',
        os: 'Ubuntu 22.04',
        cpu: 1,
        ram: 1,
        disk: 20,
    });

    useEffect(() => {
        const t = mockTenants.find((t) => t.id === user.tenantId) || mockTenants[0];
        setTenant(t);
        setVms(mockVMs.filter((vm) => vm.tenantId === t.id));
    }, [user]);

    const handleAction = (vmId, action) => {
        setVms((prev) =>
            prev.map((vm) => {
                if (vm.id !== vmId) return vm;
                if (action === 'start') return { ...vm, status: 'running' };
                if (action === 'stop') return { ...vm, status: 'stopped' };
                if (action === 'restart') return { ...vm, status: 'running' };
                return vm;
            })
        );
        const actionLabels = {
            start: 'запущена',
            stop: 'остановлена',
            restart: 'перезагружена',
        };
        enqueueSnackbar(`ВМ ${actionLabels[action]}`, { variant: 'success' });
    };

    const handleCreate = () => {
        if (!newVM.name.trim()) {
            enqueueSnackbar('Введите имя ВМ', { variant: 'warning' });
            return;
        }
        if (tenant && vms.length >= tenant.quota.maxVMs) {
            enqueueSnackbar('Достигнут лимит виртуальных машин', { variant: 'error' });
            return;
        }

        const vm = {
            id: 'vm-' + Date.now(),
            tenantId: tenant?.id,
            name: newVM.name,
            status: 'running',
            os: newVM.os,
            cpu: newVM.cpu,
            ram: newVM.ram,
            disk: newVM.disk,
            ip: `10.10.1.${20 + vms.length}`,
            network: `vnet-${tenant?.id}`,
            createdAt: new Date().toISOString(),
        };

        setVms((prev) => [...prev, vm]);
        setOpenCreate(false);
        setNewVM({ name: '', os: 'Ubuntu 22.04', cpu: 1, ram: 1, disk: 20 });
        enqueueSnackbar(`ВМ "${vm.name}" создана`, { variant: 'success' });
    };

    const handleDelete = (vmId) => {
        setVms((prev) => prev.filter((vm) => vm.id !== vmId));
        setOpenDelete(null);
        enqueueSnackbar('ВМ удалена', { variant: 'info' });
    };

    const ActionButtons = ({ vm }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Запустить">
        <span>
          <IconButton
              size="small"
              color="success"
              disabled={vm.status === 'running'}
              onClick={() => handleAction(vm.id, 'start')}
          >
            <StartIcon fontSize="small" />
          </IconButton>
        </span>
            </Tooltip>
            <Tooltip title="Остановить">
        <span>
          <IconButton
              size="small"
              color="warning"
              disabled={vm.status === 'stopped'}
              onClick={() => handleAction(vm.id, 'stop')}
          >
            <StopIcon fontSize="small" />
          </IconButton>
        </span>
            </Tooltip>
            <Tooltip title="Перезагрузить">
        <span>
          <IconButton
              size="small"
              color="info"
              disabled={vm.status === 'stopped'}
              onClick={() => handleAction(vm.id, 'restart')}
          >
            <RestartIcon fontSize="small" />
          </IconButton>
        </span>
            </Tooltip>
            <Tooltip title="Удалить">
                <IconButton
                    size="small"
                    color="error"
                    onClick={() => setOpenDelete(vm.id)}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );

    return (
        <Box>
            {/* ===== ЗАГОЛОВОК ===== */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h5">Виртуальные машины</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {vms.length} из {tenant?.quota.maxVMs || '?'} доступных
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={gridMode ? 'Список' : 'Карточки'}>
                        <IconButton onClick={() => setGridMode(!gridMode)}>
                            {gridMode ? <ListView /> : <GridView />}
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreate(true)}
                    >
                        Создать ВМ
                    </Button>
                </Box>
            </Box>

            {/* ===== ПУСТОЕ СОСТОЯНИЕ ===== */}
            {vms.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <VMIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Нет виртуальных машин
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', mb: 2 }}
                        >
                            Создайте первую виртуальную машину
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenCreate(true)}
                        >
                            Создать ВМ
                        </Button>
                    </CardContent>
                </Card>
            ) : gridMode ? (
                /* ===== РЕЖИМ КАРТОЧЕК ===== */
                <Grid container spacing={2}>
                    {vms.map((vm) => (
                        <Grid item xs={12} sm={6} md={4} key={vm.id}>
                            <Card
                                sx={{
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        transition: '0.2s',
                                    },
                                    height: '100%',
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            mb: 2,
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {vm.name}
                                        </Typography>
                                        <VMStatusChip status={vm.status} />
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: 'text.secondary', mb: 0.5 }}
                                    >
                                        OS: {vm.os}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: 'text.secondary', mb: 0.5 }}
                                    >
                                        {vm.cpu} vCPU · {vm.ram} ГБ RAM · {vm.disk} ГБ
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: 'text.secondary', mb: 2 }}
                                    >
                                        IP: {vm.ip}
                                    </Typography>
                                    <ActionButtons vm={vm} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                /* ===== РЕЖИМ ТАБЛИЦЫ ===== */
                <Card>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Имя</TableCell>
                                    <TableCell>Статус</TableCell>
                                    <TableCell>ОС</TableCell>
                                    <TableCell>Ресурсы</TableCell>
                                    <TableCell>IP</TableCell>
                                    <TableCell align="right">Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {vms.map((vm) => (
                                    <TableRow key={vm.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {vm.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: 'text.secondary' }}
                                            >
                                                {vm.id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <VMStatusChip status={vm.status} />
                                        </TableCell>
                                        <TableCell>{vm.os}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {vm.cpu} vCPU · {vm.ram} ГБ · {vm.disk} ГБ
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ fontFamily: 'monospace' }}
                                            >
                                                {vm.ip}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <ActionButtons vm={vm} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {/* ===== ДИАЛОГ СОЗДАНИЯ ВМ ===== */}
            <Dialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Создать виртуальную машину</DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            pt: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                        }}
                    >
                        <TextField
                            label="Имя виртуальной машины"
                            value={newVM.name}
                            onChange={(e) => setNewVM({ ...newVM, name: e.target.value })}
                            fullWidth
                            placeholder="например: web-server-01"
                        />
                        <TextField
                            label="Операционная система"
                            value={newVM.os}
                            onChange={(e) => setNewVM({ ...newVM, os: e.target.value })}
                            select
                            fullWidth
                        >
                            {OS_OPTIONS.map((os) => (
                                <MenuItem key={os} value={os}>
                                    {os}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField
                                    label="CPU (vCPU)"
                                    type="number"
                                    value={newVM.cpu}
                                    onChange={(e) =>
                                        setNewVM({
                                            ...newVM,
                                            cpu: Math.max(1, parseInt(e.target.value) || 1),
                                        })
                                    }
                                    fullWidth
                                    inputProps={{ min: 1, max: 16 }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    label="RAM (ГБ)"
                                    type="number"
                                    value={newVM.ram}
                                    onChange={(e) =>
                                        setNewVM({
                                            ...newVM,
                                            ram: Math.max(1, parseInt(e.target.value) || 1),
                                        })
                                    }
                                    fullWidth
                                    inputProps={{ min: 1, max: 64 }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    label="Диск (ГБ)"
                                    type="number"
                                    value={newVM.disk}
                                    onChange={(e) =>
                                        setNewVM({
                                            ...newVM,
                                            disk: Math.max(10, parseInt(e.target.value) || 10),
                                        })
                                    }
                                    fullWidth
                                    inputProps={{ min: 10, max: 500 }}
                                />
                            </Grid>
                        </Grid>
                        <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography
                                    variant="body2"
                                    sx={{ color: 'text.secondary', mb: 1 }}
                                >
                                    Конфигурация:
                                </Typography>
                                <Typography variant="body2">
                                    {newVM.os} · {newVM.cpu} vCPU · {newVM.ram} ГБ RAM ·{' '}
                                    {newVM.disk} ГБ SSD
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenCreate(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreate}>
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== ДИАЛОГ УДАЛЕНИЯ ===== */}
            <Dialog
                open={!!openDelete}
                onClose={() => setOpenDelete(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Удалить виртуальную машину?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Это действие необратимо. Все данные виртуальной машины будут
                        потеряны.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenDelete(null)}>Отмена</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDelete(openDelete)}
                    >
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}