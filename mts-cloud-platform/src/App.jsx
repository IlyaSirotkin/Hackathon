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

function ProtectedRoute({ children, requiredRole }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
    }

    return children;
}

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <LoginPage />} />

            {/* Client Routes */}
            <Route path="/" element={
                <ProtectedRoute requiredRole="client">
                    <ClientLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="vms" element={<ClientVMs />} />
                <Route path="networks" element={<ClientNetworks />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<AdminDashboard />} />
                <Route path="tenants" element={<AdminTenants />} />
                <Route path="vms" element={<AdminVMs />} />
                <Route path="resources" element={<AdminResources />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default App;