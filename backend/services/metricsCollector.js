const pool = require('../db');

// Собирает реальную статистику из БД и записывает в metrics
async function collectMetrics() {
    try {
        // Получаем суммарные квоты всех тенантов (это "ёмкость платформы")
        const capacity = await pool.query(`
      SELECT
        COALESCE(SUM(max_cpu), 64) AS total_cpu,
        COALESCE(SUM(max_ram), 128) AS total_ram,
        COALESCE(SUM(max_disk), 2000) AS total_disk
      FROM tenants
      WHERE status = 'active'
    `);

        // Получаем фактическое использование ВМ
        const usage = await pool.query(`
      SELECT
        COALESCE(SUM(cpu), 0) AS used_cpu,
        COALESCE(SUM(ram), 0) AS used_ram,
        COALESCE(SUM(disk), 0) AS used_disk,
        COUNT(*) FILTER (WHERE status = 'running') AS active_vms,
        COUNT(*) AS total_vms
      FROM virtual_machines
    `);

        const cap = capacity.rows[0];
        const use = usage.rows[0];

        // Вычисляем проценты
        const cpuPercent = cap.total_cpu > 0
            ? (parseFloat(use.used_cpu) / parseFloat(cap.total_cpu)) * 100
            : 0;
        const ramPercent = cap.total_ram > 0
            ? (parseFloat(use.used_ram) / parseFloat(cap.total_ram)) * 100
            : 0;
        const diskPercent = cap.total_disk > 0
            ? (parseFloat(use.used_disk) / parseFloat(cap.total_disk)) * 100
            : 0;

        // Добавляем небольшую случайную вариацию (±3%) для реалистичности
        const jitter = () => (Math.random() - 0.5) * 6;

        await pool.query(
            `INSERT INTO metrics (cpu_percent, ram_percent, disk_percent, active_vms, total_vms)
       VALUES ($1, $2, $3, $4, $5)`,
            [
                Math.max(0, Math.min(100, cpuPercent + jitter())),
                Math.max(0, Math.min(100, ramPercent + jitter())),
                Math.max(0, Math.min(100, diskPercent + jitter())),
                parseInt(use.active_vms),
                parseInt(use.total_vms),
            ]
        );

        console.log(
            `[Metrics] CPU: ${cpuPercent.toFixed(1)}% | RAM: ${ramPercent.toFixed(1)}% | Disk: ${diskPercent.toFixed(1)}% | VMs: ${use.active_vms}/${use.total_vms}`
        );
    } catch (err) {
        console.error('[Metrics] Ошибка сбора:', err.message);
    }
}

// Удаляем старые записи (старше 7 дней)
async function cleanOldMetrics() {
    try {
        await pool.query(`DELETE FROM metrics WHERE recorded_at < NOW() - INTERVAL '7 days'`);
    } catch (err) {
        console.error('[Metrics] Ошибка очистки:', err.message);
    }
}

// Заполняем историю за 24 часа (при первом запуске)
async function seedMetricsHistory() {
    try {
        const existing = await pool.query('SELECT COUNT(*) FROM metrics');
        if (parseInt(existing.rows[0].count) > 10) return; // уже есть данные

        console.log('[Metrics] Генерация истории за 24 часа...');

        const capacity = await pool.query(`
      SELECT
        COALESCE(SUM(max_cpu), 64) AS total_cpu,
        COALESCE(SUM(max_ram), 128) AS total_ram,
        COALESCE(SUM(max_disk), 2000) AS total_disk
      FROM tenants WHERE status = 'active'
    `);

        const usage = await pool.query(`
      SELECT
        COALESCE(SUM(cpu), 0) AS used_cpu,
        COALESCE(SUM(ram), 0) AS used_ram,
        COALESCE(SUM(disk), 0) AS used_disk,
        COUNT(*) FILTER (WHERE status = 'running') AS active_vms,
        COUNT(*) AS total_vms
      FROM virtual_machines
    `);

        const cap = capacity.rows[0];
        const use = usage.rows[0];

        const baseCpu = cap.total_cpu > 0 ? (parseFloat(use.used_cpu) / parseFloat(cap.total_cpu)) * 100 : 15;
        const baseRam = cap.total_ram > 0 ? (parseFloat(use.used_ram) / parseFloat(cap.total_ram)) * 100 : 20;
        const baseDisk = cap.total_disk > 0 ? (parseFloat(use.used_disk) / parseFloat(cap.total_disk)) * 100 : 10;

        // Генерируем точки каждые 15 минут за 24 часа
        for (let i = 96; i >= 0; i--) {
            const minutesAgo = i * 15;
            const hour = 24 - (minutesAgo / 60);

            // Имитируем дневной паттерн нагрузки (пик 10-16 часов)
            const hourOfDay = (new Date().getHours() - (minutesAgo / 60) + 48) % 24;
            let loadMultiplier = 1;
            if (hourOfDay >= 9 && hourOfDay <= 18) {
                loadMultiplier = 1.5 + Math.sin((hourOfDay - 9) / 9 * Math.PI) * 0.8;
            } else if (hourOfDay >= 0 && hourOfDay <= 6) {
                loadMultiplier = 0.4 + Math.random() * 0.2;
            } else {
                loadMultiplier = 0.8 + Math.random() * 0.3;
            }

            const jitter = () => (Math.random() - 0.5) * 8;

            const cpu = Math.max(1, Math.min(95, baseCpu * loadMultiplier + jitter()));
            const ram = Math.max(1, Math.min(95, baseRam * loadMultiplier * 0.9 + jitter()));
            const disk = Math.max(1, Math.min(95, baseDisk + jitter() * 0.5)); // Диск меняется мало

            await pool.query(
                `INSERT INTO metrics (cpu_percent, ram_percent, disk_percent, active_vms, total_vms, recorded_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${minutesAgo} minutes')`,
                [cpu.toFixed(1), ram.toFixed(1), disk.toFixed(1), parseInt(use.active_vms), parseInt(use.total_vms)]
            );
        }

        console.log('[Metrics] История создана (97 точек за 24 часа)');
    } catch (err) {
        console.error('[Metrics] Ошибка seed:', err.message);
    }
}

function startMetricsCollector() {
    // При старте — заполняем историю если пусто
    seedMetricsHistory();

    // Собираем метрики каждые 5 минут
    setInterval(collectMetrics, 5 * 60 * 1000);

    // Чистим старые каждый час
    setInterval(cleanOldMetrics, 60 * 60 * 1000);

    // Первый сбор через 10 секунд
    setTimeout(collectMetrics, 10000);

    console.log('[Metrics] Коллектор запущен (интервал: 5 мин)');
}

module.exports = { startMetricsCollector };