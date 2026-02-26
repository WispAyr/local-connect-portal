module.exports = {
  name: 'radio',
  displayName: 'Radio Manager',
  productLine: 'events',
  icon: 'Radio',
  description: 'Radio fleet management for event communications',
  permissions: ['radio.view', 'radio.manage'],
  setup(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS radios (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        callsign TEXT,
        make TEXT,
        model TEXT,
        serial_number TEXT,
        frequency_band TEXT,
        status TEXT DEFAULT 'available',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS radio_events (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        name TEXT NOT NULL,
        date TEXT,
        location TEXT,
        status TEXT DEFAULT 'planning',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS radio_assignments (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES radio_events(id),
        radio_id TEXT NOT NULL REFERENCES radios(id),
        assigned_to TEXT,
        checked_out_at TEXT,
        checked_in_at TEXT,
        condition_out TEXT DEFAULT 'good',
        condition_in TEXT,
        notes TEXT
      );
    `);
  },
  routes: require('./routes'),
};
