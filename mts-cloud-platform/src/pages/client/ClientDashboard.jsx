import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Grid, Card, CardContent, Typography, Box, Chip, CircularProgress,
    IconButton, Tooltip,
} from '@mui/material';
import {
    Computer as VMIcon, Memory as CPUIcon,
    Storage as RAMIcon, Folder as DiskIcon, Circle as CircleIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import StatCard from '../../components/StatCard';
import ResourceBar from '../../components/ResourceBar';
import { vmsAPI, metricsAPI } from '../../services/api';

export default function ClientDashboard() {
    const { user } = useAuth();
    const [tenant, setTenant] = useState(null);
    const [vms, setVms] = useState([]);
    const [metricsHistory, setMetricsHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            vmsAPI.getAll(),
            metricsAPI.getTenantQuota(),
            metricsAPI.getTenantHistory(),
        ])
            .then(([vmsData, quotaData, historyData]) => {
                setVms(vmsData);
                setTenant(quotaData);
                setMetricsHistory(historyData);
                setLastUpdate(new Date());
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !tenant) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const runningVMs = vms.filter((v) => v.status === 'running').length;
    const stoppedVMs = vms.filter((v) => v.status === 'stopped').length;

    const pieData = [
        { name: 'Работают', value: runningVMs, color: '#00C853' },
        { name: 'Остановлены', value: stoppedVMs, color: '#666' },
    ].filter((d) => d.value > 0);

    // Прореживаем — каждая 4-я точка (раз в час)
    const chartData = metricsHistory.filter((_, i) => i % 4 === 0 || i === metricsHistory.length - 1);

    return (
        <Box>
            {/* Заголовок */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Добро пожаловать, {tenant.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Обзор ваших облачных ресурсов
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {lastUpdate && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {lastUpdate.toLocaleTimeString('ru-RU')}
                        </Typography>
                    )}
                    <Tooltip title="Обновить">
                        <IconButton onClick={loadData} size="small" sx={{ color: 'text.secondary' }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Карточки */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Виртуальные машины" value={tenant.usage.vms}
                              subtitle={`Лимит: ${tenant.quota.maxVMs}`} icon={<VMIcon />} color="#E30611" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="CPU (vCPU)" value={tenant.usage.cpu}
                              subtitle={`Лимит: ${tenant.quota.maxCPU}`} icon={<CPUIcon />} color="#2979FF" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="RAM (ГБ)" value={tenant.usage.ram}
                              subtitle={`Лимит: ${tenant.quota.maxRAM}`} icon={<RAMIcon />} color="#00C853" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Диск (ГБ)" value={tenant.usage.disk}
                              subtitle={`Лимит: ${tenant.quota.maxDisk}`} icon={<DiskIcon />} color="#FFB300" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* График загрузки */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ height: 420, borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Загрузка за 24 часа</Typography>
                                <Chip
                                    label={`${metricsHistory.length} точек`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }}
                                />
                            </Box>
                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <XAxis dataKey="time" stroke="#666" fontSize={11} interval="preserveStartEnd" />
                                            <YAxis stroke="#666" fontSize={12} unit="%" domain={[0, 100]} />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor: '#1A1A2E',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: 8, color: '#fff',
                                                }}
                                                formatter={(value) => [`${Number(value).toFixed(1)}%`]}
                                            />
                                            <Area type="monotone" dataKey="cpu" name="CPU"
                                                  stroke="#E30611" fill="rgba(227,6,17,0.15)" strokeWidth={2} />
                                            <Area type="monotone" dataKey="ram" name="RAM"
                                                  stroke="#2979FF" fill="rgba(41,121,255,0.15)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ color: 'text.secondary' }}>
                                            Данные начнут появляться автоматически
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Пирог статусов ВМ */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: 420, borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Статус ВМ</Typography>
                            {pieData.length > 0 ? (
                                <>
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                                                     paddingAngle={5} dataKey="value">
                                                    {pieData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1A1A2E',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: 8, color: '#fff',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                                        {pieData.map((item, i) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CircleIcon sx={{ fontSize: 10, color: item.color }} />
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {item.name}: {item.value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Нет ВМ</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Квоты */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Использование квот</Typography>
                            <ResourceBar label="ВМ" used={tenant.usage.vms} total={tenant.quota.maxVMs} />
                            <ResourceBar label="CPU" used={tenant.usage.cpu} total={tenant.quota.maxCPU} unit=" vCPU" />
                            <ResourceBar label="RAM" used={tenant.usage.ram} total={tenant.quota.maxRAM} unit=" ГБ" />
                            <ResourceBar label="Диск" used={tenant.usage.disk} total={tenant.quota.maxDisk} unit=" ГБ" />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Список ВМ */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Ваши машины</Typography>
                            {vms.length > 0 ? vms.map((vm) => (
                                <Box key={vm.id} sx={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    '&:last-child': { borderBottom: 'none' },
                                }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{vm.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {vm.os} · {vm.cpu} vCPU · {vm.ram} ГБ · {vm.ip || 'нет IP'}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={vm.status === 'running' ? 'Работает' : 'Остановлена'}
                                        size="small"
                                        sx={{
                                            bgcolor: vm.status === 'running' ? 'rgba(0,200,83,0.1)' : 'rgba(255,255,255,0.05)',
                                            color: vm.status === 'running' ? '#00C853' : '#666',
                                            border: 'none', fontWeight: 600,
                                        }}
                                    />
                                </Box>
                            )) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    У вас пока нет виртуальных машин
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}