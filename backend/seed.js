const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
    console.log('Обновляем пароли пользователей...');

    const users = [
        { email: 'admin@mtscloud.ru', password: 'admin123' },
        { email: 'client@company.ru', password: 'client123' },
        { email: 'demo@startup.ru', password: 'demo123' },
        { email: 'blocked@test.ru', password: 'blocked123' },
    ];

    for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10);
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [hash, u.email]
        );
        console.log(`${u.email} — пароль обновлён`);
    }

    console.log('Готово!');
    process.exit(0);
}

seed().catch(console.error);