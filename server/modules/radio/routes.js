const { Router } = require('express');
const { v4: uuid } = require('uuid');
const router = Router();

function cid(req) { return req.user?.client_id || req.query.client_id; }

// --- Radios CRUD ---
router.get('/radios', (req, res) => {
  const c = cid(req);
  const rows = c
    ? req.db.prepare("SELECT * FROM radios WHERE client_id = ? ORDER BY created_at DESC").all(c)
    : req.db.prepare("SELECT * FROM radios ORDER BY created_at DESC").all();
  res.json(rows);
});

router.post('/radios', (req, res) => {
  const { client_id, callsign, make, model, serial_number, frequency_band, notes } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO radios (id, client_id, callsign, make, model, serial_number, frequency_band, notes) VALUES (?,?,?,?,?,?,?,?)").run(id, client_id, callsign, make, model, serial_number, frequency_band, notes);
  res.json({ id });
});

router.put('/radios/:id', (req, res) => {
  const { callsign, make, model, serial_number, frequency_band, status, notes } = req.body;
  req.db.prepare("UPDATE radios SET callsign=?, make=?, model=?, serial_number=?, frequency_band=?, status=?, notes=? WHERE id=?").run(callsign, make, model, serial_number, frequency_band, status, notes, req.params.id);
  res.json({ ok: true });
});

router.delete('/radios/:id', (req, res) => {
  req.db.prepare("DELETE FROM radios WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// Checkout / Checkin
router.post('/radios/:id/checkout', (req, res) => {
  const { event_id, assigned_to, condition_out, notes } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO radio_assignments (id, event_id, radio_id, assigned_to, checked_out_at, condition_out, notes) VALUES (?,?,?,?,datetime('now'),?,?)").run(id, event_id, req.params.id, assigned_to, condition_out || 'good', notes);
  req.db.prepare("UPDATE radios SET status='assigned' WHERE id=?").run(req.params.id);
  res.json({ id });
});

router.post('/radios/:id/checkin', (req, res) => {
  const { condition_in, notes } = req.body;
  const assignment = req.db.prepare("SELECT id FROM radio_assignments WHERE radio_id=? AND checked_in_at IS NULL ORDER BY checked_out_at DESC LIMIT 1").get(req.params.id);
  if (assignment) {
    req.db.prepare("UPDATE radio_assignments SET checked_in_at=datetime('now'), condition_in=?, notes=COALESCE(notes||' '||?,notes) WHERE id=?").run(condition_in || 'good', notes || '', assignment.id);
  }
  req.db.prepare("UPDATE radios SET status='available' WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// --- Events CRUD ---
router.get('/events', (req, res) => {
  const c = cid(req);
  const rows = c
    ? req.db.prepare("SELECT * FROM radio_events WHERE client_id = ? ORDER BY date DESC").all(c)
    : req.db.prepare("SELECT * FROM radio_events ORDER BY date DESC").all();
  res.json(rows);
});

router.post('/events', (req, res) => {
  const { client_id, name, date, location, notes } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO radio_events (id, client_id, name, date, location, notes) VALUES (?,?,?,?,?,?)").run(id, client_id, name, date, location, notes);
  res.json({ id });
});

router.put('/events/:id', (req, res) => {
  const { name, date, location, status, notes } = req.body;
  req.db.prepare("UPDATE radio_events SET name=?, date=?, location=?, status=?, notes=? WHERE id=?").run(name, date, location, status, notes, req.params.id);
  res.json({ ok: true });
});

router.delete('/events/:id', (req, res) => {
  req.db.prepare("DELETE FROM radio_assignments WHERE event_id=?").run(req.params.id);
  req.db.prepare("DELETE FROM radio_events WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

router.get('/events/:id/assignments', (req, res) => {
  const rows = req.db.prepare("SELECT a.*, r.callsign, r.make, r.model, r.serial_number FROM radio_assignments a JOIN radios r ON a.radio_id = r.id WHERE a.event_id = ? ORDER BY a.checked_out_at DESC").all(req.params.id);
  res.json(rows);
});

// --- Stats ---
router.get('/stats', (req, res) => {
  const c = cid(req);
  const where = c ? "WHERE client_id = ?" : "";
  const args = c ? [c] : [];
  const total = req.db.prepare(`SELECT COUNT(*) as n FROM radios ${where}`).get(...args).n;
  const available = req.db.prepare(`SELECT COUNT(*) as n FROM radios ${where ? where + " AND" : "WHERE"} status='available'`).get(...args).n;
  const assigned = req.db.prepare(`SELECT COUNT(*) as n FROM radios ${where ? where + " AND" : "WHERE"} status='assigned'`).get(...args).n;
  const maintenance = req.db.prepare(`SELECT COUNT(*) as n FROM radios ${where ? where + " AND" : "WHERE"} status='maintenance'`).get(...args).n;
  const events = req.db.prepare(`SELECT COUNT(*) as n FROM radio_events ${where}`).get(...args).n;
  res.json({ total, available, assigned, maintenance, events });
});

module.exports = router;
