const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats — статистика для дашборда админа
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const tenants = await pool.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = \'active\') AS active FROM tenants');
        const vms = await pool.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = \'running\') AS running FROM virtual_machines');
        const resources = await pool.query('SELECT COALESCE(SUM(cpu),0) AS cpu, COALESCE(SUM(ram),0) AS ram, COALESCE(SUM(disk),0) AS disk FROM virtual_machines');

        res.json({
            totalTenants: parseInt(tenants.rows[0].total),
            activeTenants: parseInt(tenants.rows[0].active),
            totalVMs: parseInt(vms.rows[0].total),
            runningVMs: parseInt(vms.rows[0].running),
            totalCPU: { used: parseInt(resources.rows[0].cpu), total: 64 },
            totalRAM: { used: parseInt(resources.rows[0].ram), total: 128 },
            totalDisk: { used: parseInt(resources.rows[0].disk), total: 2000 },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;