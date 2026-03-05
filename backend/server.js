const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Роуты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/vms', require('./routes/vms'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/networks', require('./routes/networks'));
app.use('/api/metrics', require('./routes/metrics'));    // <-- ДОБАВЬ

// Запуск коллектора метрик
const { startMetricsCollector } = require('./services/metricsCollector');  // <-- ДОБАВЬ

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startMetricsCollector();  // <-- ДОБАВЬ
});