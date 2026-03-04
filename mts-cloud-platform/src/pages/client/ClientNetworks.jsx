import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Box, Card, CardContent, Typography, Grid, Chip, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
    Shield as ShieldIcon,
    Router as RouterIcon,
    Lan as LanIcon,
    Lock as LockIcon,
    Computer as VMIcon,
} from '@mui/icons-material';
import { mockNetworks, mockVMs, mockTenants } from '../../services/mockData';

export default function ClientNetworks() {
    const { user } = useAuth();
    const [networks, setNetworks] = useState([]);
    const [vms, setVms] = useState([]);
    const [tenant, setTenant] = useState(null);

    useEffect(() => {
        const t = mockTenants.find((t) => t.id === user.tenantId) || mockTenants[0];
        setTenant(t);
        setNetworks(mockNetworks.filter((n) => n.tenantId === t.id));
        setVms(mockVMs.filter((vm) => vm.tenantId === t.id));
    }, [user]);

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 0.5 }}>Сети</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Изолированные виртуальные сети вашей инфраструктуры
            </Typography>

            {/* Изоляция */}
            <Card sx={{ mb: 3, border: '1px solid rgba(0,200,83,0.2)', bgcolor: 'rgba(0,200,83,0.03)' }}>
                <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
                    <ShieldIcon sx={{ color: 'success.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                            Сетевая изоляция активна
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Ваши сети полностью изолированы от других клиентов через VLAN-сегментацию.
                            Трафик между тенантами невозможен на уровне сетевой инфраструктуры.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                {networks.map((network) => (
                    <Grid item xs={12} md={6} key={network.id}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <LanIcon sx={{ color: 'info.main' }} />
                                        <Typography variant="h6">{network.name}</Typography>
                                    </Box>
                                    <Chip
                                        icon={<LockIcon sx={{ fontSize: 14 }} />}
                                        label="Изолирована"
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Подсеть</Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {network.subnet}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Шлюз</Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {network.gateway}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>VLAN ID</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{network.vlan}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Устройств</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {vms.filter((v) => v.network === network.id).length}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Подключённые ВМ
                                </Typography>
                                {vms.filter((v) => v.network === network.id).length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Имя</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>IP</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Статус</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {vms
                                                    .filter((v) => v.network === network.id)
                                                    .map((vm) => (
                                                        <TableRow key={vm.id}>
                                                            <TableCell sx={{ fontSize: '0.8rem' }}>{vm.name}</TableCell>
                                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{vm.ip}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={vm.status === 'running' ? 'Online' : 'Offline'}
                                                                    size="small"
                                                                    color={vm.status === 'running' ? 'success' : 'default'}
                                                                    variant="outlined"
                                                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Нет подключённых устройств
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {/* Схема изоляции */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Схема сетевой изоляции
                            </Typography>
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    whiteSpace: 'pre',
                                    overflowX: 'auto',
                                    lineHeight: 1.8,
                                    color: 'text.secondary',
                                }}
                            >
                                {`┌─────────────────────────────────────────────────────────┐
│                   MTS Cloud Platform                     │
│                  Physical Infrastructure                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──── VLAN ${networks[0]?.vlan || 101} ────┐    ┌──── VLAN XXX ────┐    │
│  │  ${tenant?.name || 'Ваш тенант'}  │    │  Другой клиент │    │
│  │                 │    │                │    │
│  │ ${(vms[0]?.ip || '10.x.x.x').padEnd(15)} │    │  10.xx.x.x     │    │
│  │ ${(vms[1]?.ip || '').padEnd(15)} │    │  10.xx.x.x     │    │
│  │                 │    │                │    │
│  │  ┌───────────┐  │    │  ┌───────────┐ │    │
│  │  │  Firewall │  │    │  │  Firewall │ │    │
│  │  └───────────┘  │    │  └───────────┘ │    │
│  └─────────────────┘    └────────────────┘    │
│          ║                      ║             │
│          ╠══════ ISOLATED ══════╣             │
│          ║   No cross-traffic   ║             │
│                                               │
└───────────────────────────────────────────────┘`}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}