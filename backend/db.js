const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Проверка подключения
pool.query('SELECT NOW()')
    .then(() => console.log('PostgreSQL подключён'))
    .catch((err) => console.error('Ошибка подключения к БД:', err.message));

module.exports = pool;