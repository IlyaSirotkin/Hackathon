import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Chip, Grid,
    CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
    DialogActions, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Select, MenuItem, FormControl, InputLabel,
    Divider, Snackbar, IconButton, Tooltip,
} from '@mui/material';
import {
    SwapHoriz as ChangeIcon,
    History as HistoryIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { plansAPI, tenantsAPI } from '../../services/api';

const PLAN_COLORS = {
    free: '#666',
    pro: '#2979FF',
    pro_plus: '#FFB300',
    pro_ultimate: '#E30611',
};

export default function AdminPlans() {
    const [plans, setPlans] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [changeDialog, setChangeDialog] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [changing, setChanging] = useState(false);

    const [historyDialog, setHistoryDialog] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const loadData = () => {
        setLoading(true);
        Promise.all([plansAPI.getAll(), tenantsAPI.getAll()])
            .then(([plansData, tenantsData]) => {
                setPlans(plansData);
                setTenants(tenantsData);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChangePlan = async () => {
        if (!selectedPlan || !changeDialog) return;
        setChanging(true);
        setError('');
        try {
            await plansAPI.setTenantPlan(changeDialog.id, selectedPlan);
            const planName = plans.find((p) => p.id === selectedPlan)?.name;
            setSuccess(`План тенанта "${changeDialog.name}" изменён на ${planName}`);
            setChangeDialog(null);
            setSelectedPlan('');
            loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setChanging(false);
        }
    };

    const openHistory = async (tenant) => {
        setHistoryDialog(tenant);
        setHistoryLoading(true);
        try {
            const data = await plansAPI.getHistory(tenant.id);
            setHistory(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setHistoryLoading(false);
        }
    };

    const openChangeDialog = (tenant) => {
        setChangeDialog(tenant);
        setSelectedPlan(tenant.planId || 'free');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const planStats = plans.map((plan) => ({
        ...plan,
        count: tenants.filter((t) => t.planId === plan.id).length,
        revenue: tenants.filter((t) => t.planId === plan.id).length * plan.priceMonthly,
    }));

    const totalRevenue = planStats.reduce((sum, p) => sum + p.revenue, 0);

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Управление подписками
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {tenants.length} тенантов · Общий доход: ${totalRevenue.toFixed(2)}/мес
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 4 }}>
                {planStats.map((plan) => (
                    <Grid item xs={12} sm={6} md={3} key={plan.id}>
                        <Card
                            sx={{
                                borderRadius: 3,
                                border: `1px solid ${PLAN_COLORS[plan.id]}40`,
                                background: `linear-gradient(135deg, ${PLAN_COLORS[plan.id]}10, transparent)`,
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {plan.name}
                                    </Typography>
                                    <Chip
                                        label={`${plan.count}`}
                                        size="small"
                                        sx={{
                                            bgcolor: `${PLAN_COLORS[plan.id]}20`,
                                            color: PLAN_COLORS[plan.id],
                                            fontWeight: 700,
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {plan.priceMonthly > 0 ? `$${plan.priceMonthly.toFixed(2)}/мес` : 'Бесплатно'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Доход: ${plan.revenue.toFixed(2)}/мес
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {plan.maxVMs} ВМ · {plan.maxCPU} vCPU · {plan.maxRAM} ГБ RAM · {plan.maxDisk} ГБ
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow
                                sx={{
                                    '& th': {
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        color: 'text.secondary',
                                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                                        py: 2,
                                    },
                                }}
                            >
                                <TableCell>Организация</TableCell>
                                <TableCell>План</TableCell>
                                <TableCell>Стоимость</TableCell>
                                <TableCell>Использование</TableCell>
                                <TableCell>Лимиты</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell align="right">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tenants.map((tenant) => {
                                const color = PLAN_COLORS[tenant.planId] || '#666';
                                return (
                                    <TableRow
                                        key={tenant.id}
                                        sx={{
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                            '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', py: 2 },
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 2,
                                                        bgcolor: `${color}15`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <BusinessIcon sx={{ fontSize: 18, color }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {tenant.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        {tenant.admin || '—'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={tenant.planName || 'Free'}
                                                size="small"
                                                sx={{ bgcolor: `${color}20`, color, fontWeight: 700, border: 'none' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {tenant.priceMonthly > 0 ? `$${tenant.priceMonthly.toFixed(2)}` : 'Бесплатно'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {tenant.usage.vms} ВМ · {tenant.usage.cpu} CPU · {tenant.usage.ram} RAM
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {tenant.quota.maxVMs} ВМ · {tenant.quota.maxCPU} CPU · {tenant.quota.maxRAM} RAM
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={tenant.status === 'active' ? 'Активен' : 'Заблокирован'}
                                                size="small"
                                                sx={{
                                                    bgcolor:
                                                        tenant.status === 'active'
                                                            ? 'rgba(0,200,83,0.1)'
                                                            : 'rgba(227,6,17,0.1)',
                                                    color: tenant.status === 'active' ? '#00C853' : '#E30611',
                                                    border: 'none',
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                <Tooltip title="Сменить план">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openChangeDialog(tenant)}
                                                        sx={{ color: '#2979FF', '&:hover': { bgcolor: 'rgba(41,121,255,0.1)' } }}
                                                    >
                                                        <ChangeIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="История">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openHistory(tenant)}
                                                        sx={{ color: '#FFB300', '&:hover': { bgcolor: 'rgba(255,179,0,0.1)' } }}
                                                    >
                                                        <HistoryIcon fontSize="small" />
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

            <Dialog
                open={!!changeDialog}
                onClose={() => setChangeDialog(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Сменить план — {changeDialog?.name}</DialogTitle>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <DialogContent sx={{ pt: 3 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Текущий план: <strong>{changeDialog?.planName || 'Free'}</strong>
                    </Alert>

                    <FormControl fullWidth>
                        <InputLabel>Новый план</InputLabel>
                        <Select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            label="Новый план"
                        >
                            {plans.map((plan) => (
                                <MenuItem key={plan.id} value={plan.id}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: PLAN_COLORS[plan.id],
                                                }}
                                            />
                                            <Typography>{plan.name}</Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {plan.maxVMs} ВМ · {plan.maxCPU} vCPU · {plan.maxRAM} ГБ ·{' '}
                                            {plan.priceMonthly > 0 ? `$${plan.priceMonthly.toFixed(2)}` : 'Бесплатно'}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {changeDialog &&
                        selectedPlan &&
                        selectedPlan !== changeDialog.planId &&
                        (() => {
                            const newPlan = plans.find((p) => p.id === selectedPlan);
                            if (!newPlan) return null;
                            const checks = [
                                { label: 'ВМ', used: changeDialog.usage.vms, limit: newPlan.maxVMs },
                                { label: 'CPU', used: changeDialog.usage.cpu, limit: newPlan.maxCPU },
                                { label: 'RAM', used: changeDialog.usage.ram, limit: newPlan.maxRAM },
                                { label: 'Диск', used: changeDialog.usage.disk, limit: newPlan.maxDisk },
                            ];
                            const hasOverflow = checks.some((c) => c.used > c.limit);

                            return (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Текущее использование:
                                    </Typography>
                                    {checks.map((c, i) => (
                                        <Typography
                                            key={i}
                                            variant="body2"
                                            sx={{
                                                color: c.used > c.limit ? 'error.main' : 'text.secondary',
                                                ml: 1,
                                            }}
                                        >
                                            • {c.label}: {c.used} / {c.limit} {c.used > c.limit && '⚠️'}
                                        </Typography>
                                    ))}
                                    {hasOverflow && (
                                        <Alert severity="warning" sx={{ mt: 1 }}>
                                            Использование превышает лимиты. Смена возможна принудительно.
                                        </Alert>
                                    )}
                                </Box>
                            );
                        })()}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setChangeDialog(null)} sx={{ textTransform: 'none' }}>
                        Отмена
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleChangePlan}
                        disabled={changing || selectedPlan === changeDialog?.planId}
                        sx={{ textTransform: 'none', px: 3 }}
                    >
                        {changing ? <CircularProgress size={20} /> : 'Применить'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!historyDialog}
                onClose={() => setHistoryDialog(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    История подписок — {historyDialog?.name}
                </DialogTitle>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <DialogContent sx={{ pt: 2 }}>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : history.length > 0 ? (
                        history.map((item, i) => (
                            <Box
                                key={i}
                                sx={{
                                    py: 1.5,
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    '&:last-child': { borderBottom: 'none' },
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label={item.old_plan_name || '—'}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.05)',
                                                color: 'text.secondary',
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                        <Typography variant="body2">→</Typography>
                                        <Chip
                                            label={item.new_plan_name}
                                            size="small"
                                            sx={{
                                                bgcolor: `${PLAN_COLORS[item.new_plan]}20`,
                                                color: PLAN_COLORS[item.new_plan] || '#fff',
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {new Date(item.created_at).toLocaleString('ru-RU')}
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
                                >
                                    {item.changed_by_name || 'Система'} · {item.reason}
                                </Typography>
                            </Box>
                        ))
                    ) : (
                        <Typography sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                            Нет истории изменений
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setHistoryDialog(null)} sx={{ textTransform: 'none' }}>
                        Закрыть
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
}