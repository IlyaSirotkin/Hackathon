import { useState } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Grid, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, Avatar, Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as ActiveIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import ResourceBar from '../../components/ResourceBar';
import { mockTenants } from '../../services/mockData';

export default function AdminTenants() {
    const { enqueueSnackbar } = useSnackbar();
    const [tenants, setTenants] = useState([...mockTenants]);
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(null);
    const [openDelete, setOpenDelete] = useState(null);

    const [formData, setFormData] = useState({
        name: '', email: '',
        maxVMs: 5, maxCPU: 8, maxRAM: 16, maxDisk: 200,
    });

    const resetForm = () => {
        setFormData({ name: '', email: '', maxVMs: 5, maxCPU: 8, maxRAM: 16, maxDisk: 200 });
    };

    const handleCreate = () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            enqueueSnackbar('Заполните все поля', { variant: 'warning' });
            return;
        }
        const newTenant = {
            id: 't-' + Date.now(),
            name: formData.name,
            email: formData.email,
            status: 'active',
            createdAt: new Date().toISOString(),
            quota: {
                maxVMs: formData.maxVMs,
                maxCPU: formData.maxCPU,
                maxRAM: formData.maxRAM,
                maxDisk: formData.maxDisk,
            },
            usage: { vms: 0, cpu: 0, ram: 0, disk: 0 },
        };
        setTenants((prev) => [...prev, newTenant]);
        setOpenCreate(false);
        resetForm();
        enqueueSnackbar(`Тенант "${newTenant.name}" создан`, { variant: 'success' });
    };

    const handleEdit = () => {
        setTenants((prev) =>
            prev.map((t) =>
                t.id === openEdit
                    ? {
                        ...t,
                        name: formData.name,
                        email: formData.email,
                        quota: {
                            maxVMs: formData.maxVMs,
                            maxCPU: formData.maxCPU,
                            maxRAM: formData.maxRAM,
                            maxDisk: formData.maxDisk,
                        },
                    }
                    : t
            )
        );
        setOpenEdit(null);
        resetForm();
        enqueueSnackbar('Тенант обновлён', { variant: 'success' });
    };

    const handleDelete = (id) => {
        setTenants((prev) => prev.filter((t) => t.id !== id));
        setOpenDelete(null);
        enqueueSnackbar('Тенант удалён', { variant: 'info' });
    };

    const toggleStatus = (id) => {
        setTenants((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' }
                    : t
            )
        );
        enqueueSnackbar('Статус обновлён', { variant: 'success' });
    };

    const openEditDialog = (tenant) => {
        setFormData({
            name: tenant.name,
            email: tenant.email,
            maxVMs: tenant.quota.maxVMs,
            maxCPU: tenant.quota.maxCPU,
            maxRAM: tenant.quota.maxRAM,
            maxDisk: tenant.quota.maxDisk,
        });
        setOpenEdit(tenant.id);
    };

    const TenantForm = ({ onSubmit, submitLabel }) => (
        <>
            <DialogContent>
                <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                        label="Название организации"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        fullWidth
                    />
                    <Divider>
                        <Chip label="Лимиты ресурсов" size="small" variant="outlined" />
                    </Divider>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Макс. ВМ"
                                type="number"
                                value={formData.maxVMs}
                                onChange={(e) => setFormData({ ...formData, maxVMs: parseInt(e.target.value) || 1 })}
                                fullWidth
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Макс. CPU (vCPU)"
                                type="number"
                                value={formData.maxCPU}
                                onChange={(e) => setFormData({ ...formData, maxCPU: parseInt(e.target.value) || 1 })}
                                fullWidth
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Макс. RAM (ГБ)"
                                type="number"
                                value={formData.maxRAM}
                                onChange={(e) => setFormData({ ...formData, maxRAM: parseInt(e.target.value) || 1 })}
                                fullWidth
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Макс. Диск (ГБ)"
                                type="number"
                                value={formData.maxDisk}
                                onChange={(e) => setFormData({ ...formData, maxDisk: parseInt(e.target.value) || 10 })}
                                fullWidth
                                inputProps={{ min: 10 }}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => { setOpenCreate(false); setOpenEdit(null); resetForm(); }}>
                    Отмена
                </Button>
                <Button variant="contained" onClick={onSubmit}>{submitLabel}</Button>
            </DialogActions>
        </>
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5">Тенанты</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Управление клиентами и квотами
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { resetForm(); setOpenCreate(true); }}
                >
                    Добавить тенанта
                </Button>
            </Box>

            {/* Таблица тенантов */}
            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Клиент</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>ВМ</TableCell>
                                <TableCell>CPU</TableCell>
                                <TableCell>RAM</TableCell>
                                <TableCell>Диск</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow key={tenant.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: tenant.status === 'active' ? 'primary.main' : 'grey.700', fontSize: '0.85rem' }}>
                                                {tenant.name[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{tenant.email}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={tenant.status === 'active' ? 'Активен' : 'Заблокирован'}
                                            size="small"
                                            color={tenant.status === 'active' ? 'success' : 'default'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {tenant.usage.vms} / {tenant.quota.maxVMs}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {tenant.usage.cpu} / {tenant.quota.maxCPU}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {tenant.usage.ram} / {tenant.quota.maxRAM} ГБ
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {tenant.usage.disk} / {tenant.quota.maxDisk} ГБ
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Редактировать">
                                            <IconButton size="small" onClick={() => openEditDialog(tenant)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={tenant.status === 'active' ? 'Заблокировать' : 'Разблокировать'}>
                                            <IconButton size="small" onClick={() => toggleStatus(tenant.id)}>
                                                {tenant.status === 'active' ? (
                                                    <BlockIcon fontSize="small" color="warning" />
                                                ) : (
                                                    <ActiveIcon fontSize="small" color="success" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Удалить">
                                            <IconButton size="small" color="error" onClick={() => setOpenDelete(tenant.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Детальные карточки с квотами */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Использование квот</Typography>
            <Grid container spacing={2}>
                {tenants.filter((t) => t.status === 'active').map((tenant) => (
                    <Grid item xs={12} md={6} lg={4} key={tenant.id}>
                        <Card>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                                        {tenant.name[0]}
                                    </Avatar>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                                </Box>
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
                <DialogTitle>Новый тенант</DialogTitle>
                <TenantForm onSubmit={handleCreate} submitLabel="Создать" />
            </Dialog>

            {/* Диалог редактирования */}
            <Dialog open={!!openEdit} onClose={() => { setOpenEdit(null); resetForm(); }} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать тенанта</DialogTitle>
                <TenantForm onSubmit={handleEdit} submitLabel="Сохранить" />
            </Dialog>

            {/* Диалог удаления */}
            <Dialog open={!!openDelete} onClose={() => setOpenDelete(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Удалить тенанта?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Все виртуальные машины и данные тенанта будут удалены. Это действие необратимо.
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