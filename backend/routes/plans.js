const express = require('express');
const pool = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/plans — все планы (доступно всем авторизованным)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM plans ORDER BY sort_order');
        const plans = result.rows.map((p) => ({
            id: p.id,
            name: p.name,
            maxVMs: p.max_vms,
            maxCPU: p.max_cpu,
            maxRAM: p.max_ram,
            maxDisk: p.max_disk,
            priceMonthly: parseFloat(p.price_monthly),
            features: p.features || [],
        }));
        res.json(plans);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// GET /api/plans/current — текущий план тенанта (клиент)
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) return res.status(400).json({ error: 'Тенант не найден' });

        const result = await pool.query(`
      SELECT t.plan_id, t.plan_expires_at, t.plan_changed_at,
             p.name AS plan_name, p.max_vms, p.max_cpu, p.max_ram, p.max_disk, p.price_monthly, p.features
      FROM tenants t
      JOIN plans p ON t.plan_id = p.id
      WHERE t.id = $1
    `, [tenantId]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Тенант не найден' });

        const r = result.rows[0];
        res.json({
            planId: r.plan_id,
            planName: r.plan_name,
            expiresAt: r.plan_expires_at,
            changedAt: r.plan_changed_at,
            quota: {
                maxVMs: r.max_vms,
                maxCPU: r.max_cpu,
                maxRAM: r.max_ram,
                maxDisk: r.max_disk,
            },
            priceMonthly: parseFloat(r.price_monthly),
            features: r.features || [],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/plans/change — сменить план (клиент)
router.post('/change', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId) return res.status(400).json({ error: 'Тенант не найден' });

        const { planId } = req.body;

        // Проверяем что план существует
        const planResult = await client.query('SELECT * FROM plans WHERE id = $1', [planId]);
        if (planResult.rows.length === 0) return res.status(404).json({ error: 'План не найден' });

        const newPlan = planResult.rows[0];

        // Получаем текущее использование
        const usageResult = await client.query(`
      SELECT
        COUNT(*) AS used_vms,
        COALESCE(SUM(cpu), 0) AS used_cpu,
        COALESCE(SUM(ram), 0) AS used_ram,
        COALESCE(SUM(disk), 0) AS used_disk
      FROM virtual_machines
      WHERE tenant_id = $1
    `, [tenantId]);

        const usage = usageResult.rows[0];

        // Проверяем что текущее использование не превышает лимиты нового плана
        if (parseInt(usage.used_vms) > newPlan.max_vms) {
            return res.status(400).json({
                error: `Невозможно понизить план: у вас ${usage.used_vms} ВМ, лимит плана ${newPlan.max_vms}`,
            });
        }
        if (parseInt(usage.used_cpu) > newPlan.max_cpu) {
            return res.status(400).json({
                error: `Невозможно понизить план: используется ${usage.used_cpu} vCPU, лимит плана ${newPlan.max_cpu}`,
            });
        }
        if (parseInt(usage.used_ram) > newPlan.max_ram) {
            return res.status(400).json({
                error: `Невозможно понизить план: используется ${usage.used_ram} ГБ RAM, лимит плана ${newPlan.max_ram}`,
            });
        }
        if (parseInt(usage.used_disk) > newPlan.max_disk) {
            return res.status(400).json({
                error: `Невозможно понизить план: используется ${usage.used_disk} ГБ диска, лимит плана ${newPlan.max_disk}`,
            });
        }

        await client.query('BEGIN');

        // Получаем старый план
        const oldTenant = await client.query('SELECT plan_id FROM tenants WHERE id = $1', [tenantId]);
        const oldPlanId = oldTenant.rows[0]?.plan_id;

        // Обновляем тенант
        await client.query(`
      UPDATE tenants
      SET plan_id = $1,
          max_vms = $2, max_cpu = $3, max_ram = $4, max_disk = $5,
          plan_changed_at = NOW(),
          plan_expires_at = NOW() + INTERVAL '30 days',
          updated_at = NOW()
      WHERE id = $6
    `, [planId, newPlan.max_vms, newPlan.max_cpu, newPlan.max_ram, newPlan.max_disk, tenantId]);

        // Записываем историю
        await client.query(`
      INSERT INTO plan_history (tenant_id, old_plan, new_plan, changed_by, reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [tenantId, oldPlanId, planId, req.user.id, 'Клиент сменил план']);

        // Аудит
        await client.query(`
      INSERT INTO audit_logs (user_id, tenant_id, action, target_type, target_id, details)
      VALUES ($1, $2, 'plan.change', 'tenant', $2, $3)
    `, [req.user.id, tenantId, JSON.stringify({ from: oldPlanId, to: planId })]);

        await client.query('COMMIT');

        res.json({
            message: `План изменён на ${newPlan.name}`,
            plan: {
                id: newPlan.id,
                name: newPlan.name,
                maxVMs: newPlan.max_vms,
                maxCPU: newPlan.max_cpu,
                maxRAM: newPlan.max_ram,
                maxDisk: newPlan.max_disk,
            },
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    } finally {
        client.release();
    }
});

// PATCH /api/plans/tenant/:id — админ меняет план тенанту
router.patch('/tenant/:id', authenticateToken, requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { planId } = req.body;

        const planResult = await client.query('SELECT * FROM plans WHERE id = $1', [planId]);
        if (planResult.rows.length === 0) return res.status(404).json({ error: 'План не найден' });

        const newPlan = planResult.rows[0];

        await client.query('BEGIN');

        const oldTenant = await client.query('SELECT plan_id FROM tenants WHERE id = $1', [id]);
        if (oldTenant.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Тенант не найден' });
        }

        await client.query(`
      UPDATE tenants
      SET plan_id = $1,
          max_vms = $2, max_cpu = $3, max_ram = $4, max_disk = $5,
          plan_changed_at = NOW(),
          plan_expires_at = NOW() + INTERVAL '30 days',
          updated_at = NOW()
      WHERE id = $6
    `, [planId, newPlan.max_vms, newPlan.max_cpu, newPlan.max_ram, newPlan.max_disk, id]);

        await client.query(`
      INSERT INTO plan_history (tenant_id, old_plan, new_plan, changed_by, reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, oldTenant.rows[0].plan_id, planId, req.user.id, 'Админ сменил план']);

        await client.query(`
      INSERT INTO audit_logs (user_id, tenant_id, action, target_type, target_id, details)
      VALUES ($1, $2, 'plan.admin_change', 'tenant', $2, $3)
    `, [req.user.id, id, JSON.stringify({ from: oldTenant.rows[0].plan_id, to: planId })]);

        await client.query('COMMIT');

        res.json({ message: `План тенанта изменён на ${newPlan.name}` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    } finally {
        client.release();
    }
});

// GET /api/plans/history/:tenantId — история изменений плана (админ)
router.get('/history/:tenantId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT ph.*, 
             p1.name AS old_plan_name, 
             p2.name AS new_plan_name,
             u.name AS changed_by_name
      FROM plan_history ph
      LEFT JOIN plans p1 ON ph.old_plan = p1.id
      LEFT JOIN plans p2 ON ph.new_plan = p2.id
      LEFT JOIN users u ON ph.changed_by = u.id
      WHERE ph.tenant_id = $1
      ORDER BY ph.created_at DESC
      LIMIT 20
    `, [req.params.tenantId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;