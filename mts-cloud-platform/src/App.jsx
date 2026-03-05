import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

import LoginPage from './pages/auth/LoginPage';
import ClientLayout from './layouts/ClientLayout';
import AdminLayout from './layouts/AdminLayout';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import ClientVMs from './pages/client/ClientVMs';
import ClientNetworks from './pages/client/ClientNetworks';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTenants from './pages/admin/AdminTenants';
import AdminVMs from './pages/admin/AdminVMs';
import AdminResources from './pages/admin/AdminResources';

export default function App() {
    const { user, loading } = useAuth();  // ← внутри компонента!

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'admin' ? '/admin' : '/client'} />} />

            {/* Client Routes */}
            <Route path="/client" element={user?.role === 'client' ? <ClientLayout /> : <Navigate to="/login" />}>
                <Route index element={<ClientDashboard />} />
                <Route path="vms" element={<ClientVMs />} />
                <Route path="networks" element={<ClientNetworks />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={user?.role === 'admin' ? <AdminLayout /> : <Navigate to="/login" />}>
                <Route index element={<AdminDashboard />} />
                <Route path="tenants" element={<AdminTenants />} />
                <Route path="vms" element={<AdminVMs />} />
                <Route path="resources" element={<AdminResources />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}