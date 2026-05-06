const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const inviteRoutes = require('./routes/invite.routes');
const staffInviteRoutes = require('./routes/staffInvite.routes');
const adminDashboardRoutes = require('./routes/adminDashboard.routes');
const adminConfigRoutes = require('./routes/adminConfig.routes');
const importacaoDadosRoutes = require('./routes/importacaoDados.routes');
const mockTempoRealRoutes = require('./routes/mockTempoReal.routes');

require('dotenv').config();

const app = express();

app.use(helmet());

// Liberado para desenvolvimento local
app.use(cors());

app.use(express.json());

app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    message: 'Backend Cannoli CRM rodando'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/staff-invites', staffInviteRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);
app.use('/api/admin-config', adminConfigRoutes);
app.use('/api/importacao-dados', importacaoDadosRoutes);
app.use('/api/mock-tempo-real', mockTempoRealRoutes);

app.use((req, res) => {
  return res.status(404).json({
    message: 'Rota não encontrada.'
  });
});

module.exports = app;