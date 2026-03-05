const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/metrics/history — данные за 24 часа
router.get('/history', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        TO_CHAR(recorded_at, 'HH24:MI') AS time,
        ROUND(cpu_percent, 1) AS cpu,
        ROUND(ram_percent, 1) AS ram,
        ROUND(disk_percent, 1) AS disk,
        active_vms,
        total_vms
      FROM metrics
      WHERE recorded_at >= NOW() - INTERVAL '24 hours'
      ORDER BY recorded_at ASC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// GET /api/metrics/current — текущая нагрузка
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT * FROM metrics
      ORDER BY recorded_at DESC
      LIMIT 1
    `);

        res.json(result.rows[0] || { cpu_percent: 0, ram_percent: 0, disk_percent: 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;