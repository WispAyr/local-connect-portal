module.exports = {
  name: 'screens',
  displayName: 'Digital Screens',
  productLine: 'digital',
  icon: 'Monitor',
  description: 'Manage your digital signage screens',
  permissions: ['screens.view', 'screens.manage'],
  setup(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS screens_config (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        screens_portal_url TEXT DEFAULT 'https://screens.local-connect.uk',
        screens_client_id TEXT,
        portal_password TEXT,
        screen_count INTEGER DEFAULT 0,
        last_synced TEXT,
        config TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Seed Kyle Rise screens config
    const existing = db.prepare('SELECT id FROM screens_config WHERE id = ?').get('sc-kyle-rise');
    if (!existing) {
      db.prepare(`INSERT INTO screens_config (id, client_id, screens_portal_url, screens_client_id, screen_count) VALUES (?,?,?,?,?)`).run(
        'sc-kyle-rise', 'kyle-rise', 'https://screens.local-connect.uk', 'kyle-rise', 3
      );
      console.log('Screens module: seeded Kyle Rise config');
    }
  },
  routes: require('./routes'),
};
