const { Router } = require('express');
const { v4: uuid } = require('uuid');
const router = Router();

function cid(req) { return req.user?.client_id || req.query.client_id; }

// --- Campaigns CRUD ---
router.get('/', (req, res) => {
  const c = cid(req);
  const rows = c
    ? req.db.prepare("SELECT c.*, (SELECT COUNT(*) FROM campaign_items WHERE campaign_id=c.id AND status='review') as pending_reviews FROM campaigns c WHERE c.client_id=? ORDER BY c.created_at DESC").all(c)
    : req.db.prepare("SELECT c.*, (SELECT COUNT(*) FROM campaign_items WHERE campaign_id=c.id AND status='review') as pending_reviews FROM campaigns c ORDER BY c.created_at DESC").all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { client_id, name, description, brand_guidelines } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO campaigns (id, client_id, name, description, brand_guidelines) VALUES (?,?,?,?,?)").run(id, client_id, name, description, JSON.stringify(brand_guidelines || {}));
  res.json({ id });
});

router.put('/:id', (req, res) => {
  const { name, description, status, brand_guidelines } = req.body;
  req.db.prepare("UPDATE campaigns SET name=?, description=?, status=?, brand_guidelines=? WHERE id=?").run(name, description, status, JSON.stringify(brand_guidelines || {}), req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  req.db.prepare("DELETE FROM campaign_assets WHERE campaign_id=?").run(req.params.id);
  req.db.prepare("DELETE FROM campaign_items WHERE campaign_id=?").run(req.params.id);
  req.db.prepare("DELETE FROM campaigns WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// Full campaign detail
router.get('/:id/full', (req, res) => {
  const campaign = req.db.prepare("SELECT * FROM campaigns WHERE id=?").get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  const items = req.db.prepare("SELECT * FROM campaign_items WHERE campaign_id=? ORDER BY created_at DESC").all(req.params.id);
  const assets = req.db.prepare("SELECT * FROM campaign_assets WHERE campaign_id=? ORDER BY created_at DESC").all(req.params.id);
  res.json({ ...campaign, items, assets });
});

// --- Items ---
router.get('/:id/items', (req, res) => {
  res.json(req.db.prepare("SELECT * FROM campaign_items WHERE campaign_id=? ORDER BY created_at DESC").all(req.params.id));
});

router.post('/:id/items', (req, res) => {
  const { title, type, content, due_date } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO campaign_items (id, campaign_id, title, type, content, due_date) VALUES (?,?,?,?,?,?)").run(id, req.params.id, title, type, JSON.stringify(content || {}), due_date);
  res.json({ id });
});

router.put('/:id/items/:itemId', (req, res) => {
  const { title, type, status, content, due_date } = req.body;
  req.db.prepare("UPDATE campaign_items SET title=?, type=?, status=?, content=?, due_date=? WHERE id=?").run(title, type, status, JSON.stringify(content || {}), due_date, req.params.itemId);
  res.json({ ok: true });
});

router.post('/:id/items/:itemId/approve', (req, res) => {
  const { notes } = req.body;
  req.db.prepare("UPDATE campaign_items SET status='approved', reviewer_notes=? WHERE id=?").run(notes || '', req.params.itemId);
  res.json({ ok: true });
});

router.post('/:id/items/:itemId/reject', (req, res) => {
  const { notes } = req.body;
  req.db.prepare("UPDATE campaign_items SET status='rejected', reviewer_notes=? WHERE id=?").run(notes || '', req.params.itemId);
  res.json({ ok: true });
});

// --- Stats ---
router.get('/stats', (req, res) => {
  // Note: /stats must be before /:id to avoid conflict - but Express matches in order, so this is fine as long as 'stats' != uuid
  const c = cid(req);
  const where = c ? "WHERE client_id = ?" : "";
  const args = c ? [c] : [];
  const active = req.db.prepare(`SELECT COUNT(*) as n FROM campaigns ${where ? where + " AND" : "WHERE"} status='active'`).get(...args).n;
  const total = req.db.prepare(`SELECT COUNT(*) as n FROM campaigns ${where}`).get(...args).n;
  const pendingReviews = req.db.prepare(`SELECT COUNT(*) as n FROM campaign_items WHERE status='review'`).get().n;
  res.json({ total, active, pendingReviews });
});

module.exports = router;
