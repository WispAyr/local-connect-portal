module.exports = {
  name: 'cru',
  displayName: 'CRU Fleet',
  productLine: 'events',
  icon: 'Truck',
  description: 'Communications Response Unit — vehicle specs, capabilities, deployment tracking',
  permissions: ['cru.view', 'cru.manage'],
  setup(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cru_vehicles (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        name TEXT NOT NULL,
        registration TEXT,
        type TEXT,
        status TEXT DEFAULT 'available',
        specs TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS cru_capabilities (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL REFERENCES cru_vehicles(id),
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS cru_deployments (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL REFERENCES cru_vehicles(id),
        event_name TEXT NOT NULL,
        location TEXT,
        deploy_date TEXT,
        return_date TEXT,
        status TEXT DEFAULT 'planned',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  },
  routes: require('./routes'),
};
