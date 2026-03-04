import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import {
    Computer as VMIcon,
    Memory as CPUIcon,
    Storage as RAMIcon,
    Folder as DiskIcon,
    Circle as CircleIcon,
} from '@mui/icons-material';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import StatCard from '../../components/StatCard';
import ResourceBar from '../../components/ResourceBar';
import { mockTenants, mockVMs } from '../../services/mockData';

// Генерация фейковой нагрузки для клиента
const generateClientLoad = () => {
    const data = [];
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0') + ':00';
        const base = i >= 8 && i <= 18 ? 50 : 15;
        data.push({
            time: hour,
            cpu: Math.min(100, Math.max(5, base + Math.floor(Math.random() * 30 - 10))),
            ram: Math.min(100, Math.max(10, base - 5 + Math.floor(Math.random() * 20))),
        });
    }
    return data;
};

const clientLoadData = generateClientLoad();

export default function ClientDashboard() {
    const { user } = useAuth();
    const [tenant, setTenant] = useState(null);
    const [vms, setVms] = useState([]);

    useEffect(() => {
        const t = mockTenants.find((t) => t.id === user.tenantId) || mockTenants[0];
        setTenant(t);
        setVms(mockVMs.filter((vm) => vm.tenantId === t.id));
    }, [user]);

    if (!tenant) return null;

    const runningVMs = vms.filter((v) => v.status === 'running').length;
    const stoppedVMs = vms.filter((v) => v.status === 'stopped').length;

    const pieData = [
        { name: 'Работают', value: runningVMs, color: '#00C853' },
        { name: 'Остановлены', value: stoppedVMs, color: '#666' },
    ].filter((d) => d.value > 0);

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
                Добро пожаловать, {tenant.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Обзор ваших облачных ресурсов
            </Typography>

            {/* Статистика */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Виртуальные машины"
                        value={vms.length}
                        subtitle={`Лимит: ${tenant.quota.maxVMs}`}
                        icon={<VMIcon />}
                        color="#E30611"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="CPU (vCPU)"
                        value={tenant.usage.cpu}
                        subtitle={`Лимит: ${tenant.quota.maxCPU}`}
                        icon={<CPUIcon />}
                        color="#2979FF"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="RAM (ГБ)"
                        value={tenant.usage.ram}
                        subtitle={`Лимит: ${tenant.quota.maxRAM}`}
                        icon={<RAMIcon />}
                        color="#00C853"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Диск (ГБ)"
                        value={tenant.usage.disk}
                        subtitle={`Лимит: ${tenant.quota.maxDisk}`}
                        icon={<DiskIcon />}
                        color="#FFB300"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* График загрузки */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: 420 }}>
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Загрузка за 24 часа</Typography>
                            <Box sx={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={clientLoadData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="time" stroke="#666" fontSize={11} />
                                        <YAxis stroke="#666" fontSize={12} unit="%" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1A1A2E',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                color: '#fff',
                                            }}
                                        />
                                        <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#E30611" fill="rgba(227,6,17,0.15)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="ram" name="RAM %" stroke="#2979FF" fill="rgba(41,121,255,0.15)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Пирожок статуса ВМ */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: 420 }}>
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Статус ВМ</Typography>
                            {pieData.length > 0 ? (
                                <>
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={75}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1A1A2E',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: 8,
                                                        color: '#fff',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                    {/* Легенда */}
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
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Нет виртуальных машин
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Использование квот */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>Использование квот</Typography>
                            <ResourceBar label="Виртуальные машины" used={vms.length} total={tenant.quota.maxVMs} />
                            <ResourceBar label="CPU" used={tenant.usage.cpu} total={tenant.quota.maxCPU} unit=" vCPU" />
                            <ResourceBar label="RAM" used={tenant.usage.ram} total={tenant.quota.maxRAM} unit=" ГБ" />
                            <ResourceBar label="Диск" used={tenant.usage.disk} total={tenant.quota.maxDisk} unit=" ГБ" />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Список ВМ */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Ваши машины</Typography>
                            {vms.length > 0 ? vms.map((vm) => (
                                <Box
                                    key={vm.id}
                                    sx={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        '&:last-child': { borderBottom: 'none' },
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{vm.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {vm.os} · {vm.cpu} vCPU · {vm.ram} ГБ · {vm.ip}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={vm.status === 'running' ? 'Работает' : 'Остановлена'}
                                        size="small"
                                        color={vm.status === 'running' ? 'success' : 'default'}
                                        variant="outlined"
                                    />
                                </Box>
                            )) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Нет виртуальных машин
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}