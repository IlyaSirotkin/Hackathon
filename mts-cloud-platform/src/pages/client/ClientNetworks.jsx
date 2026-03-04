// src/pages/client/ClientNetworks.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Box, Card, CardContent, Typography, Grid, Chip, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper,
} from '@mui/material';
import {
    Shield as ShieldIcon,
    Lan as LanIcon,
    Lock as LockIcon,
    Computer as VMIcon,
    Dns as DnsIcon,
    VpnKey as KeyIcon,
    Storage as StorageIcon,
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
                Виртуальные сети вашей инфраструктуры
            </Typography>

            {/* Баннер изоляции */}
            <Card sx={{ mb: 3, border: '1px solid rgba(0,200,83,0.2)', bgcolor: 'rgba(0,200,83,0.03)' }}>
                <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
                    <ShieldIcon sx={{ color: 'success.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                            Доступ изолирован
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Вы имеете доступ только к своим ресурсам. Каждый запрос проходит авторизацию —
                            доступ к чужим виртуальным машинам и сетям невозможен.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                {/* Карточки сетей */}
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
                                        label="Активна"
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
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Идентификатор</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{network.id}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Машин в сети</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {vms.filter((v) => v.network === network.id).length}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Подключённые ВМ</Typography>
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

                {/* Схема инфраструктуры клиента */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Ваша инфраструктура
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                Как устроен доступ к вашим ресурсам
                            </Typography>

                            <Box sx={{ p: 3, overflowX: 'auto' }}>

                                {/* Вы (клиент) */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            px: 4, py: 1.5, borderRadius: 2,
                                            bgcolor: 'rgba(41,121,255,0.1)',
                                            border: '1.5px solid rgba(41,121,255,0.3)',
                                            display: 'flex', alignItems: 'center', gap: 1.5,
                                            transition: 'all 0.3s',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(41,121,255,0.2)' },
                                        }}
                                    >
                                        <Box sx={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            bgcolor: 'rgba(41,121,255,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            👤
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2979FF' }}>
                                                {tenant?.name || 'Вы'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Личный кабинет
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>

                                {/* Стрелка */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', mb: 0.5 }}>
                                            HTTPS
                                        </Typography>
                                        <Box sx={{ width: 2, height: 25, bgcolor: '#444', position: 'relative' }}>
                                            <Box sx={{
                                                position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                                                borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                                                borderTop: '6px solid #444',
                                            }} />
                                        </Box>
                                    </Box>
                                </Box>

                                {/* API + Авторизация */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 1 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            px: 3, py: 1.5, borderRadius: 2,
                                            bgcolor: 'rgba(227,6,17,0.08)',
                                            border: '1.5px solid rgba(227,6,17,0.3)',
                                            display: 'flex', alignItems: 'center', gap: 1.5,
                                            transition: 'all 0.3s',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(227,6,17,0.15)' },
                                        }}
                                    >
                                        <KeyIcon sx={{ color: '#E30611' }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#E30611' }}>
                                                API + Авторизация
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                JWT-токен · проверка tenantId · доступ только к своим ресурсам
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>

                                {/* Стрелка */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <Box sx={{ width: 2, height: 25, bgcolor: '#444', position: 'relative' }}>
                                        <Box sx={{
                                            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                                            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                                            borderTop: '6px solid #444',
                                        }} />
                                    </Box>
                                </Box>

                                {/* Proxmox */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            px: 3, py: 1.5, borderRadius: 2,
                                            bgcolor: 'rgba(255,179,0,0.08)',
                                            border: '1.5px solid rgba(255,179,0,0.3)',
                                            display: 'flex', alignItems: 'center', gap: 1.5,
                                            transition: 'all 0.3s',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(255,179,0,0.15)' },
                                        }}
                                    >
                                        <DnsIcon sx={{ color: '#FFB300' }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#FFB300' }}>
                                                Proxmox VE
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                Гипервизор · создание и управление ВМ
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>

                                {/* Линии к ВМ */}
                                {vms.length > 0 && (
                                    <>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                            <Box sx={{ width: '70%', height: 2, bgcolor: 'rgba(0,200,83,0.3)' }} />
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                            <Box sx={{ width: '70%', display: 'flex', justifyContent: 'space-around' }}>
                                                {vms.map((vm) => (
                                                    <Box key={vm.id} sx={{ width: 2, height: 20, bgcolor: 'rgba(0,200,83,0.3)' }} />
                                                ))}
                                            </Box>
                                        </Box>
                                    </>
                                )}

                                {/* Виртуальные машины */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    {vms.map((vm) => (
                                        <Paper
                                            key={vm.id}
                                            elevation={0}
                                            sx={{
                                                p: 2, borderRadius: 2, minWidth: 170,
                                                bgcolor: vm.status === 'running'
                                                    ? 'rgba(0,200,83,0.08)'
                                                    : 'rgba(255,255,255,0.03)',
                                                border: '1.5px solid',
                                                borderColor: vm.status === 'running'
                                                    ? 'rgba(0,200,83,0.3)'
                                                    : 'rgba(255,255,255,0.1)',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: vm.status === 'running'
                                                        ? '0 8px 24px rgba(0,200,83,0.2)'
                                                        : '0 8px 24px rgba(255,255,255,0.05)',
                                                },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <VMIcon sx={{
                                                    fontSize: 20,
                                                    color: vm.status === 'running' ? '#00C853' : '#666',
                                                }} />
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {vm.name}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                {vm.os}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontFamily: 'monospace' }}>
                                                IP: {vm.ip}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                {vm.cpu} vCPU · {vm.ram} ГБ · {vm.disk} ГБ
                                            </Typography>
                                            <Chip
                                                label={vm.status === 'running' ? 'Работает' : 'Остановлена'}
                                                size="small"
                                                color={vm.status === 'running' ? 'success' : 'default'}
                                                variant="outlined"
                                                sx={{ mt: 1, fontSize: '0.65rem', height: 20 }}
                                            />
                                        </Paper>
                                    ))}

                                    {vms.length === 0 && (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 3, borderRadius: 2, textAlign: 'center',
                                                bgcolor: 'rgba(255,255,255,0.02)',
                                                border: '1.5px dashed rgba(255,255,255,0.1)',
                                                minWidth: 200,
                                            }}
                                        >
                                            <VMIcon sx={{ fontSize: 32, color: '#666', mb: 1 }} />
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Нет виртуальных машин
                                            </Typography>
                                        </Paper>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}