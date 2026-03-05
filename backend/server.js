const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Роуты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/vms', require('./routes/vms'));
app.use('/api/networks', require('./routes/networks'));
app.use('/api/stats', require('./routes/stats'));

// Проверка
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Backend запущен на http://localhost:${PORT}`);
});