
import { useState } from 'react';
import {
    Box, Card, CardContent, Typography, Grid, Divider, Chip,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    Shield as ShieldIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import ResourceBar from '../../components/ResourceBar';
import ArchitectureDiagram from '../../components/ArchitectureDiagram';
import NetworkDiagram from '../../components/NetworkDiagram';
import { mockTenants, mockDashboardStats, mockNetworks, mockVMs } from '../../services/mockData';

export default function AdminResources() {
    const [stats] = useState(mockDashboardStats);

    const tenantBarData = mockTenants
        .filter((t) => t.status === 'active')
        .map((t) => ({
            name: t.name.length > 12 ? t.name.substring(0, 12) + '...' : t.name,
            cpu: t.usage.cpu,
            ram: t.usage.ram,
            disk: Math.round(t.usage.disk / 10),
        }));

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>Ресурсы инфраструктуры</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Мониторинг и распределение ресурсов облачной платформы
            </Typography>

            <Grid container spacing={3}>
                {/* Общие ресурсы */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>Общие ресурсы платформы</Typography>
                            <ResourceBar label="CPU" used={stats.totalCPU.used} total={stats.totalCPU.total} unit=" vCPU" />
                            <ResourceBar label="RAM" used={stats.totalRAM.used} total={stats.totalRAM.total} unit=" ГБ" />
                            <ResourceBar label="Дисковое пространство" used={stats.totalDisk.used} total={stats.totalDisk.total} unit=" ГБ" />

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Свободно CPU</Typography>
                                    <Typography variant="h6" sx={{ color: 'success.main' }}>
                                        {stats.totalCPU.total - stats.totalCPU.used}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>vCPU</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Свободно RAM</Typography>
                                    <Typography variant="h6" sx={{ color: 'success.main' }}>
                                        {stats.totalRAM.total - stats.totalRAM.used}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>ГБ</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Свободно диска</Typography>
                                    <Typography variant="h6" sx={{ color: 'success.main' }}>
                                        {stats.totalDisk.total - stats.totalDisk.used}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>ГБ</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Ресурсы по тенантам */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>Ресурсы по тенантам</Typography>
                            <Box sx={{ height: 280 }}>
                                <ResponsiveContainer>
                                    <BarChart data={tenantBarData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="name" stroke="#666" fontSize={11} />
                                        <YAxis stroke="#666" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1A1A2E',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                color: '#fff',
                                            }}
                                        />
                                        <Bar dataKey="cpu" name="CPU (vCPU)" fill="#E30611" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="ram" name="RAM (ГБ)" fill="#2979FF" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="disk" name="Диск (×10 ГБ)" fill="#00C853" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Схема сетевой изоляции */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Сетевая изоляция тенантов
                            </Typography>
                            <NetworkDiagram
                                tenants={mockTenants}
                                networks={mockNetworks}
                                vms={mockVMs}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Архитектура платформы */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Архитектура облачной платформы
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                Многоуровневая архитектура с разделением ответственности между компонентами
                            </Typography>
                            <ArchitectureDiagram />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Детальное использование квот */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Детальное использование квот по тенантам
                            </Typography>
                            <Grid container spacing={2}>
                                {mockTenants.map((tenant) => (
                                    <Grid item xs={12} md={6} key={tenant.id}>
                                        <Card sx={{
                                            bgcolor: 'rgba(255,255,255,0.02)',
                                            border: '1px solid',
                                            borderColor: tenant.status === 'active'
                                                ? 'rgba(255,255,255,0.08)'
                                                : 'rgba(255,179,0,0.3)',
                                        }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                        {tenant.name}
                                                    </Typography>
                                                    <Chip
                                                        label={tenant.status === 'active' ? 'Активен' : 'Заблокирован'}
                                                        size="small"
                                                        color={tenant.status === 'active' ? 'success' : 'warning'}
                                                        variant="outlined"
                                                    />
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
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}