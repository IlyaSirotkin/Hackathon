const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/metrics/history — общие метрики за 24 часа (админ)
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

// GET /api/metrics/current — текущая нагрузка (админ)
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

// GET /api/metrics/tenant — метрики тенанта клиента за 24 часа
router.get('/tenant', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Тенант не найден' });
        }

        const result = await pool.query(`
      SELECT
        TO_CHAR(recorded_at, 'HH24:MI') AS time,
        ROUND(cpu_percent, 1) AS cpu,
        ROUND(ram_percent, 1) AS ram,
        ROUND(disk_percent, 1) AS disk,
        active_vms,
        total_vms
      FROM tenant_metrics
      WHERE tenant_id = $1
        AND recorded_at >= NOW() - INTERVAL '24 hours'
      ORDER BY recorded_at ASC
    `, [tenantId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// GET /api/metrics/tenant/quota — квоты и использование тенанта
router.get('/tenant/quota', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'Тенант не найден' });
        }

        const tenantResult = await pool.query(
            'SELECT name, max_vms, max_cpu, max_ram, max_disk FROM tenants WHERE id = $1',
            [tenantId]
        );

        if (tenantResult.rows.length === 0) {
            return res.status(404).json({ error: 'Тенант не найден' });
        }

        const usageResult = await pool.query(`
      SELECT
        COUNT(*) AS total_vms,
        COUNT(*) FILTER (WHERE status = 'running') AS active_vms,
        COALESCE(SUM(cpu), 0) AS used_cpu,
        COALESCE(SUM(ram), 0) AS used_ram,
        COALESCE(SUM(disk), 0) AS used_disk
      FROM virtual_machines
      WHERE tenant_id = $1
    `, [tenantId]);

        const t = tenantResult.rows[0];
        const u = usageResult.rows[0];

        res.json({
            name: t.name,
            quota: {
                maxVMs: t.max_vms,
                maxCPU: t.max_cpu,
                maxRAM: t.max_ram,
                maxDisk: t.max_disk,
            },
            usage: {
                vms: parseInt(u.total_vms),
                cpu: parseInt(u.used_cpu),
                ram: parseInt(u.used_ram),
                disk: parseInt(u.used_disk),
            },
            activeVMs: parseInt(u.active_vms),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;