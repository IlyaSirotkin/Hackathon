import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { mockUsers } from '../services/mockData';

const AuthContext = createContext(null);

// Переключатель: true = mock данные, false = реальный бэкенд
const USE_MOCK = true;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        if (USE_MOCK) {
            const found = mockUsers.find(
                (u) => u.email === email && u.password === password
            );
            if (!found) {
                throw new Error('Неверный email или пароль');
            }
            const userData = { ...found };
            delete userData.password;
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', 'mock-token-' + found.id);
            setUser(userData);
            return userData;
        }

        const response = await authAPI.login({ email, password });
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return response.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}