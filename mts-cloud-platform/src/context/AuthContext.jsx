
import { createContext, useContext, useState, useEffect } from 'react';
import { mockTenants } from '../services/mockData';

const AuthContext = createContext(null);

const USE_MOCK = true;

const MOCK_USERS = [
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
        name: 'ООО Компания',
        role: 'client',
        tenantId: 'tenant-1',
    },
    {
        id: 'u3',
        email: 'demo@startup.ru',
        password: 'demo123',
        name: 'Стартап Технологии',
        role: 'client',
        tenantId: 'tenant-2',
    },
    {
        id: 'u4',
        email: 'blocked@test.ru',
        password: 'blocked123',
        name: 'Заблокированный',
        role: 'client',
        tenantId: 'tenant-3',
    },
];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('mts_cloud_user');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Проверяем не заблокирован ли тенант
                if (parsed.role === 'client' && parsed.tenantId) {
                    const tenant = mockTenants.find((t) => t.id === parsed.tenantId);
                    if (tenant && tenant.status === 'suspended') {
                        // Тенант заблокирован — разлогиниваем
                        localStorage.removeItem('mts_cloud_user');
                        setUser(null);
                        setLoading(false);
                        return;
                    }
                }
                setUser(parsed);
            } catch {
                localStorage.removeItem('mts_cloud_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        if (USE_MOCK) {
            const found = MOCK_USERS.find(
                (u) => u.email === email && u.password === password
            );
            if (!found) throw new Error('Неверный email или пароль');

            // Проверяем бан тенанта
            if (found.role === 'client' && found.tenantId) {
                const tenant = mockTenants.find((t) => t.id === found.tenantId);
                if (tenant && tenant.status === 'suspended') {
                    throw new Error('Ваш аккаунт заблокирован. Обратитесь к администратору.');
                }
            }

            const userData = {
                id: found.id,
                email: found.email,
                name: found.name,
                role: found.role,
                tenantId: found.tenantId,
            };
            setUser(userData);
            localStorage.setItem('mts_cloud_user', JSON.stringify(userData));
            return userData;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mts_cloud_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);