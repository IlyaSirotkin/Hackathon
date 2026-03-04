import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import {
    Computer as VMIcon,
    Memory as CPUIcon,
    Storage as RAMIcon,
    Folder as DiskIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../../components/StatCard';
import ResourceBar from '../../components/ResourceBar';
import { mockTenants, mockVMs } from '../../services/mockData';

export default function ClientDashboard() {
    const { user } = useAuth();
    const [tenant, setTenant] = useState(null);
    const [vms, setVms] = useState([]);

    useEffect(() => {
        // Mock: берём данные тенанта текущего пользователя
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

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Виртуальные машины"
                        value={vms.length}
                        subtitle={`Лимит: ${tenant.quota.maxVMs}`}
                        icon={<VMIcon sx={{ color: '#E30611' }} />}
                        color="primary.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="CPU (vCPU)"
                        value={tenant.usage.cpu}
                        subtitle={`Лимит: ${tenant.quota.maxCPU}`}
                        icon={<CPUIcon sx={{ color: '#2979FF' }} />}
                        color="info.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="RAM (ГБ)"
                        value={tenant.usage.ram}
                        subtitle={`Лимит: ${tenant.quota.maxRAM}`}
                        icon={<RAMIcon sx={{ color: '#00C853' }} />}
                        color="success.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Диск (ГБ)"
                        value={tenant.usage.disk}
                        subtitle={`Лимит: ${tenant.quota.maxDisk}`}
                        icon={<DiskIcon sx={{ color: '#FFB300' }} />}
                        color="warning.main"
                    />
                </Grid>

                {/* Resource Usage */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Использование квот
                            </Typography>
                            <ResourceBar label="Виртуальные машины" used={vms.length} total={tenant.quota.maxVMs} />
                            <ResourceBar label="CPU" used={tenant.usage.cpu} total={tenant.quota.maxCPU} unit=" vCPU" />
                            <ResourceBar label="RAM" used={tenant.usage.ram} total={tenant.quota.maxRAM} unit=" ГБ" />
                            <ResourceBar label="Диск" used={tenant.usage.disk} total={tenant.quota.maxDisk} unit=" ГБ" />
                        </CardContent>
                    </Card>
                </Grid>

                {/* VM Status Pie */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Статус ВМ
                            </Typography>
                            {pieData.length > 0 ? (
                                <Box sx={{ height: 200 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Нет виртуальных машин
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                                <Chip label={`${runningVMs} работают`} size="small" color="success" variant="outlined" />
                                <Chip label={`${stoppedVMs} остановлены`} size="small" variant="outlined" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}