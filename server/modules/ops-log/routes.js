const { Router } = require('express');
const { v4: uuid } = require('uuid');
const router = Router();

function cid(req) { return req.user?.client_id || req.query.client_id; }

router.get('/entries', (req, res) => {
  const c = cid(req);
  const eventId = req.query.event_id;
  let sql = "SELECT * FROM ops_log_entries";
  const conditions = [];
  const args = [];
  if (c) { conditions.push("client_id = ?"); args.push(c); }
  if (eventId) { conditions.push("event_id = ?"); args.push(eventId); }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY created_at DESC";
  if (req.query.limit) { sql += " LIMIT ?"; args.push(parseInt(req.query.limit)); }
  res.json(req.db.prepare(sql).all(...args));
});

router.post('/entries', (req, res) => {
  const { client_id, event_id, type, message, author, metadata } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO ops_log_entries (id, client_id, event_id, type, message, author, metadata) VALUES (?,?,?,?,?,?,?)").run(id, client_id, event_id, type || 'info', message, author, JSON.stringify(metadata || {}));
  res.json({ id });
});

router.put('/entries/:id', (req, res) => {
  const { type, message, author, metadata } = req.body;
  req.db.prepare("UPDATE ops_log_entries SET type=?, message=?, author=?, metadata=? WHERE id=?").run(type, message, author, JSON.stringify(metadata || {}), req.params.id);
  res.json({ ok: true });
});

router.delete('/entries/:id', (req, res) => {
  req.db.prepare("DELETE FROM ops_log_entries WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

router.get('/stats', (req, res) => {
  const c = cid(req);
  const where = c ? "WHERE client_id = ?" : "";
  const args = c ? [c] : [];
  const rows = req.db.prepare(`SELECT type, COUNT(*) as count FROM ops_log_entries ${where} GROUP BY type`).all(...args);
  const total = rows.reduce((s, r) => s + r.count, 0);
  res.json({ total, byType: Object.fromEntries(rows.map(r => [r.type, r.count])) });
});

module.exports = router;
