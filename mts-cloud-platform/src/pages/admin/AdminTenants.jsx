import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Chip, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Tooltip, Alert, CircularProgress, Snackbar, Grid, Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as ActiveIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import ResourceBar from '../../components/ResourceBar';
import { tenantsAPI } from '../../services/api';

export default function AdminTenants() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(null);
    const [openDelete, setOpenDelete] = useState(null);
    const [openBan, setOpenBan] = useState(null);

    const [form, setForm] = useState({
        name: '', admin: '', maxVMs: 5, maxCPU: 16, maxRAM: 32, maxDisk: 200,
    });

    const loadTenants = () => {
        setLoading(true);
        tenantsAPI.getAll()
            .then(setTenants)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadTenants(); }, []);

    // === Создание ===
    const handleCreate = async () => {
        if (!form.name.trim() || !form.admin.trim()) {
            setError('Заполните все поля');
            return;
        }
        try {
            await tenantsAPI.create({
                name: form.name,
                admin: form.admin,
                maxVMs: form.maxVMs,
                maxCPU: form.maxCPU,
                maxRAM: form.maxRAM,
                maxDisk: form.maxDisk,
            });
            setOpenCreate(false);
            setForm({ name: '', admin: '', maxVMs: 5, maxCPU: 16, maxRAM: 32, maxDisk: 200 });
            setSuccess(`Тенант "${form.name}" создан`);
            loadTenants();
        } catch (err) {
            setError(err.message);
        }
    };

    // === Редактирование ===
    const openEditDialog = (tenant) => {
        setForm({
            name: tenant.name,
            admin: tenant.admin || '',
            maxVMs: tenant.quota.maxVMs,
            maxCPU: tenant.quota.maxCPU,
            maxRAM: tenant.quota.maxRAM,
            maxDisk: tenant.quota.maxDisk,
        });
        setOpenEdit(tenant.id);
    };

    const handleEdit = async () => {
        try {
            await tenantsAPI.update(openEdit, {
                name: form.name,
                admin: form.admin,
                maxVMs: form.maxVMs,
                maxCPU: form.maxCPU,
                maxRAM: form.maxRAM,
                maxDisk: form.maxDisk,
            });
            setOpenEdit(null);
            setSuccess('Тенант обновлён');
            loadTenants();
        } catch (err) {
            setError(err.message);
        }
    };

    // === Блокировка ===
    const handleToggleBan = async (id) => {
        const tenant = tenants.find((t) => t.id === id);
        const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
        try {
            await tenantsAPI.setStatus(id, newStatus);
            setOpenBan(null);
            setSuccess(
                newStatus === 'suspended'
                    ? `Тенант "${tenant.name}" заблокирован`
                    : `Тенант "${tenant.name}" разблокирован`
            );
            loadTenants();
        } catch (err) {
            setError(err.message);
        }
    };

    // === Удаление ===
    const handleDelete = async (id) => {
        const tenant = tenants.find((t) => t.id === id);
        try {
            await tenantsAPI.delete(id);
            setOpenDelete(null);
            setSuccess(`Тенант "${tenant?.name}" удалён`);
            loadTenants();
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

    const TenantForm = () => (
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
                label="Название организации" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                fullWidth
            />
            <TextField
                label="Email администратора" value={form.admin}
                onChange={(e) => setForm({ ...form, admin: e.target.value })}
                fullWidth
            />
            <Typography variant="subtitle2" sx={{ mt: 1, color: 'text.secondary' }}>
                Квоты ресурсов
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="Макс. ВМ" type="number" value={form.maxVMs}
                    onChange={(e) => setForm({ ...form, maxVMs: Math.max(1, parseInt(e.target.value) || 1) })}
                    fullWidth inputProps={{ min: 1 }}
                />
                <TextField
                    label="Макс. CPU" type="number" value={form.maxCPU}
                    onChange={(e) => setForm({ ...form, maxCPU: Math.max(1, parseInt(e.target.value) || 1) })}
                    fullWidth inputProps={{ min: 1 }}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    label="Макс. RAM (ГБ)" type="number" value={form.maxRAM}
                    onChange={(e) => setForm({ ...form, maxRAM: Math.max(1, parseInt(e.target.value) || 1) })}
                    fullWidth inputProps={{ min: 1 }}
                />
                <TextField
                    label="Макс. Диск (ГБ)" type="number" value={form.maxDisk}
                    onChange={(e) => setForm({ ...form, maxDisk: Math.max(10, parseInt(e.target.value) || 10) })}
                    fullWidth inputProps={{ min: 10 }}
                />
            </Box>
        </Box>
    );

    return (
        <Box>
            {/* Заголовок */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Управление тенантами</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {tenants.length} тенантов · {tenants.filter((t) => t.status === 'active').length} активных · {tenants.filter((t) => t.status === 'suspended').length} заблокированных
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}
                        sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                    Создать тенант
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {/* Таблица */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{
                                '& th': {
                                    fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase',
                                    letterSpacing: 0.5, color: 'text.secondary',
                                    borderBottom: '1px solid rgba(255,255,255,0.08)', py: 2,
                                }
                            }}>
                                <TableCell>Организация</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>Использование</TableCell>
                                <TableCell>Квоты</TableCell>
                                <TableCell>Создан</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow
                                    key={tenant.id}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                        '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', py: 2 },
                                        opacity: tenant.status === 'suspended' ? 0.6 : 1,
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{
                                                width: 36, height: 36, borderRadius: 2,
                                                bgcolor: tenant.status === 'active' ? 'rgba(41,121,255,0.1)' : 'rgba(227,6,17,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <BusinessIcon sx={{
                                                    fontSize: 18,
                                                    color: tenant.status === 'active' ? '#2979FF' : '#E30611',
                                                }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {tenant.admin || '—'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            icon={tenant.status === 'active'
                                                ? <ActiveIcon sx={{ fontSize: '14px !important' }} />
                                                : <BlockIcon sx={{ fontSize: '14px !important' }} />}
                                            label={tenant.status === 'active' ? 'Активен' : 'Заблокирован'}
                                            size="small"
                                            sx={{
                                                bgcolor: tenant.status === 'active' ? 'rgba(0,200,83,0.1)' : 'rgba(227,6,17,0.1)',
                                                color: tenant.status === 'active' ? '#00C853' : '#E30611',
                                                border: 'none', fontWeight: 600, fontSize: '0.75rem',
                                                '& .MuiChip-icon': { color: tenant.status === 'active' ? '#00C853' : '#E30611' },
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2">
                                            {tenant.usage.vms} ВМ · {tenant.usage.cpu} vCPU · {tenant.usage.ram} ГБ
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {tenant.quota.maxVMs} ВМ · {tenant.quota.maxCPU} vCPU · {tenant.quota.maxRAM} ГБ
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {new Date(tenant.createdAt).toLocaleDateString('ru-RU')}
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            <Tooltip title="Редактировать">
                                                <IconButton size="small" onClick={() => openEditDialog(tenant)}
                                                            sx={{ color: '#2979FF', '&:hover': { bgcolor: 'rgba(41,121,255,0.1)' } }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={tenant.status === 'active' ? 'Заблокировать' : 'Разблокировать'}>
                                                <IconButton size="small" onClick={() => setOpenBan(tenant.id)}
                                                            sx={{
                                                                color: tenant.status === 'active' ? '#FFB300' : '#00C853',
                                                                '&:hover': {
                                                                    bgcolor: tenant.status === 'active' ? 'rgba(255,179,0,0.1)' : 'rgba(0,200,83,0.1)',
                                                                },
                                                            }}>
                                                    {tenant.status === 'active' ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Удалить">
                                                <IconButton size="small" onClick={() => setOpenDelete(tenant.id)}
                                                            sx={{ color: '#E30611', '&:hover': { bgcolor: 'rgba(227,6,17,0.1)' } }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Квоты */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 700 }}>Использование квот</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {tenants.map((tenant) => (
                    <Card key={tenant.id + '-quota'} sx={{
                        flex: '1 1 320px', maxWidth: 420,
                        border: '1px solid',
                        borderColor: tenant.status === 'suspended' ? 'rgba(227,6,17,0.2)' : 'rgba(255,255,255,0.06)',
                        borderRadius: 3,
                        opacity: tenant.status === 'suspended' ? 0.7 : 1,
                    }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                                <Chip
                                    label={tenant.status === 'active' ? 'Активен' : 'Заблокирован'}
                                    size="small"
                                    sx={{
                                        bgcolor: tenant.status === 'active' ? 'rgba(0,200,83,0.1)' : 'rgba(227,6,17,0.1)',
                                        color: tenant.status === 'active' ? '#00C853' : '#E30611',
                                        border: 'none', fontWeight: 600,
                                    }}
                                />
                            </Box>
                            {tenant.status === 'suspended' && (
                                <Alert severity="error" sx={{ mb: 2, py: 0 }}>
                                    Клиент не может войти в систему
                                </Alert>
                            )}
                            <ResourceBar label="ВМ" used={tenant.usage.vms} total={tenant.quota.maxVMs} />
                            <ResourceBar label="CPU" used={tenant.usage.cpu} total={tenant.quota.maxCPU} unit=" vCPU" />
                            <ResourceBar label="RAM" used={tenant.usage.ram} total={tenant.quota.maxRAM} unit=" ГБ" />
                            <ResourceBar label="Диск" used={tenant.usage.disk} total={tenant.quota.maxDisk} unit=" ГБ" />
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* ===== Диалог СОЗДАНИЯ ===== */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Создать тенант</DialogTitle>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <DialogContent><TenantForm /></DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenCreate(false)} sx={{ textTransform: 'none' }}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreate} sx={{ textTransform: 'none', px: 3 }}>
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== Диалог РЕДАКТИРОВАНИЯ ===== */}
            <Dialog open={!!openEdit} onClose={() => setOpenEdit(null)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Редактировать тенант</DialogTitle>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <DialogContent><TenantForm /></DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenEdit(null)} sx={{ textTransform: 'none' }}>Отмена</Button>
                    <Button variant="contained" onClick={handleEdit} sx={{ textTransform: 'none', px: 3 }}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== Диалог БЛОКИРОВКИ ===== */}
            <Dialog open={!!openBan} onClose={() => setOpenBan(null)} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {tenants.find((t) => t.id === openBan)?.status === 'active'
                        ? 'Заблокировать тенант?' : 'Разблокировать тенант?'}
                </DialogTitle>
                <DialogContent>
                    {tenants.find((t) => t.id === openBan)?.status === 'active' ? (
                        <Box>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Клиент <strong>{tenants.find((t) => t.id === openBan)?.name}</strong> будет заблокирован
                            </Alert>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Клиент не сможет войти</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• ВМ продолжат работать</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Управление станет недоступно</Typography>
                        </Box>
                    ) : (
                        <Alert severity="success">
                            Клиент <strong>{tenants.find((t) => t.id === openBan)?.name}</strong> будет разблокирован
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenBan(null)} sx={{ textTransform: 'none' }}>Отмена</Button>
                    <Button
                        variant="contained"
                        color={tenants.find((t) => t.id === openBan)?.status === 'active' ? 'error' : 'success'}
                        onClick={() => handleToggleBan(openBan)}
                        sx={{ textTransform: 'none' }}
                    >
                        {tenants.find((t) => t.id === openBan)?.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== Диалог УДАЛЕНИЯ ===== */}
            <Dialog open={!!openDelete} onClose={() => setOpenDelete(null)} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Удалить тенант?</DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>Это действие необратимо!</Alert>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Тенант <strong>"{tenants.find((t) => t.id === openDelete)?.name}"</strong> и все его ВМ будут удалены.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenDelete(null)} sx={{ textTransform: 'none' }}>Отмена</Button>
                    <Button variant="contained" color="error" onClick={() => handleDelete(openDelete)}
                            sx={{ textTransform: 'none' }}>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Уведомления */}
            <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
            </Snackbar>
        </Box>
    );
}