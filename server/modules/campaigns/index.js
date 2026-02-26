module.exports = {
  name: 'campaigns',
  displayName: 'Campaigns',
  productLine: 'digital',
  icon: 'Megaphone',
  description: 'Brand management and asset approval workflows',
  permissions: ['campaigns.view', 'campaigns.manage'],
  setup(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'draft',
        brand_guidelines TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS campaign_items (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id),
        title TEXT NOT NULL,
        type TEXT,
        status TEXT DEFAULT 'draft',
        content TEXT DEFAULT '{}',
        due_date TEXT,
        reviewer_notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS campaign_assets (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id),
        item_id TEXT REFERENCES campaign_items(id),
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        type TEXT DEFAULT 'asset',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  },
  routes: require('./routes'),
};
