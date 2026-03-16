const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./modules/auth/auth.routes');
const syncRoutes = require('./modules/sync/sync.routes');
const firmRoutes = require('./modules/firms/firms.routes');
const partyRoutes = require('./modules/parties/parties.routes');
const itemRoutes = require('./modules/items/items.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const invoiceRoutes = require('./modules/invoices/invoices.routes');
const userRoutes = require('./modules/users/users.routes');
const quotationRoutes = require('./modules/quotations/quotations.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const taxRoutes = require('./modules/tax/tax.routes');
const reportRoutes = require('./modules/reports/reports.routes');
const settingRoutes = require('./modules/settings/settings.routes');
const systemRoutes = require('./modules/system/system.routes');
const auditRoutes = require('./modules/audit/audit.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Dual Portal Routing Logic
app.use((req, res, next) => {
  const host = req.get('host');
  
  if (host === 'billing-app.ajmallab.site') {
    // Serve Flutter Web/Mobile Portal
    express.static(path.join(__dirname, '../public_mobile'))(req, res, next);
  } else if (host === 'billing.ajmallab.site') {
    // Serve Mobile/User Portal (Custom Landing)
    express.static(path.join(__dirname, '../public_user'))(req, res, next);
  } else {
    // Default to Admin Dashboard
    express.static(path.join(__dirname, '../public'))(req, res, next);
  }
});

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise ERP Billing API',
      version: '1.0.0',
      description: 'Advanced API Documentation for Multi-branch Billing & Inventory System',
    },
    servers: [
      {
        url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
        description: 'Server URL',
      },
    ],
  },
  apis: ['./src/modules/**/*.js'], // files containing annotations as above
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API v1 Global Router
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/sync', syncRoutes);
apiRouter.use('/firms', firmRoutes);
apiRouter.use('/parties', partyRoutes);
apiRouter.use('/items', itemRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/quotations', quotationRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/tax', taxRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/settings', settingRoutes);
apiRouter.use('/system', systemRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

app.use('/api/v1', apiRouter);

// Legacy support routes (deprecated)
app.use('/auth', authRoutes);
app.use('/sync', syncRoutes);
app.use('/firms', firmRoutes);
app.use('/parties', partyRoutes);
app.use('/items', itemRoutes);
app.use('/invoices', invoiceRoutes);

app.get('/api', (req, res) => {
  res.send('Billing App Sync Server (Cloud Ready) Running [Modular Monolith]');
});

// Serve SPA for any unmatched non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/sync') || req.path.startsWith('/api-docs')) {
    return next();
  }
  
  const host = req.get('host');
  let publicDir = '../public';
  if (host === 'billing-app.ajmallab.site') publicDir = '../public_mobile';
  else if (host === 'billing.ajmallab.site') publicDir = '../public_user';
  
  res.sendFile(path.join(__dirname, publicDir, 'index.html'));
});

module.exports = app;
