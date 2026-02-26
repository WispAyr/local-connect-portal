module.exports = {
  name: 'parking',
  displayName: 'Car Park Management',
  productLine: 'digital',
  icon: 'Car',
  description: 'Manage car parks, spaces, ANPR whitelists, and barriers',
  permissions: ['parking.view', 'parking.manage', 'parking.whitelist'],
  setup(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS parking_sites (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        address TEXT,
        total_spaces INTEGER DEFAULT 0,
        lat REAL, lng REAL,
        config TEXT DEFAULT '{}',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS parking_whitelists (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        site_id TEXT REFERENCES parking_sites(id),
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS parking_whitelist_entries (
        id TEXT PRIMARY KEY,
        whitelist_id TEXT NOT NULL REFERENCES parking_whitelists(id),
        plate TEXT NOT NULL,
        name TEXT,
        vehicle_make TEXT,
        vehicle_color TEXT,
        notes TEXT,
        valid_from TEXT,
        valid_until TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS parking_activity (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        type TEXT NOT NULL,
        plate TEXT,
        camera TEXT,
        confidence REAL,
        details TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // Seed demo data for Kyle Rise
    const existing = db.prepare('SELECT id FROM parking_sites WHERE id = ?').get('site-kyle-rise');
    if (!existing) {
      const { v4: uuid } = require('uuid');

      db.prepare(`INSERT INTO parking_sites (id, client_id, name, code, address, total_spaces, lat, lng) VALUES (?,?,?,?,?,?,?,?)`).run(
        'site-kyle-rise', 'kyle-rise', 'Kyle Rise Car Park', 'KRS01', '1 Kyle Rise, Ayr, KA7 2EU', 50, 55.4585, -4.6292
      );

      db.prepare(`INSERT INTO parking_whitelists (id, client_id, site_id, name, description) VALUES (?,?,?,?,?)`).run(
        'wl-kyle-residents', 'kyle-rise', 'site-kyle-rise', 'Resident Permits', 'Authorised resident vehicles'
      );

      const plates = [
        { plate: 'AB12 CDE', name: 'John Smith', make: 'Ford Focus', color: 'Blue' },
        { plate: 'FG34 HIJ', name: 'Jane Doe', make: 'VW Golf', color: 'Silver' },
        { plate: 'KL56 MNO', name: 'Bob Wilson', make: 'BMW 3 Series', color: 'Black' },
        { plate: 'PQ78 RST', name: 'Alice Brown', make: 'Audi A3', color: 'White' },
        { plate: 'UV90 WXY', name: 'Charlie Davis', make: 'Toyota Yaris', color: 'Red' },
      ];

      const ins = db.prepare(`INSERT INTO parking_whitelist_entries (id, whitelist_id, plate, name, vehicle_make, vehicle_color) VALUES (?,?,?,?,?,?)`);
      for (const p of plates) {
        ins.run(uuid(), 'wl-kyle-residents', p.plate, p.name, p.make, p.color);
      }

      // Some demo activity
      const types = ['entry', 'exit', 'entry', 'entry', 'exit'];
      const actIns = db.prepare(`INSERT INTO parking_activity (id, site_id, type, plate, camera, confidence) VALUES (?,?,?,?,?,?)`);
      for (let i = 0; i < 5; i++) {
        actIns.run(uuid(), 'site-kyle-rise', types[i], plates[i].plate, 'kyle-surface-anpr', 0.95 + Math.random() * 0.05);
      }

      console.log('Parking module: seeded Kyle Rise demo data');
    }
  },
  routes: require('./routes'),
};
