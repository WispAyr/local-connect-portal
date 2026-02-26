module.exports = {
  name: 'ops-log',
  displayName: 'Ops Log',
  productLine: 'shared',
  icon: 'ScrollText',
  description: 'Event operations logging — timeline entries during live events',
  permissions: ['ops-log.view', 'ops-log.manage'],
  setup(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ops_log_entries (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        event_id TEXT,
        type TEXT DEFAULT 'info',
        message TEXT NOT NULL,
        author TEXT,
        metadata TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  },
  routes: require('./routes'),
};
