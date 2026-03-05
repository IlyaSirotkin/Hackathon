const jwt = require('jsonwebtoken');
require('dotenv').config();

// Проверка JWT токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Невалидный токен' });
        }
        req.user = user;
        next();
    });
}

// Проверка роли admin
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Требуется роль admin.' });
    }
    next();
}

// Проверка что тенант не заблокирован
async function checkTenantActive(req, res, next) {
    if (req.user.role === 'admin') return next(); // админ всегда проходит

    const pool = require('../db');
    const result = await pool.query(
        'SELECT status FROM tenants WHERE id = $1',
        [req.user.tenantId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Тенант не найден' });
    }

    if (result.rows[0].status === 'suspended') {
        return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });
    }

    next();
}

module.exports = { authenticateToken, requireAdmin, checkTenantActive };