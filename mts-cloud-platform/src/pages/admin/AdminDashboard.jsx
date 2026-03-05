import { useState, useEffect } from 'react';
import {
    Grid, Card, CardContent, Typography, Box, Chip, CircularProgress,
    IconButton, Tooltip,
} from '@mui/material';
import {
    People as PeopleIcon,
    Computer as VMIcon,
    Memory as CPUIcon,
    Storage as StorageIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../../components/StatCard';
import ResourceBar from '../../components/ResourceBar';
import { statsAPI, tenantsAPI, metricsAPI } from '../../services/api';

const COLORS = ['#E30611', '#2979FF', '#00C853', '#FFB300', '#AB47BC'];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [metricsHistory, setMetricsHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            statsAPI.get(),
            tenantsAPI.getAll(),
            metricsAPI.getHistory(),
        ])
            .then(([statsData, tenantsData, historyData]) => {
                setStats(statsData);
                setTenants(tenantsData);
                setMetricsHistory(historyData);
                setLastUpdate(new Date());
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
        // Обновляем каждые 5 минут
        const interval = setInterval(loadData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !stats) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const tenantPieData = tenants
        .filter((t) => t.status === 'active')
        .map((t) => ({ name: t.name, value: t.usage.vms }))
        .filter((t) => t.value > 0);

    // Прореживаем данные для графика (показываем каждую 4-ю точку = каждый час)
    const chartData = metricsHistory.filter((_, i) => i % 4 === 0 || i === metricsHistory.length - 1);

    return (
        <Box>
            {/* Заголовок */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Дашборд</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Обзор облачной платформы
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {lastUpdate && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
                        </Typography>
                    )}
                    <Tooltip title="Обновить данные">
                        <IconButton onClick={loadData} size="small" sx={{ color: 'text.secondary' }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Карточки статистики */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Тенанты" value={stats.totalTenants}
                              subtitle={`${stats.activeTenants} активных`} icon={<PeopleIcon />} color="#2979FF" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Виртуальные машины" value={stats.totalVMs}
                              subtitle={`${stats.runningVMs} работают`} icon={<VMIcon />} color="#00C853" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="CPU" value={`${stats.totalCPU.used}/${stats.totalCPU.total}`}
                              subtitle="vCPU использовано" icon={<CPUIcon />} color="#E30611" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="RAM" value={`${stats.totalRAM.used}/${stats.totalRAM.total}`}
                              subtitle="ГБ использовано" icon={<StorageIcon />} color="#FFB300" />
                </Grid>
            </Grid>

            {/* График + Пирог */}
            <Grid container spacing={3}>
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
                            <Box sx={{ flex: 1 }}>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <XAxis
                                                dataKey="time"
                                                stroke="#666"
                                                fontSize={11}
                                                interval="preserveStartEnd"
                                                tickCount={12}
                                            />
                                            <YAxis stroke="#666" fontSize={12} unit="%" domain={[0, 100]} />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor: '#1A1A2E',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: 8,
                                                    color: '#fff',
                                                }}
                                                formatter={(value) => [`${Number(value).toFixed(1)}%`]}
                                            />
                                            <Area
                                                type="monotone" dataKey="cpu" name="CPU"
                                                stroke="#E30611" fill="rgba(227,6,17,0.15)" strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone" dataKey="ram" name="RAM"
                                                stroke="#2979FF" fill="rgba(41,121,255,0.15)" strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone" dataKey="disk" name="Disk"
                                                stroke="#00C853" fill="rgba(0,200,83,0.15)" strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box sx={{
                                        height: '100%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', color: 'text.secondary',
                                    }}>
                                        <Typography>Нет данных. Метрики начнут собираться автоматически.</Typography>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: 420, borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>ВМ по тенантам</Typography>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {tenantPieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={tenantPieData} cx="50%" cy="50%"
                                                outerRadius={80} innerRadius={45}
                                                dataKey="value" paddingAngle={5}
                                            >
                                                {tenantPieData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor: '#1A1A2E',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: 8, color: '#fff',
                                                }}
                                                formatter={(value) => [`${value} ВМ`]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Typography sx={{ color: 'text.secondary' }}>Нет активных ВМ</Typography>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                                {tenantPieData.map((item, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            bgcolor: COLORS[i % COLORS.length],
                                        }} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {item.name}: {item.value} ВМ
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Ресурсы + Тенанты */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Ресурсы платформы</Typography>
                            <ResourceBar label="CPU" used={stats.totalCPU.used} total={stats.totalCPU.total} unit=" vCPU" />
                            <ResourceBar label="RAM" used={stats.totalRAM.used} total={stats.totalRAM.total} unit=" ГБ" />
                            <ResourceBar label="Диск" used={stats.totalDisk.used} total={stats.totalDisk.total} unit=" ГБ" />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Тенанты</Typography>
                            {tenants.map((tenant) => (
                                <Box key={tenant.id} sx={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    '&:last-child': { borderBottom: 'none' },
                                }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {tenant.usage.vms} ВМ · {tenant.usage.cpu} vCPU · {tenant.usage.ram} ГБ RAM
                                        </Typography>
                                    </Box>
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
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}