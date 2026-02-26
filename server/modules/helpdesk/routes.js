const { Router } = require('express');
const { v4: uuid } = require('uuid');
const router = Router();

function cid(req) { return req.user?.client_id || req.query.client_id; }

// --- Tickets ---
router.get('/tickets', (req, res) => {
  const c = cid(req);
  const status = req.query.status;
  let sql = "SELECT * FROM tickets";
  const conditions = [];
  const args = [];
  if (c) { conditions.push("client_id = ?"); args.push(c); }
  if (status) { conditions.push("status = ?"); args.push(status); }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, updated_at DESC";
  res.json(req.db.prepare(sql).all(...args));
});

router.post('/tickets', (req, res) => {
  const { client_id, subject, description, priority, category, created_by } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO tickets (id, client_id, subject, description, priority, category, created_by) VALUES (?,?,?,?,?,?,?)").run(id, client_id, subject, description, priority || 'normal', category, created_by);
  res.json({ id });
});

router.get('/tickets/:id', (req, res) => {
  const ticket = req.db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  const messages = req.db.prepare("SELECT * FROM ticket_messages WHERE ticket_id=? ORDER BY created_at ASC").all(req.params.id);
  res.json({ ...ticket, messages });
});

router.put('/tickets/:id', (req, res) => {
  const { subject, description, priority, category, assigned_to } = req.body;
  req.db.prepare("UPDATE tickets SET subject=?, description=?, priority=?, category=?, assigned_to=?, updated_at=datetime('now') WHERE id=?").run(subject, description, priority, category, assigned_to, req.params.id);
  res.json({ ok: true });
});

router.put('/tickets/:id/status', (req, res) => {
  const { status } = req.body;
  req.db.prepare("UPDATE tickets SET status=?, updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
  res.json({ ok: true });
});

router.post('/tickets/:id/messages', (req, res) => {
  const { author, author_role, message } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO ticket_messages (id, ticket_id, author, author_role, message) VALUES (?,?,?,?,?)").run(id, req.params.id, author, author_role || 'client', message);
  req.db.prepare("UPDATE tickets SET updated_at=datetime('now') WHERE id=?").run(req.params.id);
  res.json({ id });
});

router.delete('/tickets/:id', (req, res) => {
  req.db.prepare("DELETE FROM ticket_messages WHERE ticket_id=?").run(req.params.id);
  req.db.prepare("DELETE FROM tickets WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// --- KB Articles ---
router.get('/kb', (req, res) => {
  const q = req.query.q;
  if (q) {
    res.json(req.db.prepare("SELECT * FROM kb_articles WHERE is_published=1 AND (title LIKE ? OR content LIKE ? OR tags LIKE ?) ORDER BY view_count DESC").all(`%${q}%`, `%${q}%`, `%${q}%`));
  } else {
    res.json(req.db.prepare("SELECT * FROM kb_articles WHERE is_published=1 ORDER BY view_count DESC").all());
  }
});

router.post('/kb', (req, res) => {
  const { title, content, category, tags, is_published } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO kb_articles (id, title, content, category, tags, is_published) VALUES (?,?,?,?,?,?)").run(id, title, content, category, JSON.stringify(tags || []), is_published ? 1 : 0);
  res.json({ id });
});

router.put('/kb/:id', (req, res) => {
  const { title, content, category, tags, is_published } = req.body;
  req.db.prepare("UPDATE kb_articles SET title=?, content=?, category=?, tags=?, is_published=? WHERE id=?").run(title, content, category, JSON.stringify(tags || []), is_published ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/kb/:id', (req, res) => {
  req.db.prepare("DELETE FROM kb_articles WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// --- Stats ---
router.get('/stats', (req, res) => {
  const c = cid(req);
  const where = c ? "WHERE client_id = ?" : "";
  const args = c ? [c] : [];
  const open = req.db.prepare(`SELECT COUNT(*) as n FROM tickets ${where ? where + " AND" : "WHERE"} status='open'`).get(...args).n;
  const inProgress = req.db.prepare(`SELECT COUNT(*) as n FROM tickets ${where ? where + " AND" : "WHERE"} status='in-progress'`).get(...args).n;
  const total = req.db.prepare(`SELECT COUNT(*) as n FROM tickets ${where}`).get(...args).n;
  const articles = req.db.prepare("SELECT COUNT(*) as n FROM kb_articles WHERE is_published=1").get().n;
  res.json({ open, inProgress, total, articles });
});

module.exports = router;
