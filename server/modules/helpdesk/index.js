module.exports = {
  name: 'helpdesk',
  displayName: 'Helpdesk',
  productLine: 'shared',
  icon: 'HelpCircle',
  description: 'Client support tickets and knowledge base',
  permissions: ['helpdesk.view', 'helpdesk.manage'],
  setup(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'normal',
        category TEXT,
        assigned_to TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL REFERENCES tickets(id),
        author TEXT NOT NULL,
        author_role TEXT DEFAULT 'client',
        message TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS kb_articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT,
        tags TEXT DEFAULT '[]',
        is_published INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  },
  routes: require('./routes'),
};
