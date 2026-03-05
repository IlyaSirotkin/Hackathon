const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        // Ищем пользователя
        const userResult = await pool.query(
            `SELECT u.*, t.status AS tenant_status, t.name AS tenant_name
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = userResult.rows[0];

        // Проверяем пароль
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Проверяем бан тенанта
        if (user.role === 'client' && user.tenant_status === 'suspended') {
            return res.status(403).json({ error: 'Ваш аккаунт заблокирован. Обратитесь к администратору.' });
        }

        // Генерируем JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenant_id,
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Логируем
        await pool.query(
            `INSERT INTO audit_logs (user_id, tenant_id, action, details)
       VALUES ($1, $2, 'user.login', $3)`,
            [user.id, user.tenant_id, JSON.stringify({ email: user.email })]
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenant_id,
                tenantName: user.tenant_name,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// GET /api/auth/me — проверка текущей сессии
router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Не авторизован' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Проверяем бан
        if (decoded.tenantId) {
            const tenant = await pool.query(
                'SELECT status FROM tenants WHERE id = $1',
                [decoded.tenantId]
            );
            if (tenant.rows.length > 0 && tenant.rows[0].status === 'suspended') {
                return res.status(403).json({ error: 'Аккаунт заблокирован' });
            }
        }

        res.json({ user: decoded });
    } catch {
        res.status(403).json({ error: 'Невалидный токен' });
    }
});

module.exports = router;