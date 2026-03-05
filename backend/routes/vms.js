const express = require('express');
const pool = require('../db');
const { authenticateToken, checkTenantActive } = require('../middleware/auth');

const router = express.Router();

// GET /api/vms
router.get('/', authenticateToken, checkTenantActive, async (req, res) => {
    try {
        let result;
        if (req.user.role === 'admin') {
            result = await pool.query(`
        SELECT vm.*, t.name AS tenant_name
        FROM virtual_machines vm
        JOIN tenants t ON vm.tenant_id = t.id
        ORDER BY vm.created_at
      `);
        } else {
            result = await pool.query(
                'SELECT * FROM virtual_machines WHERE tenant_id = $1 ORDER BY created_at',
                [req.user.tenantId]
            );
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/vms
router.post('/', authenticateToken, checkTenantActive, async (req, res) => {
    try {
        const tenantId = req.user.role === 'admin' ? req.body.tenantId : req.user.tenantId;
        const { name, os, cpu, ram, disk } = req.body;

        const tenant = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (tenant.rows.length === 0) {
            return res.status(404).json({ error: 'Тенант не найден' });
        }
        const t = tenant.rows[0];

        const usage = await pool.query(
            `SELECT COUNT(*) AS vms, COALESCE(SUM(cpu),0) AS cpu,
        COALESCE(SUM(ram),0) AS ram, COALESCE(SUM(disk),0) AS disk
       FROM virtual_machines WHERE tenant_id = $1`,
            [tenantId]
        );
        const u = usage.rows[0];

        if (parseInt(u.vms) >= t.max_vms) {
            return res.status(400).json({ error: `Лимит ВМ исчерпан (${t.max_vms})` });
        }
        if (parseInt(u.cpu) + cpu > t.max_cpu) {
            return res.status(400).json({ error: `Недостаточно CPU (доступно: ${t.max_cpu - parseInt(u.cpu)})` });
        }
        if (parseInt(u.ram) + ram > t.max_ram) {
            return res.status(400).json({ error: `Недостаточно RAM (доступно: ${t.max_ram - parseInt(u.ram)})` });
        }
        if (parseInt(u.disk) + disk > t.max_disk) {
            return res.status(400).json({ error: `Недостаточно диска (доступно: ${t.max_disk - parseInt(u.disk)})` });
        }

        const result = await pool.query(
            `INSERT INTO virtual_machines (tenant_id, name, os, cpu, ram, disk, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'creating')
       RETURNING *`,
            [tenantId, name, os, cpu, ram, disk]
        );

        await pool.query(
            `INSERT INTO audit_logs (user_id, tenant_id, action, target_type, target_id, details)
       VALUES ($1, $2, 'vm.create', 'vm', $3, $4)`,
            [req.user.id, tenantId, result.rows[0].id, JSON.stringify({ name, os, cpu, ram, disk })]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PATCH /api/vms/:id — обновить ВМ
router.patch('/:id', authenticateToken, checkTenantActive, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, cpu, ram, disk, os } = req.body;

        const vm = await pool.query('SELECT * FROM virtual_machines WHERE id = $1', [id]);
        if (vm.rows.length === 0) {
            return res.status(404).json({ error: 'ВМ не найдена' });
        }

        if (req.user.role === 'client' && vm.rows[0].tenant_id !== req.user.tenantId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        if (vm.rows[0].status === 'running' && (cpu || ram || disk)) {
            return res.status(400).json({ error: 'Остановите ВМ перед изменением ресурсов' });
        }

        const updates = [];
        const values = [];
        let idx = 1;

        if (name) { updates.push(`name = $${idx++}`); values.push(name); }
        if (cpu) { updates.push(`cpu = $${idx++}`); values.push(cpu); }
        if (ram) { updates.push(`ram = $${idx++}`); values.push(ram); }
        if (disk) { updates.push(`disk = $${idx++}`); values.push(disk); }
        if (os) { updates.push(`os = $${idx++}`); values.push(os); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Нечего обновлять' });
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const result = await pool.query(
            `UPDATE virtual_machines SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        await pool.query(
            `INSERT INTO audit_logs (user_id, tenant_id, action, target_type, target_id, details)
       VALUES ($1, $2, 'vm.update', 'vm', $3, $4)`,
            [req.user.id, vm.rows[0].tenant_id, id, JSON.stringify({ name, cpu, ram, disk, os })]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// PATCH /api/vms/:id/action — start / stop / reboot
router.patch('/:id/action', authenticateToken, checkTenantActive, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        let vm;
        if (req.user.role === 'admin') {
            vm = await pool.query('SELECT * FROM virtual_machines WHERE id = $1', [id]);
        } else {
            vm = await pool.query(
                'SELECT * FROM virtual_machines WHERE id = $1 AND tenant_id = $2',
                [id, req.user.tenantId]
            );
        }

        if (vm.rows.length === 0) {
            return res.status(404).json({ error: 'ВМ не найдена' });
        }

        const newStatus = action === 'start' ? 'running' : 'stopped';

        const result = await pool.query(
            'UPDATE virtual_machines SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [newStatus, id]
        );

        await pool.query(
            `INSERT INTO audit_logs (user_id, tenant_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, 'vm', $4, $5)`,
            [req.user.id, vm.rows[0].tenant_id, `vm.${action}`, id, JSON.stringify({ name: vm.rows[0].name })]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// DELETE /api/vms/:id
router.delete('/:id', authenticateToken, checkTenantActive, async (req, res) => {
    try {
        const { id } = req.params;

        let vm;
        if (req.user.role === 'admin') {
            vm = await pool.query('SELECT * FROM virtual_machines WHERE id = $1', [id]);
        } else {
            vm = await pool.query(
                'SELECT * FROM virtual_machines WHERE id = $1 AND tenant_id = $2',
                [id, req.user.tenantId]
            );
        }

        if (vm.rows.length === 0) {
            return res.status(404).json({ error: 'ВМ не найдена' });
        }

        await pool.query('DELETE FROM virtual_machines WHERE id = $1', [id]);

        res.json({ message: 'ВМ удалена' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;