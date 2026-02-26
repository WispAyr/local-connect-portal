const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const { initDB } = require('./db-init');
const authRoutes = require('./auth');
const clientRoutes = require('./clients');
const projectRoutes = require('./projects');
const assetRoutes = require('./assets');
const paymentRoutes = require('./payments');
const { loadModules } = require('./module-loader');

const app = express();
const PORT = process.env.PORT || 3900;

// DB
const dbPath = path.join(__dirname, 'portal.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
initDB(db);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Make db available
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/payments', paymentRoutes);

// Module loader
const modules = loadModules(db, app);
app.get('/api/modules', (req, res) => {
  res.json(modules.map(m => ({ id: m.id, name: m.name, productLine: m.productLine })));
});

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve client build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => console.log(`Portal server on :${PORT}`));
