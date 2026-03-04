import { useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import {
    People as PeopleIcon,
    Computer as VMIcon,
    Memory as CPUIcon,
    Storage as StorageIcon,
} from '@mui/icons-material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import StatCard from '../../components/StatCard';
import ResourceBar from '../../components/ResourceBar';
import { mockDashboardStats, mockTenants, mockLoadHistory } from '../../services/mockData';

const COLORS = ['#E30611', '#2979FF', '#00C853', '#FFB300', '#AB47BC'];

export default function AdminDashboard() {
    const [stats] = useState(mockDashboardStats);

    const tenantPieData = mockTenants
        .filter((t) => t.status === 'active')
        .map((t) => ({
            name: t.name,
            value: t.usage.vms,
        }));

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>Дашборд</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Обзор облачной платформы
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Тенанты"
                        value={stats.totalTenants}
                        subtitle={`${stats.activeTenants} активных`}
                        icon={<PeopleIcon />}
                        color="#2979FF"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Виртуальные машины"
                        value={stats.totalVMs}
                        subtitle={`${stats.runningVMs} работают`}
                        icon={<VMIcon />}
                        color="#00C853"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="CPU"
                        value={`${stats.totalCPU.used}/${stats.totalCPU.total}`}
                        subtitle="vCPU использовано"
                        icon={<CPUIcon />}
                        color="#E30611"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="RAM"
                        value={`${stats.totalRAM.used}/${stats.totalRAM.total}`}
                        subtitle="ГБ использовано"
                        icon={<StorageIcon />}
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
                                    <AreaChart data={mockLoadHistory}>
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
                                        <Area type="monotone" dataKey="disk" name="Disk %" stroke="#00C853" fill="rgba(0,200,83,0.15)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Пирожок */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: 420 }}>
                        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>ВМ по тенантам</Typography>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={tenantPieData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={45}
                                            dataKey="value"
                                            paddingAngle={5}
                                        >
                                            {tenantPieData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
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

                {/* Ресурсы */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>Ресурсы платформы</Typography>
                            <ResourceBar label="CPU" used={stats.totalCPU.used} total={stats.totalCPU.total} unit=" vCPU" />
                            <ResourceBar label="RAM" used={stats.totalRAM.used} total={stats.totalRAM.total} unit=" ГБ" />
                            <ResourceBar label="Диск" used={stats.totalDisk.used} total={stats.totalDisk.total} unit=" ГБ" />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Тенанты */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Тенанты</Typography>
                            {mockTenants.map((tenant) => (
                                <Box
                                    key={tenant.id}
                                    sx={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        '&:last-child': { borderBottom: 'none' },
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tenant.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {tenant.usage.vms} ВМ · {tenant.usage.cpu} vCPU · {tenant.usage.ram} ГБ RAM
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={tenant.status === 'active' ? 'Активен' : 'Заблокирован'}
                                        size="small"
                                        color={tenant.status === 'active' ? 'success' : 'error'}
                                        variant="outlined"
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