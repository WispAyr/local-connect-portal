const { Router } = require('express');
const { v4: uuid } = require('uuid');
const router = Router();

// Helper: get client_id from auth token (set by auth middleware)
function clientId(req) {
  return req.user?.client_id || req.query.client_id;
}

// GET /sites
router.get('/sites', (req, res) => {
  const cid = clientId(req);
  const rows = cid
    ? req.db.prepare('SELECT * FROM parking_sites WHERE client_id = ? AND is_active = 1').all(cid)
    : req.db.prepare('SELECT * FROM parking_sites WHERE is_active = 1').all();
  res.json(rows);
});

// POST /sites
router.post('/sites', (req, res) => {
  const { client_id, name, code, address, total_spaces, lat, lng, config } = req.body;
  const id = uuid();
  req.db.prepare(
    'INSERT INTO parking_sites (id, client_id, name, code, address, total_spaces, lat, lng, config) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(id, client_id, name, code || null, address || null, total_spaces || 0, lat || null, lng || null, JSON.stringify(config || {}));
  res.json({ id });
});

// GET /sites/:id
router.get('/sites/:id', (req, res) => {
  const site = req.db.prepare('SELECT * FROM parking_sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const stats = req.db.prepare(`
    SELECT type, COUNT(*) as count FROM parking_activity 
    WHERE site_id = ? AND created_at >= date('now') GROUP BY type
  `).all(req.params.id);

  const whitelists = req.db.prepare('SELECT * FROM parking_whitelists WHERE site_id = ? AND is_active = 1').all(req.params.id);
  res.json({ ...site, stats, whitelists });
});

// GET /whitelists
router.get('/whitelists', (req, res) => {
  const cid = clientId(req);
  const rows = cid
    ? req.db.prepare('SELECT w.*, (SELECT COUNT(*) FROM parking_whitelist_entries WHERE whitelist_id = w.id AND is_active = 1) as entry_count FROM parking_whitelists w WHERE w.client_id = ? AND w.is_active = 1').all(cid)
    : req.db.prepare('SELECT w.*, (SELECT COUNT(*) FROM parking_whitelist_entries WHERE whitelist_id = w.id AND is_active = 1) as entry_count FROM parking_whitelists w WHERE w.is_active = 1').all();
  res.json(rows);
});

// POST /whitelists
router.post('/whitelists', (req, res) => {
  const { client_id, site_id, name, description } = req.body;
  const id = uuid();
  req.db.prepare('INSERT INTO parking_whitelists (id, client_id, site_id, name, description) VALUES (?,?,?,?,?)').run(id, client_id, site_id, name, description || null);
  res.json({ id });
});

// GET /whitelists/:id/entries
router.get('/whitelists/:id/entries', (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : null;
  const rows = search
    ? req.db.prepare('SELECT * FROM parking_whitelist_entries WHERE whitelist_id = ? AND is_active = 1 AND (plate LIKE ? OR name LIKE ?) ORDER BY created_at DESC').all(req.params.id, search, search)
    : req.db.prepare('SELECT * FROM parking_whitelist_entries WHERE whitelist_id = ? AND is_active = 1 ORDER BY created_at DESC').all(req.params.id);
  res.json(rows);
});

// POST /whitelists/:id/entries — single or bulk
router.post('/whitelists/:id/entries', (req, res) => {
  const entries = Array.isArray(req.body) ? req.body : [req.body];
  const ins = req.db.prepare('INSERT INTO parking_whitelist_entries (id, whitelist_id, plate, name, vehicle_make, vehicle_color, notes, valid_from, valid_until) VALUES (?,?,?,?,?,?,?,?,?)');
  const ids = [];
  const insertMany = req.db.transaction((items) => {
    for (const e of items) {
      const id = uuid();
      ins.run(id, req.params.id, e.plate, e.name || null, e.vehicle_make || null, e.vehicle_color || null, e.notes || null, e.valid_from || null, e.valid_until || null);
      ids.push(id);
    }
  });
  insertMany(entries);
  res.json({ ids });
});

// DELETE /whitelists/:id/entries/:entryId
router.delete('/whitelists/:id/entries/:entryId', (req, res) => {
  req.db.prepare('UPDATE parking_whitelist_entries SET is_active = 0 WHERE id = ? AND whitelist_id = ?').run(req.params.entryId, req.params.id);
  res.json({ ok: true });
});

// POST /whitelists/:id/import — CSV import
router.post('/whitelists/:id/import', (req, res) => {
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ error: 'csv field required' });

  const lines = csv.trim().split('\n');
  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  const entries = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim());
    const entry = {};
    header.forEach((h, idx) => { entry[h] = vals[idx] || ''; });
    if (entry.plate) entries.push(entry);
  }

  const ins = req.db.prepare('INSERT INTO parking_whitelist_entries (id, whitelist_id, plate, name, vehicle_make, vehicle_color, notes) VALUES (?,?,?,?,?,?,?)');
  const insertMany = req.db.transaction((items) => {
    for (const e of items) {
      ins.run(uuid(), req.params.id, e.plate, e.name || null, e.vehicle_make || e.make || null, e.vehicle_color || e.color || null, e.notes || null);
    }
  });
  insertMany(entries);
  res.json({ imported: entries.length });
});

// GET /whitelists/:id/export — CSV export
router.get('/whitelists/:id/export', (req, res) => {
  const rows = req.db.prepare('SELECT plate, name, vehicle_make, vehicle_color, notes, valid_from, valid_until FROM parking_whitelist_entries WHERE whitelist_id = ? AND is_active = 1').all(req.params.id);
  const header = 'plate,name,vehicle_make,vehicle_color,notes,valid_from,valid_until';
  const csv = [header, ...rows.map(r => `${r.plate},${r.name || ''},${r.vehicle_make || ''},${r.vehicle_color || ''},${r.notes || ''},${r.valid_from || ''},${r.valid_until || ''}`)].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=whitelist-${req.params.id}.csv`);
  res.send(csv);
});

// GET /activity
router.get('/activity', (req, res) => {
  const cid = clientId(req);
  const limit = parseInt(req.query.limit) || 50;
  const rows = cid
    ? req.db.prepare('SELECT a.* FROM parking_activity a JOIN parking_sites s ON a.site_id = s.id WHERE s.client_id = ? ORDER BY a.created_at DESC LIMIT ?').all(cid, limit)
    : req.db.prepare('SELECT * FROM parking_activity ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(rows);
});

// GET /stats
router.get('/stats', (req, res) => {
  const cid = clientId(req);
  const siteFilter = cid ? 'JOIN parking_sites s ON a.site_id = s.id WHERE s.client_id = ? AND' : 'WHERE';

  const entriesToday = cid
    ? req.db.prepare(`SELECT COUNT(*) as c FROM parking_activity a JOIN parking_sites s ON a.site_id = s.id WHERE s.client_id = ? AND a.type = 'entry' AND a.created_at >= date('now')`).get(cid).c
    : req.db.prepare(`SELECT COUNT(*) as c FROM parking_activity WHERE type = 'entry' AND created_at >= date('now')`).get().c;

  const activePlates = cid
    ? req.db.prepare('SELECT COUNT(*) as c FROM parking_whitelist_entries e JOIN parking_whitelists w ON e.whitelist_id = w.id WHERE w.client_id = ? AND e.is_active = 1').get(cid).c
    : req.db.prepare('SELECT COUNT(*) as c FROM parking_whitelist_entries WHERE is_active = 1').get().c;

  const violations = cid
    ? req.db.prepare(`SELECT COUNT(*) as c FROM parking_activity a JOIN parking_sites s ON a.site_id = s.id WHERE s.client_id = ? AND a.type = 'violation' AND a.created_at >= date('now')`).get(cid).c
    : req.db.prepare(`SELECT COUNT(*) as c FROM parking_activity WHERE type = 'violation' AND created_at >= date('now')`).get().c;

  const totalSites = cid
    ? req.db.prepare('SELECT COUNT(*) as c FROM parking_sites WHERE client_id = ? AND is_active = 1').get(cid).c
    : req.db.prepare('SELECT COUNT(*) as c FROM parking_sites WHERE is_active = 1').get().c;

  res.json({ entriesToday, activePlates, violations, totalSites });
});

module.exports = router;
