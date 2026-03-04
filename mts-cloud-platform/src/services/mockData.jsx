// src/services/mockData.js

// ===== ПОЛЬЗОВАТЕЛИ =====
export const mockUsers = [
    {
        id: 'u1',
        email: 'admin@mtscloud.ru',
        password: 'admin123',
        name: 'Администратор',
        role: 'admin',
        tenantId: null,
    },
    {
        id: 'u2',
        email: 'client@company.ru',
        password: 'client123',
        name: 'Иванов Иван',
        role: 'client',
        tenantId: 'tenant-1',
    },
    {
        id: 'u3',
        email: 'demo@startup.ru',
        password: 'demo123',
        name: 'Петров Пётр',
        role: 'client',
        tenantId: 'tenant-2',
    },
    {
        id: 'u4',
        email: 'blocked@test.ru',
        password: 'blocked123',
        name: 'Сидоров Сидор',
        role: 'client',
        tenantId: 'tenant-3',
    },
];

// ===== ТЕНАНТЫ =====
export const mockTenants = [
    {
        id: 'tenant-1',
        name: 'ООО Компания',
        status: 'active',
        createdAt: '2024-01-15',
        admin: 'client@company.ru',
        quota: { maxVMs: 10, maxCPU: 32, maxRAM: 64, maxDisk: 500 },
        usage: { vms: 3, cpu: 8, ram: 16, disk: 120 },
    },
    {
        id: 'tenant-2',
        name: 'Стартап Технологии',
        status: 'active',
        createdAt: '2024-03-20',
        admin: 'demo@startup.ru',
        quota: { maxVMs: 5, maxCPU: 16, maxRAM: 32, maxDisk: 200 },
        usage: { vms: 2, cpu: 4, ram: 8, disk: 60 },
    },
    {
        id: 'tenant-3',
        name: 'Тест Blocked',
        status: 'suspended',
        createdAt: '2024-06-01',
        admin: 'blocked@test.ru',
        quota: { maxVMs: 3, maxCPU: 8, maxRAM: 16, maxDisk: 100 },
        usage: { vms: 1, cpu: 2, ram: 4, disk: 30 },
    },
];

// ===== ВИРТУАЛЬНЫЕ МАШИНЫ =====
export const mockVMs = [
    {
        id: 'vm-1',
        tenantId: 'tenant-1',
        name: 'web-server-01',
        status: 'running',
        os: 'Ubuntu 22.04',
        cpu: 4,
        ram: 8,
        disk: 50,
        ip: '10.10.1.10',
        network: 'net-1',
        createdAt: '2024-01-20',
    },
    {
        id: 'vm-2',
        tenantId: 'tenant-1',
        name: 'db-master',
        status: 'running',
        os: 'Ubuntu 22.04',
        cpu: 2,
        ram: 4,
        disk: 40,
        ip: '10.10.1.11',
        network: 'net-1',
        createdAt: '2024-02-10',
    },
    {
        id: 'vm-3',
        tenantId: 'tenant-1',
        name: 'staging',
        status: 'stopped',
        os: 'Debian 12',
        cpu: 2,
        ram: 4,
        disk: 30,
        ip: '10.10.1.12',
        network: 'net-1',
        createdAt: '2024-03-05',
    },
    {
        id: 'vm-4',
        tenantId: 'tenant-2',
        name: 'app-server',
        status: 'running',
        os: 'Ubuntu 24.04',
        cpu: 2,
        ram: 4,
        disk: 30,
        ip: '10.10.2.10',
        network: 'net-2',
        createdAt: '2024-03-25',
    },
    {
        id: 'vm-5',
        tenantId: 'tenant-2',
        name: 'redis-cache',
        status: 'running',
        os: 'Ubuntu 22.04',
        cpu: 2,
        ram: 4,
        disk: 30,
        ip: '10.10.2.11',
        network: 'net-2',
        createdAt: '2024-04-01',
    },
    {
        id: 'vm-6',
        tenantId: 'tenant-3',
        name: 'test-vm',
        status: 'stopped',
        os: 'CentOS 9',
        cpu: 2,
        ram: 4,
        disk: 30,
        ip: '10.10.3.10',
        network: 'net-3',
        createdAt: '2024-06-05',
    },
];

// ===== СЕТИ =====
export const mockNetworks = [
    {
        id: 'net-1',
        tenantId: 'tenant-1',
        name: 'production-net',
        subnet: '10.10.1.0/24',
        gateway: '10.10.1.1',
        vlan: 101,
    },
    {
        id: 'net-2',
        tenantId: 'tenant-2',
        name: 'dev-net',
        subnet: '10.10.2.0/24',
        gateway: '10.10.2.1',
        vlan: 102,
    },
    {
        id: 'net-3',
        tenantId: 'tenant-3',
        name: 'test-net',
        subnet: '10.10.3.0/24',
        gateway: '10.10.3.1',
        vlan: 103,
    },
];

// ===== СТАТИСТИКА ДЛЯ ДАШБОРДА =====
export const mockDashboardStats = {
    totalVMs: 6,
    runningVMs: 4,
    totalTenants: 3,
    activeTenants: 2,
    totalCPU: { used: 14, total: 64 },
    totalRAM: { used: 28, total: 128 },
    totalDisk: { used: 210, total: 2000 },
};