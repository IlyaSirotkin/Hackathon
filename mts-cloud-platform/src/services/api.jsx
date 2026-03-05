const API_URL = '/api';

// Базовый fetch с токеном
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Если забанен или токен невалидный
    if (response.status === 401 || response.status === 403) {
        const data = await response.json();

        // Если забанен — разлогиниваем
        if (response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        throw new Error(data.error || 'Доступ запрещён');
    }

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка сервера');
    }

    return response.json();
}

// ===== AUTH =====
export const authAPI = {
    login: (email, password) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    me: () => request('/auth/me'),
};

// ===== TENANTS =====
export const tenantsAPI = {
    getAll: () => request('/tenants'),

    create: (data) =>
        request('/tenants', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id, data) =>
        request(`/tenants/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    setStatus: (id, status) =>
        request(`/tenants/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    delete: (id) =>
        request(`/tenants/${id}`, {
            method: 'DELETE',
        }),
};

// ===== VMs =====
export const vmsAPI = {
    getAll: () => request('/vms'),

    create: (data) =>
        request('/vms', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id, data) =>
        request(`/vms/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    action: (id, action) =>
        request(`/vms/${id}/action`, {
            method: 'PATCH',
            body: JSON.stringify({ action }),
        }),

    delete: (id) =>
        request(`/vms/${id}`, {
            method: 'DELETE',
        }),
};

// ===== NETWORKS =====
export const networksAPI = {
    getAll: () => request('/networks'),
};

// ===== STATS =====
export const statsAPI = {
    get: () => request('/stats'),
};