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
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../../components/StatCard';
import ResourceBar from '../../components/ResourceBar';
import { mockDashboardStats, mockTenants } from '../../services/mockData';

export default function AdminDashboard() {
    const [stats] = useState(mockDashboardStats);

    const tenantPieData = mockTenants
        .filter((t) => t.status === 'active')
        .map((t) => ({
            name: t.name,
            value: t.usage.cpu,
        }));

    const PIE_COLORS = ['#E30611', '#2979FF', '#00C853', '#FFB300', '#AB47BC'];

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>Панель управления</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Общий обзор облачной инфраструктуры
            </Typography>

            {/* Карточки статистики */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Тенанты"
                        value={stats.totalTenants}
                        subtitle={`${stats.activeTenants} активных`}
                        icon={<PeopleIcon sx={{ color: '#E30611' }} />}
                        color="primary.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Виртуальные машины"
                        value={stats.totalVMs}
                        subtitle={`${stats.runningVMs} работают`}
                        icon={<VMIcon sx={{ color: '#2979FF' }} />}
                        color="info.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="CPU загрузка"
                        value={`${Math.round((stats.totalCPU.used / stats.totalCPU.total) * 100)}%`}
                        subtitle={`${stats.totalCPU.used} / ${stats.totalCPU.total} vCPU`}
                        icon={<CPUIcon sx={{ color: '#00C853' }} />}
                        color="success.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="RAM загрузка"
                        value={`${Math.round((stats.totalRAM.used / stats.totalRAM.total) * 100)}%`}
                        subtitle={`${stats.totalRAM.used} / ${stats.totalRAM.total} ГБ`}
                        icon={<StorageIcon sx={{ color: '#FFB300' }} />}
                        color="warning.main"
                    />
                </Grid>

                {/* График загрузки ресурсов */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Загрузка ресурсов (24ч)
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={stats.resourceHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="time" stroke="#666" fontSize={12} />
                                        <YAxis stroke="#666" fontSize={12} unit="%" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1A1A2E',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                color: '#fff',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="cpu"
                                            name="CPU"
                                            stroke="#E30611"
                                            fill="#E3061133"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="ram"
                                            name="RAM"
                                            stroke="#2979FF"
                                            fill="#2979FF33"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="disk"
                                            name="Диск"
                                            stroke="#00C853"
                                            fill="#00C85333"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Распределение CPU по тенантам */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                CPU по тенантам
                            </Typography>
                            <Box sx={{ height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={tenantPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {tenantPieData.map((entry, index) => (
                                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1A1A2E',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                color: '#fff',
                                            }}
                                            formatter={(value) => [`${value} vCPU`, 'CPU']}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '0.75rem' }}
                                            formatter={(value) => (
                                                <span style={{ color: '#B0B0C8' }}>{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Общее использование ресурсов */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Общее использование ресурсов инфраструктуры
                            </Typography>
                            <ResourceBar label="CPU" used={stats.totalCPU.used} total={stats.totalCPU.total} unit=" vCPU" />
                            <ResourceBar label="RAM" used={stats.totalRAM.used} total={stats.totalRAM.total} unit=" ГБ" />
                            <ResourceBar label="Дисковое пространство" used={stats.totalDisk.used} total={stats.totalDisk.total} unit=" ГБ" />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}