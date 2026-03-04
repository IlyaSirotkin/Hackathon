// src/components/NetworkDiagram.jsx
import { Box, Typography, Paper } from '@mui/material';
import {
    Shield as ShieldIcon,
    Lock as LockIcon,
    Computer as VMIcon,
    Router as RouterIcon,
    Block as BlockIcon,
} from '@mui/icons-material';

const TenantNetwork = ({ name, vlan, subnet, gateway, vmCount, color }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2.5,
            borderRadius: 2,
            border: `2px solid ${color}40`,
            bgcolor: `${color}08`,
            flex: 1,
            minWidth: 200,
            transition: 'all 0.3s ease',
            '&:hover': {
                border: `2px solid ${color}80`,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 24px ${color}20`,
            },
        }}
    >
        {/* Заголовок тенанта */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <LockIcon sx={{ fontSize: 16, color: color }} />
            </Box>
            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>
                    {name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    VLAN {vlan}
                </Typography>
            </Box>
        </Box>

        {/* Сеть */}
        <Box
            sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                mb: 1.5,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <RouterIcon sx={{ fontSize: 14, color: color }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Подсеть
                </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {subnet}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                GW: {gateway}
            </Typography>
        </Box>

        {/* ВМ */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {Array.from({ length: vmCount }).map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.3,
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                        bgcolor: 'rgba(0,200,83,0.1)',
                        border: '1px solid rgba(0,200,83,0.2)',
                    }}
                >
                    <VMIcon sx={{ fontSize: 12, color: '#00C853' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#00C853' }}>
                        VM-{i + 1}
                    </Typography>
                </Box>
            ))}
        </Box>

        {/* Firewall */}
        <Box
            sx={{
                mt: 1.5,
                p: 1,
                borderRadius: 1,
                bgcolor: `${color}10`,
                border: `1px dashed ${color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
            }}
        >
            <ShieldIcon sx={{ fontSize: 14, color: color }} />
            <Typography variant="caption" sx={{ color: color, fontWeight: 600 }}>
                Firewall Active
            </Typography>
        </Box>
    </Paper>
);

export default function NetworkDiagram({ tenants, networks, vms }) {
    const tenantColors = ['#E30611', '#2979FF', '#00C853', '#FFB300'];

    return (
        <Box>
            {/* Заголовок */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    mb: 3,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(0,200,83,0.05)',
                    border: '1px solid rgba(0,200,83,0.2)',
                }}
            >
                <ShieldIcon sx={{ color: 'success.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                    Сетевая изоляция между тенантами
                </Typography>
            </Box>

            {/* Облако / Интернет */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 10,
                        bgcolor: 'rgba(171,71,188,0.1)',
                        border: '1.5px solid rgba(171,71,188,0.3)',
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#AB47BC' }}>
                        ☁️ Internet / Public Network
                    </Typography>
                </Paper>
            </Box>

            {/* Стрелка вниз */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ width: 2, height: 40, bgcolor: '#444', position: 'relative' }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -6,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '6px solid #444',
                        }}
                    />
                </Box>
            </Box>

            {/* Физический коммутатор */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,179,0,0.1)',
                        border: '1.5px solid rgba(255,179,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <RouterIcon sx={{ color: '#FFB300' }} />
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#FFB300' }}>
                            Virtual Switch (VLAN Trunk)
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Маршрутизация + VLAN-сегментация
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Линии к тенантам */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Box
                    sx={{
                        width: '80%',
                        height: 2,
                        bgcolor: '#333',
                        position: 'relative',
                    }}
                >
                    {/* Вертикальные линии */}
                    {[0, 50, 100].slice(0, networks.length).map((pos, i) => (
                        <Box
                            key={i}
                            sx={{
                                position: 'absolute',
                                left: `${pos}%`,
                                transform: 'translateX(-50%)',
                                width: 2,
                                height: 30,
                                bgcolor: tenantColors[i],
                                top: 0,
                            }}
                        />
                    ))}
                </Box>
            </Box>

            <Box sx={{ height: 20 }} />

            {/* Тенанты */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {networks.map((network, i) => {
                    const tenant = tenants.find((t) => t.id === network.tenantId);
                    const vmCount = vms.filter((v) => v.tenantId === network.tenantId).length;
                    return (
                        <TenantNetwork
                            key={network.id}
                            name={tenant?.name || 'Тенант'}
                            vlan={network.vlan}
                            subnet={network.subnet}
                            gateway={network.gateway}
                            vmCount={vmCount}
                            color={tenantColors[i % tenantColors.length]}
                        />
                    );
                })}
            </Box>

            {/* Блок изоляции */}
            <Box
                sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(227,6,17,0.05)',
                    border: '1px solid rgba(227,6,17,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    flexWrap: 'wrap',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockIcon sx={{ color: '#E30611' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <strong style={{ color: '#E30611' }}>VLAN 101</strong> ⟷ <strong style={{ color: '#E30611' }}>VLAN 102</strong> = Трафик заблокирован
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockIcon sx={{ color: '#E30611' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        <strong style={{ color: '#E30611' }}>VLAN 102</strong> ⟷ <strong style={{ color: '#E30611' }}>VLAN 103</strong> = Трафик заблокирован
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShieldIcon sx={{ color: '#00C853' }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Каждый тенант <strong style={{ color: '#00C853' }}>полностью изолирован</strong>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}