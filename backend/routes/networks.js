const express = require('express');
const pool = require('../db');
const { authenticateToken, checkTenantActive } = require('../middleware/auth');

const router = express.Router();

// GET /api/networks
router.get('/', authenticateToken, checkTenantActive, async (req, res) => {
    try {
        let result;

        if (req.user.role === 'admin') {
            result = await pool.query(`
        SELECT n.*, t.name AS tenant_name
        FROM networks n
        JOIN tenants t ON n.tenant_id = t.id
        ORDER BY n.created_at
      `);
        } else {
            result = await pool.query(
                'SELECT * FROM networks WHERE tenant_id = $1',
                [req.user.tenantId]
            );
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;