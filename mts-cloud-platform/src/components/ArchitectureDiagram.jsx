import { Box, Typography, Paper } from '@mui/material';
import {
    Computer as VMIcon,
    Storage as StorageIcon,
    Security as SecurityIcon,
    Dns as DnsIcon,
    People as PeopleIcon,
    AdminPanelSettings as AdminIcon,
    Memory as CPUIcon,
    VpnKey as KeyIcon,
} from '@mui/icons-material';

const DiagramNode = ({ icon, label, sublabel, color = '#E30611', size = 'normal', sx = {} }) => (
    <Paper
        elevation={0}
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            p: size === 'large' ? 2.5 : 1.5,
            borderRadius: 2,
            bgcolor: `${color}15`,
            border: `1.5px solid ${color}40`,
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 24px ${color}30`,
                border: `1.5px solid ${color}80`,
            },
            ...sx,
        }}
    >
        <Box sx={{ color: color, fontSize: size === 'large' ? 36 : 28 }}>
            {icon}
        </Box>
        <Typography
            variant={size === 'large' ? 'subtitle2' : 'caption'}
            sx={{ fontWeight: 600, textAlign: 'center', color: '#fff' }}
        >
            {label}
        </Typography>
        {sublabel && (
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', fontSize: '0.65rem' }}>
                {sublabel}
            </Typography>
        )}
    </Paper>
);

const Arrow = ({ label, color = '#555' }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5 }}>
        {label && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', mb: 0.3 }}>
                {label}
            </Typography>
        )}
        <Box
            sx={{
                width: 2, height: 30, bgcolor: color, position: 'relative',
                '&::after': {
                    content: '""', position: 'absolute', bottom: -6, left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `6px solid ${color}`,
                },
            }}
        />
    </Box>
);

export default function ArchitectureDiagram() {
    return (
        <Box sx={{ p: 3, overflowX: 'auto' }}>
            {/* Пользователи */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, mb: 1 }}>
                <DiagramNode
                    icon={<PeopleIcon fontSize="inherit" />}
                    label="Клиенты"
                    sublabel="Личный кабинет"
                    color="#2979FF"
                />
                <DiagramNode
                    icon={<AdminIcon fontSize="inherit" />}
                    label="Администратор"
                    sublabel="Панель управления"
                    color="#FFB300"
                />
            </Box>

            <Arrow label="HTTPS" color="#666" />

            {/* Backend API */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <DiagramNode
                    icon={<SecurityIcon fontSize="inherit" />}
                    label="Backend API"
                    sublabel="REST API + JWT авторизация + проверка tenantId"
                    color="#AB47BC"
                    size="large"
                    sx={{ minWidth: 320 }}
                />
            </Box>

            <Arrow color="#666" />

            {/* Сервисы */}
            <Box
                sx={{
                    display: 'flex', justifyContent: 'center', gap: 2, mb: 1,
                    flexWrap: 'wrap', p: 2, borderRadius: 3,
                    border: '1px dashed rgba(255,255,255,0.15)', position: 'relative',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute', top: -10, left: 16,
                        bgcolor: 'background.paper', px: 1,
                        color: 'text.secondary', fontWeight: 600,
                    }}
                >
                    БИЗНЕС-ЛОГИКА
                </Typography>
                <DiagramNode
                    icon={<KeyIcon fontSize="inherit" />}
                    label="Авторизация"
                    sublabel="JWT + роли (admin/client)"
                    color="#E30611"
                />
                <DiagramNode
                    icon={<VMIcon fontSize="inherit" />}
                    label="Управление ВМ"
                    sublabel="Создание · Запуск · Стоп"
                    color="#00C853"
                />
                <DiagramNode
                    icon={<CPUIcon fontSize="inherit" />}
                    label="Квоты"
                    sublabel="CPU · RAM · Диск · Кол-во ВМ"
                    color="#2979FF"
                />
            </Box>

            <Arrow color="#666" />

            {/* База данных */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <DiagramNode
                    icon={<StorageIcon fontSize="inherit" />}
                    label="PostgreSQL"
                    sublabel="Пользователи · Тенанты · Квоты · Сети"
                    color="#336791"
                    size="large"
                    sx={{ minWidth: 300 }}
                />
            </Box>

            <Arrow label="Proxmox API" color="#FFB300" />

            {/* Proxmox */}
            <Box
                sx={{
                    p: 2, borderRadius: 3,
                    border: '1.5px solid rgba(255,179,0,0.3)',
                    bgcolor: 'rgba(255,179,0,0.05)',
                    position: 'relative',
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute', top: -10, left: 16,
                        bgcolor: 'background.paper', px: 1,
                        color: '#FFB300', fontWeight: 600,
                    }}
                >
                    PROXMOX VE — ГИПЕРВИЗОР
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                    {['Node 1', 'Node 2', 'Node 3'].map((node, i) => (
                        <Paper
                            key={node}
                            elevation={0}
                            sx={{
                                p: 2, borderRadius: 2,
                                bgcolor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                minWidth: 160,
                                transition: 'all 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 16px rgba(255,179,0,0.15)',
                                },
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#FFB300', display: 'block', mb: 1 }}>
                                <DnsIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                {node}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {Array.from({ length: [3, 2, 2][i] }).map((_, j) => (
                                    <Box
                                        key={j}
                                        sx={{
                                            px: 1, py: 0.3, borderRadius: 1,
                                            bgcolor: j < [2, 2, 1][i] ? 'rgba(0,200,83,0.15)' : 'rgba(255,255,255,0.05)',
                                            border: '1px solid',
                                            borderColor: j < [2, 2, 1][i] ? 'rgba(0,200,83,0.3)' : 'rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        <Typography variant="caption" sx={{
                                            fontSize: '0.6rem',
                                            color: j < [2, 2, 1][i] ? '#00C853' : '#666',
                                        }}>
                                            VM-{i}{j + 1}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    ))}
                </Box>
            </Box>

            {/* Примечание */}
            <Box sx={{
                mt: 3, p: 2, borderRadius: 2,
                bgcolor: 'rgba(41,121,255,0.05)',
                border: '1px solid rgba(41,121,255,0.2)',
            }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    <strong style={{ color: '#2979FF' }}>Как работает изоляция:</strong> Каждый клиент
                    получает уникальный <code style={{ color: '#FFB300' }}>tenantId</code>. Все API-запросы
                    проверяют JWT-токен и возвращают только ресурсы, принадлежащие данному тенанту.
                    Виртуальные машины создаются на Proxmox через API с привязкой к тенанту.
                </Typography>
            </Box>
        </Box>
    );
}