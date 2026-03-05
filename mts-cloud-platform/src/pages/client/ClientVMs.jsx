import { useState, useEffect } from 'react';
import {
    Box, Typography, Card, Button, Chip, IconButton, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Alert, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Snackbar, Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    Refresh as RebootIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Computer as VMIcon,
    Circle as CircleIcon,
} from '@mui/icons-material';
import { vmsAPI } from '../../services/api';

const OS_OPTIONS = [
    'Ubuntu 22.04', 'Ubuntu 24.04', 'CentOS 9', 'Debian 12', 'Windows Server 2022',
];
const CPU_OPTIONS = [1, 2, 4, 8, 16];
const RAM_OPTIONS = [1, 2, 4, 8, 16, 32];
const DISK_OPTIONS = [20, 50, 100, 200, 500];

const statusConfig = {
    running: { label: 'Работает', color: '#00C853', bg: 'rgba(0,200,83,0.1)' },
    stopped: { label: 'Остановлена', color: '#9E9E9E', bg: 'rgba(158,158,158,0.1)' },
    creating: { label: 'Создаётся', color: '#FFB300', bg: 'rgba(255,179,0,0.1)' },
};

export default function ClientVMs() {
    const [vms, setVms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Диалог создания
    const [createOpen, setCreateOpen] = useState(false);
    const [newVM, setNewVM] = useState({ name: '', os: 'Ubuntu 22.04', cpu: 2, ram: 4, disk: 50 });

    // Диалог редактирования
    const [editOpen, setEditOpen] = useState(false);
    const [editVM, setEditVM] = useState(null);

    const loadVMs = () => {
        setLoading(true);
        vmsAPI.getAll()
            .then(setVms)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadVMs(); }, []);

    // === Действия ===
    const handleAction = async (id, action) => {
        try {
            await vmsAPI.action(id, action);
            const labels = { start: 'запущена', stop: 'остановлена', reboot: 'перезагружена' };
            setSuccess(`ВМ ${labels[action]}`);
            loadVMs();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Удалить ВМ "${name}"? Это действие необратимо.`)) return;
        try {
            await vmsAPI.delete(id);
            setSuccess('ВМ удалена');
            loadVMs();
        } catch (err) {
            setError(err.message);
        }
    };

    // === Создание ===
    const handleCreate = async () => {
        try {
            await vmsAPI.create(newVM);
            setCreateOpen(false);
            setNewVM({ name: '', os: 'Ubuntu 22.04', cpu: 2, ram: 4, disk: 50 });
            setSuccess('ВМ создана');
            loadVMs();
        } catch (err) {
            setError(err.message);
        }
    };

    // === Редактирование ===
    const openEdit = (vm) => {
        setEditVM({ ...vm });
        setEditOpen(true);
    };

    const handleEdit = async () => {
        try {
            await vmsAPI.update(editVM.id, {
                name: editVM.name,
                cpu: editVM.cpu,
                ram: editVM.ram,
                disk: editVM.disk,
                os: editVM.os,
            });
            setEditOpen(false);
            setEditVM(null);
            setSuccess('ВМ обновлена');
            loadVMs();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const runningCount = vms.filter((v) => v.status === 'running').length;
    const stoppedCount = vms.filter((v) => v.status === 'stopped').length;

    return (
        <Box>
            {/* Заголовок */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Виртуальные машины
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Всего: {vms.length}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CircleIcon sx={{ fontSize: 8, color: '#00C853' }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {runningCount} работают
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CircleIcon sx={{ fontSize: 8, color: '#9E9E9E' }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {stoppedCount} остановлены
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateOpen(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
                >
                    Создать ВМ
                </Button>
            </Box>

            {/* Ошибки */}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {/* Таблица */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.08)', py: 2 } }}>
                                <TableCell>Имя</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>ОС</TableCell>
                                <TableCell>CPU</TableCell>
                                <TableCell>RAM</TableCell>
                                <TableCell>Диск</TableCell>
                                <TableCell>IP</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                                        <VMIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                                            Нет виртуальных машин
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                            Нажмите "Создать ВМ" чтобы начать
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : vms.map((vm) => {
                                const status = statusConfig[vm.status] || statusConfig.stopped;
                                return (
                                    <TableRow
                                        key={vm.id}
                                        sx={{
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                            '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', py: 2 },
                                        }}
                                    >
                                        {/* Имя */}
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{
                                                    width: 36, height: 36, borderRadius: 2,
                                                    bgcolor: 'rgba(227,6,17,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <VMIcon sx={{ fontSize: 18, color: '#E30611' }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{vm.name}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        {vm.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Статус */}
                                        <TableCell>
                                            <Chip
                                                icon={<CircleIcon sx={{ fontSize: '8px !important' }} />}
                                                label={status.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: status.bg,
                                                    color: status.color,
                                                    border: 'none',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    '& .MuiChip-icon': { color: status.color },
                                                }}
                                            />
                                        </TableCell>

                                        {/* ОС */}
                                        <TableCell>
                                            <Typography variant="body2">{vm.os}</Typography>
                                        </TableCell>

                                        {/* CPU */}
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{vm.cpu}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>vCPU</Typography>
                                        </TableCell>

                                        {/* RAM */}
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{vm.ram}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>GB</Typography>
                                        </TableCell>

                                        {/* Диск */}
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{vm.disk}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>GB</Typography>
                                        </TableCell>

                                        {/* IP */}
                                        <TableCell>
                                            <Typography variant="body2" sx={{
                                                fontFamily: 'monospace', bgcolor: 'rgba(255,255,255,0.05)',
                                                px: 1, py: 0.3, borderRadius: 1, display: 'inline-block',
                                            }}>
                                                {vm.ip || '—'}
                                            </Typography>
                                        </TableCell>

                                        {/* Действия */}
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                {vm.status === 'stopped' && (
                                                    <Tooltip title="Запустить">
                                                        <IconButton size="small" onClick={() => handleAction(vm.id, 'start')}
                                                                    sx={{ color: '#00C853', '&:hover': { bgcolor: 'rgba(0,200,83,0.1)' } }}>
                                                            <StartIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {vm.status === 'running' && (
                                                    <>
                                                        <Tooltip title="Остановить">
                                                            <IconButton size="small" onClick={() => handleAction(vm.id, 'stop')}
                                                                        sx={{ color: '#FFB300', '&:hover': { bgcolor: 'rgba(255,179,0,0.1)' } }}>
                                                                <StopIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Перезагрузить">
                                                            <IconButton size="small" onClick={() => handleAction(vm.id, 'reboot')}
                                                                        sx={{ color: '#2979FF', '&:hover': { bgcolor: 'rgba(41,121,255,0.1)' } }}>
                                                                <RebootIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                <Tooltip title={vm.status === 'running' ? 'Остановите для редактирования' : 'Редактировать'}>
                          <span>
                            <IconButton size="small" onClick={() => openEdit(vm)}
                                        disabled={vm.status === 'running'}
                                        sx={{ color: '#AB47BC', '&:hover': { bgcolor: 'rgba(171,71,188,0.1)' } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </span>
                                                </Tooltip>
                                                <Tooltip title="Удалить">
                                                    <IconButton size="small" onClick={() => handleDelete(vm.id, vm.name)}
                                                                sx={{ color: '#E30611', '&:hover': { bgcolor: 'rgba(227,6,17,0.1)' } }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ===== Диалог СОЗДАНИЯ ===== */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Создать виртуальную машину</DialogTitle>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <DialogContent sx={{ pt: 3 }}>
                    <TextField
                        fullWidth label="Имя ВМ" value={newVM.name}
                        onChange={(e) => setNewVM({ ...newVM, name: e.target.value })}
                        placeholder="например: web-server-01"
                        sx={{ mb: 2.5 }}
                    />
                    <TextField
                        fullWidth select label="Операционная система" value={newVM.os}
                        onChange={(e) => setNewVM({ ...newVM, os: e.target.value })}
                        sx={{ mb: 2.5 }}
                    >
                        {OS_OPTIONS.map((os) => <MenuItem key={os} value={os}>{os}</MenuItem>)}
                    </TextField>

                    <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                        Ресурсы
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth select label="CPU (vCPU)" value={newVM.cpu}
                            onChange={(e) => setNewVM({ ...newVM, cpu: Number(e.target.value) })}
                        >
                            {CPU_OPTIONS.map((v) => <MenuItem key={v} value={v}>{v} vCPU</MenuItem>)}
                        </TextField>
                        <TextField
                            fullWidth select label="RAM (ГБ)" value={newVM.ram}
                            onChange={(e) => setNewVM({ ...newVM, ram: Number(e.target.value) })}
                        >
                            {RAM_OPTIONS.map((v) => <MenuItem key={v} value={v}>{v} ГБ</MenuItem>)}
                        </TextField>
                        <TextField
                            fullWidth select label="Диск (ГБ)" value={newVM.disk}
                            onChange={(e) => setNewVM({ ...newVM, disk: Number(e.target.value) })}
                        >
                            {DISK_OPTIONS.map((v) => <MenuItem key={v} value={v}>{v} ГБ</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* Превью */}
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2, mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Конфигурация: {newVM.cpu} vCPU · {newVM.ram} ГБ RAM · {newVM.disk} ГБ диск · {newVM.os}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={!newVM.name}
                            sx={{ textTransform: 'none', px: 3 }}>
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== Диалог РЕДАКТИРОВАНИЯ ===== */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Редактировать ВМ
                </DialogTitle>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                {editVM && (
                    <DialogContent sx={{ pt: 3 }}>
                        <Alert severity="info" sx={{ mb: 2.5 }}>
                            Ресурсы можно менять только у остановленной ВМ
                        </Alert>

                        <TextField
                            fullWidth label="Имя ВМ" value={editVM.name}
                            onChange={(e) => setEditVM({ ...editVM, name: e.target.value })}
                            sx={{ mb: 2.5 }}
                        />
                        <TextField
                            fullWidth select label="Операционная система" value={editVM.os}
                            onChange={(e) => setEditVM({ ...editVM, os: e.target.value })}
                            sx={{ mb: 2.5 }}
                        >
                            {OS_OPTIONS.map((os) => <MenuItem key={os} value={os}>{os}</MenuItem>)}
                        </TextField>

                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                            Ресурсы
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth select label="CPU (vCPU)" value={editVM.cpu}
                                onChange={(e) => setEditVM({ ...editVM, cpu: Number(e.target.value) })}
                            >
                                {CPU_OPTIONS.map((v) => <MenuItem key={v} value={v}>{v} vCPU</MenuItem>)}
                            </TextField>
                            <TextField
                                fullWidth select label="RAM (ГБ)" value={editVM.ram}
                                onChange={(e) => setEditVM({ ...editVM, ram: Number(e.target.value) })}
                            >
                                {RAM_OPTIONS.map((v) => <MenuItem key={v} value={v}>{v} ГБ</MenuItem>)}
                            </TextField>
                            <TextField
                                fullWidth select label="Диск (ГБ)" value={editVM.disk}
                                onChange={(e) => setEditVM({ ...editVM, disk: Number(e.target.value) })}
                            >
                                {DISK_OPTIONS.map((v) => <MenuItem key={v} value={v}>{v} ГБ</MenuItem>)}
                            </TextField>
                        </Box>

                        {/* Превью изменений */}
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 2, mt: 1 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Новая конфигурация: {editVM.cpu} vCPU · {editVM.ram} ГБ RAM · {editVM.disk} ГБ диск · {editVM.os}
                            </Typography>
                        </Box>
                    </DialogContent>
                )}
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none' }}>Отмена</Button>
                    <Button variant="contained" onClick={handleEdit} disabled={!editVM?.name}
                            sx={{ textTransform: 'none', px: 3 }}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Уведомление об успехе */}
            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
            </Snackbar>
        </Box>
    );
}