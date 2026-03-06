import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
    Menu, MenuItem, Divider, Chip,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Computer as ComputerIcon,
    NetworkCheck as NetworkIcon,
    CreditCard as SubIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Cloud as CloudIcon,
    Person as PersonIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

const menuItems = [
    { text: 'Обзор', icon: <DashboardIcon />, path: '/client' },
    { text: 'Виртуальные машины', icon: <ComputerIcon />, path: '/client/vms' },
    { text: 'Сети', icon: <NetworkIcon />, path: '/client/networks' },
    { text: 'Подписка', icon: <SubIcon />, path: '/client/subscription' },
];

export default function ClientLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CloudIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                        MTS Cloud
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        Infrastructure as a Service
                    </Typography>
                </Box>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <List sx={{ px: 1.5, pt: 2, flex: 1 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            onClick={() => { navigate(item.path); setMobileOpen(false); }}
                            selected={location.pathname === item.path}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(227, 6, 17, 0.15)',
                                    '&:hover': { bgcolor: 'rgba(227, 6, 17, 0.25)' },
                                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <Box sx={{ p: 2 }}>
                <Chip
                    icon={<PersonIcon />}
                    label={user?.name || 'Клиент'}
                    variant="outlined"
                    size="small"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                />
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'none',
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
                        {menuItems.find((i) => i.path === location.pathname)?.text || 'Панель управления'}
                    </Typography>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                            {user?.name?.[0] || 'U'}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">{user?.email}</Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={logout}>
                            <LogoutIcon sx={{ mr: 1, fontSize: 18 }} /> Выйти
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: 0 }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper' },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'background.paper' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    pt: 11,
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    bgcolor: 'background.default',
                    minHeight: '100vh',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}