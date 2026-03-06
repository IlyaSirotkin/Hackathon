import { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Chip, Grid,
    CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Star as StarIcon,
    Rocket as RocketIcon,
    WorkspacePremium as PremiumIcon,
    TrendingUp as UpgradeIcon,
} from '@mui/icons-material';
import { plansAPI, metricsAPI } from '../../services/api';

const PLAN_COLORS = {
    free: '#666',
    pro: '#2979FF',
    pro_plus: '#FFB300',
    pro_ultimate: '#E30611',
};

const PLAN_ICONS = {
    free: <StarIcon />,
    pro: <RocketIcon />,
    pro_plus: <PremiumIcon />,
    pro_ultimate: <PremiumIcon />,
};

function safePrice(plan) {
    if (!plan) return 0;
    return typeof plan.priceMonthly === 'number' ? plan.priceMonthly : 0;
}

export default function ClientSubscription() {
    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [tenantQuota, setTenantQuota] = useState(null);
    const [loading, setLoading] = useState(true);
    const [changing, setChanging] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            plansAPI.getAll(),
            plansAPI.getCurrent(),
            metricsAPI.getTenantQuota(),
        ])
            .then(([plansData, currentData, quotaData]) => {
                setPlans(plansData || []);
                setCurrentPlan(currentData || null);
                setTenantQuota(quotaData || null);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleChangePlan = async (planId) => {
        setChanging(true);
        setError('');
        try {
            const result = await plansAPI.change(planId);
            setSuccess(result.message);
            setConfirmDialog(null);
            // Перезагружаем
            const [plansData, currentData, quotaData] = await Promise.all([
                plansAPI.getAll(),
                plansAPI.getCurrent(),
                metricsAPI.getTenantQuota(),
            ]);
            setPlans(plansData || []);
            setCurrentPlan(currentData || null);
            setTenantQuota(quotaData || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setChanging(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!currentPlan || plans.length === 0) {
        return (
            <Box sx={{ mt: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Alert severity="warning">Не удалось загрузить данные о подписке. Попробуйте перезайти.</Alert>
            </Box>
        );
    }

    const currentPrice = safePrice(currentPlan);
    const currentColor = PLAN_COLORS[currentPlan.planId] || '#666';
    const currentIcon = PLAN_ICONS[currentPlan.planId] || <StarIcon />;
    const currentIndex = plans.findIndex((p) => p.id === currentPlan.planId);
    const upgradePlans = plans.filter((_, i) => i > currentIndex);

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Подписка</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Управление тарифным планом
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Текущий план */}
            <Card sx={{
                mb: 4, borderRadius: 3,
                border: `2px solid ${currentColor}`,
                background: `linear-gradient(135deg, ${currentColor}15, transparent)`,
            }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48, height: 48, borderRadius: 2,
                                bgcolor: `${currentColor}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: currentColor,
                            }}>
                                {currentIcon}
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Текущий план: {currentPlan.planName}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {currentPrice > 0 ? `$${currentPrice.toFixed(2)}/мес` : 'Бесплатно'}
                                    {currentPlan.expiresAt && ` · до ${new Date(currentPlan.expiresAt).toLocaleDateString('ru-RU')}`}
                                </Typography>
                            </Box>
                        </Box>
                        <Chip label="Активен" sx={{ bgcolor: `${currentColor}20`, color: currentColor, fontWeight: 700 }} />
                    </Box>
                </CardContent>
            </Card>

            {/* Заголовок */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {upgradePlans.length > 0 ? 'Улучшить план' : 'Вы на максимальном плане'}
            </Typography>

            {/* Карточки апгрейда */}
            {upgradePlans.length > 0 ? (
                <Grid container spacing={3}>
                    {upgradePlans.map((plan) => {
                        const color = PLAN_COLORS[plan.id] || '#666';
                        const icon = PLAN_ICONS[plan.id] || <StarIcon />;
                        const planPrice = safePrice(plan);
                        const upgradePrice = Math.max(0, planPrice - currentPrice);

                        return (
                            <Grid item xs={12} sm={6} md={4} key={plan.id}>
                                <Card sx={{
                                    height: '100%', borderRadius: 3, position: 'relative',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: color },
                                    display: 'flex', flexDirection: 'column',
                                }}>
                                    {plan.id === 'pro_plus' && (
                                        <Box sx={{
                                            position: 'absolute', top: 12, right: 12,
                                            bgcolor: '#FFB300', color: '#000', px: 1.5, py: 0.3,
                                            borderRadius: 10, fontSize: '0.7rem', fontWeight: 700,
                                        }}>
                                            ПОПУЛЯРНЫЙ
                                        </Box>
                                    )}

                                    <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{
                                            width: 44, height: 44, borderRadius: 2, mb: 2,
                                            bgcolor: `${color}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color,
                                        }}>
                                            {icon}
                                        </Box>

                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{plan.name}</Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 1, mb: 0.5 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color }}>
                                                ${planPrice.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>/мес</Typography>
                                        </Box>

                                        <Typography variant="body2" sx={{ color: 'success.main', mb: 2, fontWeight: 600 }}>
                                            Доплата: ${upgradePrice.toFixed(2)}/мес
                                        </Typography>

                                        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" sx={{
                                                color: 'text.secondary', fontWeight: 600,
                                                textTransform: 'uppercase', letterSpacing: 0.5,
                                            }}>
                                                Ресурсы
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                <Typography variant="body2">{plan.maxVMs} ВМ</Typography>
                                                <Typography variant="body2">{plan.maxCPU} vCPU</Typography>
                                                <Typography variant="body2">{plan.maxRAM} ГБ RAM</Typography>
                                                <Typography variant="body2">
                                                    {plan.maxDisk >= 1000 ? `${plan.maxDisk / 1000} ТБ` : `${plan.maxDisk} ГБ`} диск
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

                                        <Box sx={{ flex: 1, mb: 2 }}>
                                            {(plan.features || []).map((f, i) => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
                                                    <CheckIcon sx={{ fontSize: 16, color }} />
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{f}</Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        <Button
                                            variant="contained" fullWidth
                                            onClick={() => setConfirmDialog(plan)}
                                            startIcon={<UpgradeIcon />}
                                            sx={{
                                                textTransform: 'none', borderRadius: 2, bgcolor: color,
                                                '&:hover': { bgcolor: color, filter: 'brightness(0.9)' },
                                            }}
                                        >
                                            Улучшить за +${upgradePrice.toFixed(2)}/мес
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Card sx={{
                    borderRadius: 3, textAlign: 'center',
                    border: '1px solid rgba(227,6,17,0.2)',
                    background: 'linear-gradient(135deg, rgba(227,6,17,0.05), transparent)',
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <PremiumIcon sx={{ fontSize: 48, color: '#E30611', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Вы на максимальном плане!</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                            Вам доступны все возможности платформы MTS Cloud
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Диалог подтверждения */}
            {confirmDialog && (
                <Dialog
                    open={true}
                    onClose={() => setConfirmDialog(null)}
                    maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, bgcolor: '#1A1A2E' } }}
                >
                    <DialogTitle sx={{ fontWeight: 700 }}>
                        Улучшить план до {confirmDialog.name}?
                    </DialogTitle>
                    <DialogContent>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Доплата: <strong>${Math.max(0, safePrice(confirmDialog) - currentPrice).toFixed(2)}/мес</strong>
                            {' '}(было ${currentPrice.toFixed(2)} → станет ${safePrice(confirmDialog).toFixed(2)})
                        </Alert>

                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Новые лимиты:</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
                            <Typography variant="body2">• {confirmDialog.maxVMs} ВМ</Typography>
                            <Typography variant="body2">• {confirmDialog.maxCPU} vCPU</Typography>
                            <Typography variant="body2">• {confirmDialog.maxRAM} ГБ RAM</Typography>
                            <Typography variant="body2">
                                • {confirmDialog.maxDisk >= 1000 ? `${confirmDialog.maxDisk / 1000} ТБ` : `${confirmDialog.maxDisk} ГБ`} диск
                            </Typography>
                        </Box>

                        {tenantQuota && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Текущее использование:</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        • {tenantQuota.usage.vms} / {confirmDialog.maxVMs} ВМ
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        • {tenantQuota.usage.cpu} / {confirmDialog.maxCPU} vCPU
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        • {tenantQuota.usage.ram} / {confirmDialog.maxRAM} ГБ RAM
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        • {tenantQuota.usage.disk} / {confirmDialog.maxDisk} ГБ диск
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button onClick={() => setConfirmDialog(null)} sx={{ textTransform: 'none' }}>Отмена</Button>
                        <Button
                            variant="contained"
                            onClick={() => handleChangePlan(confirmDialog.id)}
                            disabled={changing}
                            sx={{ textTransform: 'none', px: 3 }}
                        >
                            {changing
                                ? <CircularProgress size={20} />
                                : `Улучшить за +$${Math.max(0, safePrice(confirmDialog) - currentPrice).toFixed(2)}/мес`
                            }
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
}