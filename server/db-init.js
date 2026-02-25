const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

function initDB(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'client',
      client_id TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      email TEXT,
      phone TEXT,
      logo_url TEXT,
      branding TEXT DEFAULT '{}',
      product_lines TEXT DEFAULT '["digital"]',
      modules TEXT DEFAULT '[]',
      plan TEXT DEFAULT 'starter',
      is_active INTEGER DEFAULT 1,
      stripe_customer_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      title TEXT NOT NULL,
      description TEXT,
      brief TEXT,
      status TEXT DEFAULT 'draft',
      priority TEXT DEFAULT 'normal',
      category TEXT,
      due_date TEXT,
      budget REAL,
      invoice_id TEXT,
      created_by TEXT,
      assigned_to TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_activity (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      user_id TEXT,
      type TEXT NOT NULL,
      content TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      type TEXT DEFAULT 'deliverable',
      version INTEGER DEFAULT 1,
      thumbnail_url TEXT,
      is_final INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      share_token TEXT,
      requires_payment INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      project_id TEXT,
      stripe_invoice_id TEXT,
      stripe_payment_intent TEXT,
      stripe_payment_link TEXT,
      title TEXT NOT NULL,
      description TEXT,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'gbp',
      status TEXT DEFAULT 'draft',
      due_date TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id),
      description TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price INTEGER NOT NULL,
      total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      product_line TEXT,
      version TEXT,
      is_active INTEGER DEFAULT 1,
      config TEXT DEFAULT '{}'
    );
  `);

  // Seed if empty
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin2026', 10);
    db.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)').run('admin-1', 'ewan@parkwise.tech', hash, 'Ewan', 'admin');

    db.prepare('INSERT INTO clients (id, name, slug, product_lines, modules) VALUES (?, ?, ?, ?, ?)').run('1994', '1994', '1994', '["digital"]', '["projects","assets"]');
    db.prepare('INSERT INTO clients (id, name, slug, product_lines, modules) VALUES (?, ?, ?, ?, ?)').run('enterkine', 'Enterkine House', 'enterkine', '["digital"]', '["projects","assets","content-review"]');
    db.prepare('INSERT INTO clients (id, name, slug, product_lines, modules) VALUES (?, ?, ?, ?, ?)').run('kyle-rise', 'Kyle Rise Car Park', 'kyle-rise', '["digital"]', '["parking","screens","analytics"]');

    // Demo project for 1994
    const projId = uuid();
    db.prepare('INSERT INTO projects (id, client_id, title, category, status, brief, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      projId, '1994', 'DJ Branding Video Package', 'video', 'in-progress',
      'Custom DJ branding videos for live events — intro, outro, and background loops', 'admin-1'
    );

    // Invoice for the project
    const invId = uuid();
    db.prepare('INSERT INTO invoices (id, client_id, project_id, title, amount, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      invId, '1994', projId, 'DJ Branding Video Package', 35000, 'sent'
    );
    db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuid(), invId, 'DJ Branding Video Package — intro, outro, background loops', 1, 35000, 35000
    );

    // Link invoice to project
    db.prepare('UPDATE projects SET invoice_id = ? WHERE id = ?').run(invId, projId);

    // Activity
    db.prepare('INSERT INTO project_activity (id, project_id, user_id, type, content) VALUES (?, ?, ?, ?, ?)').run(
      uuid(), projId, 'admin-1', 'status_change', 'Project created and moved to in-progress'
    );

    console.log('Database seeded with demo data');
  }
}

module.exports = { initDB };
