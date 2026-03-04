import { useState } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Grid, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Chip, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Tooltip, Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as ActiveIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import ResourceBar from '../../components/ResourceBar';
import {
    getTenants,
    setTenants as setStoreTenants,
    updateTenantStatus,
    addTenant as storeAddTenant,
    deleteTenant as storeDeleteTenant,
    updateTenant as storeUpdateTenant,
} from '../../services/store';

export default function AdminTenants() {
    const { enqueueSnackbar } = useSnackbar();
    const [tenants, setTenants] = useState(getTenants());
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(null);
    const [openDelete, setOpenDelete] = useState(null);
    const [openBan, setOpenBan] = useState(null);
    const [form, setForm] = useState({
        name: '',
        admin: '',
        maxVMs: 5,
        maxCPU: 16,
        maxRAM: 32,
        maxDisk: 200,
    });

    // Синхронизация локального стейта со store
    const refreshTenants = () => {
        setTenants([...getTenants()]);
    };

    const handleCreate = () => {
        if (!form.name.trim() || !form.admin.trim()) {
            enqueueSnackbar('Заполните все поля', { variant: 'warning' });
            return;
        }
        const newTenant = {
            id: 'tenant-' + Date.now(),
            name: form.name,
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0],
            admin: form.admin,
            quota: {
                maxVMs: form.maxVMs,
                maxCPU: form.maxCPU,
                maxRAM: form.maxRAM,
                maxDisk: form.maxDisk,
            },
            usage: { vms: 0, cpu: 0, ram: 0, disk: 0 },
        };
        storeAddTenant(newTenant);
        refreshTenants();
        setOpenCreate(false);
        setForm({ name: '', admin: '', maxVMs: 5, maxCPU: 16, maxRAM: 32, maxDisk: 200 });
        enqueueSnackbar(`Тенант "${newTenant.name}" создан`, { variant: 'success' });
    };

    const handleEdit = () => {
        storeUpdateTenant(openEdit, {
            name: form.name,
            admin: form.admin,
            quota: {
                maxVMs: form.maxVMs,
                maxCPU: form.maxCPU,
                maxRAM: form.maxRAM,
                maxDisk: form.maxDisk,
            },
        });
        refreshTenants();
        setOpenEdit(null);
        enqueueSnackbar('Тенант обновлён', { variant: 'success' });
    };

    const handleDelete = (id) => {
        const tenant = tenants.find((t) => t.id === id);
        storeDeleteTenant(id);
        refreshTenants();
        setOpenDelete(null);
        enqueueSnackbar(`Тенант "${tenant?.name}" удалён`, { variant: 'info' });
    };

    const handleToggleBan = (id) => {
        const tenant = tenants.find((t) => t.id === id);
        const newStatus = tenant.status === 'active' ? 'suspended' : 'active';

        updateTenantStatus(id, newStatus);
        refreshTenants();
        setOpenBan(null);

        if (newStatus === 'suspended') {
            enqueueSnackbar(
                `Тенант "${tenant.name}" заблокирован. Клиент не сможет войти.`,
                { variant: 'warning' }
            );
        } else {
            enqueueSnackbar(
                `Тенант "${tenant.name}" разблокирован.`,
                { variant: 'success' }
            );
        }
    };

    const openEditDialog = (tenant) => {
        setForm({
            name: tenant.name,
            admin: tenant.admin,
            maxVMs: tenant.quota.maxVMs,
            maxCPU: tenant.quota.maxCPU,
            maxRAM: tenant.quota.maxRAM,
            maxDisk: tenant.quota.maxDisk,
        });
        setOpenEdit(tenant.id);
    };

    const TenantForm = () => (
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
                label="Название организации"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                fullWidth
            />
            <TextField
                label="Email администратора"
                value={form.admin}
                onChange={(e) => setForm({ ...form, admin: e.target.value })}
                fullWidth
            />
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Квоты ресурсов</Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        label="Макс. ВМ"
                        type="number"
                        value={form.maxVMs}
                        onChange={(e) => setForm({ ...form, maxVMs: Math.max(1, parseInt(e.target.value) || 1) })}
                        fullWidth
                        inputProps={{ min: 1 }}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Макс. CPU (vCPU)"
                        type="number"
                        value={form.maxCPU}
                        onChange={(e) => setForm({ ...form, maxCPU: Math.max(1, parseInt(e.target.value) || 1) })}
                        fullWidth
                        inputProps={{ min: 1 }}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Макс. RAM (ГБ)"
                        type="number"
                        value={form.maxRAM}
                        onChange={(e) => setForm({ ...form, maxRAM: Math.max(1, parseInt(e.target.value) || 1) })}
                        fullWidth
                        inputProps={{ min: 1 }}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Макс. Диск (ГБ)"
                        type="number"
                        value={form.maxDisk}
                        onChange={(e) => setForm({ ...form, maxDisk: Math.max(10, parseInt(e.target.value) || 10) })}
                        fullWidth
                        inputProps={{ min: 10 }}
                    />
                </Grid>
            </Grid>
        </Box>
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5">Управление тенантами</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {tenants.length} тенантов · {tenants.filter((t) => t.status === 'active').length} активных · {tenants.filter((t) => t.status === 'suspended').length} заблокированных
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
                    Создать тенант
                </Button>
            </Box>

            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Организация</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>Ресурсы</TableCell>
                                <TableCell>Квоты</TableCell>
                                <TableCell>Создан</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow
                                    key={tenant.id}
                                    hover
                                    sx={{
                                        opacity: tenant.status === 'suspended' ? 0.6 : 1,
                                        bgcolor: tenant.status === 'suspended' ? 'rgba(227,6,17,0.03)' : 'transparent',
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <BusinessIcon sx={{ color: tenant.status === 'active' ? 'primary.main' : 'error.main' }} />
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{tenant.admin}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={tenant.status === 'active' ? <ActiveIcon sx={{ fontSize: 16 }} /> : <BlockIcon sx={{ fontSize: 16 }} />}
                                            label={tenant.status === 'active' ? 'Активен' : 'Заблокирован'}
                                            size="small"
                                            color={tenant.status === 'active' ? 'success' : 'error'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {tenant.usage.vms} ВМ · {tenant.usage.cpu} vCPU · {tenant.usage.ram} ГБ
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {tenant.quota.maxVMs} ВМ · {tenant.quota.maxCPU} vCPU · {tenant.quota.maxRAM} ГБ
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{tenant.createdAt}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            <Tooltip title="Редактировать">
                                                <IconButton size="small" color="info" onClick={() => openEditDialog(tenant)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={tenant.status === 'active' ? 'Заблокировать' : 'Разблокировать'}>
                                                <IconButton
                                                    size="small"
                                                    color={tenant.status === 'active' ? 'warning' : 'success'}
                                                    onClick={() => setOpenBan(tenant.id)}
                                                >
                                                    {tenant.status === 'active' ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Удалить">
                                                <IconButton size="small" color="error" onClick={() => setOpenDelete(tenant.id)}>
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

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Использование квот</Typography>
            <Grid container spacing={2}>
                {tenants.map((tenant) => (
                    <Grid item xs={12} md={6} lg={4} key={tenant.id + '-quota'}>
                        <Card sx={{
                            border: '1px solid',
                            borderColor: tenant.status === 'suspended' ? 'rgba(227,6,17,0.3)' : 'rgba(255,255,255,0.06)',
                            opacity: tenant.status === 'suspended' ? 0.7 : 1,
                        }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                                    <Chip
                                        label={tenant.status === 'active' ? 'Активен' : 'Заблокирован'}
                                        size="small"
                                        color={tenant.status === 'active' ? 'success' : 'error'}
                                        variant="outlined"
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
                    </Grid>
                ))}
            </Grid>

            {/* Диалог создания */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Создать тенант</DialogTitle>
                <DialogContent><TenantForm /></DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenCreate(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreate}>Создать</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог редактирования */}
            <Dialog open={!!openEdit} onClose={() => setOpenEdit(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать тенант</DialogTitle>
                <DialogContent><TenantForm /></DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenEdit(null)}>Отмена</Button>
                    <Button variant="contained" onClick={handleEdit}>Сохранить</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог блокировки */}
            <Dialog open={!!openBan} onClose={() => setOpenBan(null)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    {tenants.find((t) => t.id === openBan)?.status === 'active'
                        ? '🚫 Заблокировать тенант?'
                        : '✅ Разблокировать тенант?'}
                </DialogTitle>
                <DialogContent>
                    {tenants.find((t) => t.id === openBan)?.status === 'active' ? (
                        <Box>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Клиент <strong>{tenants.find((t) => t.id === openBan)?.name}</strong> будет заблокирован
                            </Alert>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Клиент не сможет войти в личный кабинет</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Текущая сессия будет завершена</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• ВМ продолжат работать</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>• Управление ВМ станет недоступно</Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Клиент <strong>{tenants.find((t) => t.id === openBan)?.name}</strong> будет разблокирован
                            </Alert>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Клиент сможет снова войти и управлять ресурсами.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenBan(null)}>Отмена</Button>
                    <Button
                        variant="contained"
                        color={tenants.find((t) => t.id === openBan)?.status === 'active' ? 'error' : 'success'}
                        onClick={() => handleToggleBan(openBan)}
                    >
                        {tenants.find((t) => t.id === openBan)?.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог удаления */}
            <Dialog open={!!openDelete} onClose={() => setOpenDelete(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Удалить тенант?</DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>Это действие необратимо!</Alert>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Тенант <strong>"{tenants.find((t) => t.id === openDelete)?.name}"</strong> будет удалён навсегда.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenDelete(null)}>Отмена</Button>
                    <Button variant="contained" color="error" onClick={() => handleDelete(openDelete)}>Удалить</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}