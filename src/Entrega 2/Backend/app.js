const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const companyDashboardRoutes = require('./routes/companyDashboard.routes');
const companyRoutes = require('./routes/company.routes');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const inviteRoutes = require('./routes/invite.routes');
const staffInviteRoutes = require('./routes/staffInvite.routes');
const companyInviteRoutes = require('./routes/companyInvite.routes');
const adminDashboardRoutes = require('./routes/adminDashboard.routes');
const adminConfigRoutes = require('./routes/adminConfig.routes');
const importacaoDadosRoutes = require('./routes/importacaoDados.routes');
const mockTempoRealRoutes = require('./routes/mockTempoReal.routes');

require('dotenv').config();

const app = express();

app.use(helmet());

const allowedOrigins = [
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('[CORS] Origem bloqueada:', origin);

    return callback(new Error('Origem não permitida pelo CORS.'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    const log = `[PERF] ${req.method} ${req.originalUrl} -> ${res.statusCode} em ${durationMs.toFixed(2)}ms`;

    if (durationMs > 3000) {
      console.warn(`${log} [LENTO]`);
    } else {
      console.log(log);
    }
  });

  next();
});

app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    message: 'Backend Cannoli CRM rodando',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/company-dashboard', companyDashboardRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/staff-invites', staffInviteRoutes);
app.use('/api/company-invites', companyInviteRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);
app.use('/api/admin-config', adminConfigRoutes);
app.use('/api/importacao-dados', importacaoDadosRoutes);
app.use('/api/mock-tempo-real', mockTempoRealRoutes);

app.use((req, res) => {
  console.warn('[404] Rota não encontrada:', {
    method: req.method,
    url: req.originalUrl
  });

  return res.status(404).json({
    message: 'Rota não encontrada.'
  });
});

app.use((error, req, res, next) => {
  console.error('[ERRO_GLOBAL]', {
    method: req.method,
    url: req.originalUrl,
    message: error.message,
    stack: error.stack
  });

  return res.status(500).json({
    message: 'Erro interno no servidor.'
  });
});

module.exports = app;