import { mockTenants, mockUsers } from './mockData';

// Единое хранилище — мутабельное, видно всем
const store = {
    tenants: JSON.parse(JSON.stringify(mockTenants)),
    users: JSON.parse(JSON.stringify(mockUsers)),
};

// ===== ТЕНАНТЫ =====
export function getTenants() {
    return store.tenants;
}

export function getTenantById(tenantId) {
    return store.tenants.find((t) => t.id === tenantId);
}

export function addTenant(tenant) {
    store.tenants.push(tenant);
}

export function deleteTenant(tenantId) {
    store.tenants = store.tenants.filter((t) => t.id !== tenantId);
}

export function updateTenant(tenantId, data) {
    const index = store.tenants.findIndex((t) => t.id === tenantId);
    if (index !== -1) {
        store.tenants[index] = { ...store.tenants[index], ...data };
    }
}

export function updateTenantStatus(tenantId, status) {
    const index = store.tenants.findIndex((t) => t.id === tenantId);
    if (index !== -1) {
        store.tenants[index].status = status;
    }
}

export function isTenantBanned(tenantId) {
    if (!tenantId) return false;
    const tenant = store.tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.status === 'suspended' : false;
}

// ===== ПОЛЬЗОВАТЕЛИ =====
export function getUsers() {
    return store.users;
}

export function getUserByCredentials(email, password) {
    return store.users.find((u) => u.email === email && u.password === password);
}

export function getUserById(userId) {
    return store.users.find((u) => u.id === userId);
}