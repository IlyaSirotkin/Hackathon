// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getUserByCredentials, isTenantBanned } from '../services/store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // При загрузке — проверяем сохранённую сессию
    useEffect(() => {
        const saved = localStorage.getItem('mts_cloud_user');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Проверяем бан
                if (parsed.role === 'client' && parsed.tenantId) {
                    if (isTenantBanned(parsed.tenantId)) {
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

    // Каждую секунду проверяем — не забанили ли текущего юзера
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            if (user.role === 'client' && user.tenantId) {
                if (isTenantBanned(user.tenantId)) {
                    setUser(null);
                    localStorage.removeItem('mts_cloud_user');
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [user]);

    const login = async (email, password) => {
        // Ищем пользователя в store
        const found = getUserByCredentials(email, password);
        if (!found) {
            throw new Error('Неверный email или пароль');
        }

        // Проверяем бан тенанта
        if (found.role === 'client' && found.tenantId) {
            if (isTenantBanned(found.tenantId)) {
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