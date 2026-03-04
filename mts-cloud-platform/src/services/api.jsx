const API_BASE = 'http://localhost:8080/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

// ============ AUTH ============
export const authAPI = {
    login: (credentials) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),

    register: (data) =>
        request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    me: () => request('/auth/me'),
};

// ============ VMs (Client) ============
export const vmAPI = {
    getAll: () => request('/vms'),

    getById: (id) => request(`/vms/${id}`),

    create: (data) =>
        request('/vms', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    delete: (id) =>
        request(`/vms/${id}`, {
            method: 'DELETE',
        }),

    start: (id) =>
        request(`/vms/${id}/start`, {
            method: 'POST',
        }),

    stop: (id) =>
        request(`/vms/${id}/stop`, {
            method: 'POST',
        }),

    restart: (id) =>
        request(`/vms/${id}/restart`, {
            method: 'POST',
        }),
};

// ============ QUOTAS (Client) ============
export const quotaAPI = {
    getMy: () => request('/quotas/my'),
};

// ============ ADMIN: Tenants ============
export const adminTenantsAPI = {
    getAll: () => request('/admin/tenants'),

    getById: (id) => request(`/admin/tenants/${id}`),

    create: (data) =>
        request('/admin/tenants', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id, data) =>
        request(`/admin/tenants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id) =>
        request(`/admin/tenants/${id}`, {
            method: 'DELETE',
        }),

    setQuota: (id, quota) =>
        request(`/admin/tenants/${id}/quota`, {
            method: 'PUT',
            body: JSON.stringify(quota),
        }),
};

// ============ ADMIN: VMs ============
export const adminVMsAPI = {
    getAll: () => request('/admin/vms'),

    getByTenant: (tenantId) => request(`/admin/tenants/${tenantId}/vms`),
};

// ============ ADMIN: Dashboard ============
export const adminDashboardAPI = {
    getStats: () => request('/admin/dashboard/stats'),

    getResourceUsage: () => request('/admin/dashboard/resources'),
};

// ============ NETWORKS ============
export const networkAPI = {
    getMyNetworks: () => request('/networks'),
};