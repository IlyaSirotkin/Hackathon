
const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/tenants — все тенанты (только админ)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        t.*,
        COUNT(vm.id) AS used_vms,
        COALESCE(SUM(vm.cpu), 0) AS used_cpu,
        COALESCE(SUM(vm.ram), 0) AS used_ram,
        COALESCE(SUM(vm.disk), 0) AS used_disk
      FROM tenants t
      LEFT JOIN virtual_machines vm ON vm.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at
    `);

        const tenants = result.rows.map((t) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            createdAt: t.created_at,
            admin: t.admin_email,
            quota: {
                maxVMs: t.max_vms,
                maxCPU: t.max_cpu,
                maxRAM: t.max_ram,
                maxDisk: t.max_disk,
            },
            usage: {
                vms: parseInt(t.used_vms),
                cpu: parseInt(t.used_cpu),
                ram: parseInt(t.used_ram),
                disk: parseInt(t.used_disk),
            },
        }));

        res.json(tenants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/tenants — создать тенант
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, admin, maxVMs, maxCPU, maxRAM, maxDisk } = req.body;

        const result = await pool.query(
            `INSERT INTO tenants (name, admin_email, max_vms, max_cpu, max_ram, max_disk)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [name, admin, maxVMs || 5, maxCPU || 16, maxRAM || 32, maxDisk || 200]
        );

        await pool.query(
            `INSERT INTO audit_logs (user_id, action, target_type, target_id, details)
       VALUES ($1, 'tenant.create', 'tenant', $2, $3)`,
            [req.user.id, result.rows[0].id, JSON.stringify({ name })]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PATCH /api/tenants/:id — обновить тенант
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, admin, maxVMs, maxCPU, maxRAM, maxDisk } = req.body;

        const result = await pool.query(
            `UPDATE tenants
       SET name = COALESCE($1, name),
           admin_email = COALESCE($2, admin_email),
           max_vms = COALESCE($3, max_vms),
           max_cpu = COALESCE($4, max_cpu),
           max_ram = COALESCE($5, max_ram),
           max_disk = COALESCE($6, max_disk),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
            [name, admin, maxVMs, maxCPU, maxRAM, maxDisk, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Тенант не найден' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PATCH /api/tenants/:id/status — заблокировать / разблокировать
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ error: 'Статус должен быть active или suspended' });
        }

        const result = await pool.query(
            `UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Тенант не найден' });
        }

        await pool.query(
            `INSERT INTO audit_logs (user_id, tenant_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, 'tenant', $2, $4)`,
            [
                req.user.id,
                id,
                status === 'suspended' ? 'tenant.suspend' : 'tenant.activate',
                JSON.stringify({ status }),
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// DELETE /api/tenants/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tenants WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Тенант не найден' });
        }

        res.json({ message: 'Тенант удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;