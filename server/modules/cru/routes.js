const { Router } = require('express');
const { v4: uuid } = require('uuid');
const router = Router();

function cid(req) { return req.user?.client_id || req.query.client_id; }

// --- Vehicles CRUD ---
router.get('/vehicles', (req, res) => {
  const c = cid(req);
  const rows = c
    ? req.db.prepare("SELECT * FROM cru_vehicles WHERE client_id = ? ORDER BY created_at DESC").all(c)
    : req.db.prepare("SELECT * FROM cru_vehicles ORDER BY created_at DESC").all();
  res.json(rows);
});

router.post('/vehicles', (req, res) => {
  const { client_id, name, registration, type, specs } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO cru_vehicles (id, client_id, name, registration, type, specs) VALUES (?,?,?,?,?,?)").run(id, client_id, name, registration, type, JSON.stringify(specs || {}));
  res.json({ id });
});

router.put('/vehicles/:id', (req, res) => {
  const { name, registration, type, status, specs } = req.body;
  req.db.prepare("UPDATE cru_vehicles SET name=?, registration=?, type=?, status=?, specs=? WHERE id=?").run(name, registration, type, status, JSON.stringify(specs || {}), req.params.id);
  res.json({ ok: true });
});

router.delete('/vehicles/:id', (req, res) => {
  req.db.prepare("DELETE FROM cru_capabilities WHERE vehicle_id=?").run(req.params.id);
  req.db.prepare("DELETE FROM cru_deployments WHERE vehicle_id=?").run(req.params.id);
  req.db.prepare("DELETE FROM cru_vehicles WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// Full vehicle detail
router.get('/vehicles/:id/full', (req, res) => {
  const vehicle = req.db.prepare("SELECT * FROM cru_vehicles WHERE id=?").get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Not found' });
  const capabilities = req.db.prepare("SELECT * FROM cru_capabilities WHERE vehicle_id=? ORDER BY category").all(req.params.id);
  const deployments = req.db.prepare("SELECT * FROM cru_deployments WHERE vehicle_id=? ORDER BY deploy_date DESC").all(req.params.id);
  res.json({ ...vehicle, capabilities, deployments });
});

// --- Capabilities ---
router.post('/vehicles/:id/capabilities', (req, res) => {
  const { category, name, description, quantity } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO cru_capabilities (id, vehicle_id, category, name, description, quantity) VALUES (?,?,?,?,?,?)").run(id, req.params.id, category, name, description, quantity || 1);
  res.json({ id });
});

router.delete('/capabilities/:id', (req, res) => {
  req.db.prepare("DELETE FROM cru_capabilities WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// --- Deployments ---
router.get('/deployments', (req, res) => {
  const rows = req.db.prepare("SELECT d.*, v.name as vehicle_name FROM cru_deployments d JOIN cru_vehicles v ON d.vehicle_id=v.id ORDER BY d.deploy_date DESC").all();
  res.json(rows);
});

router.post('/deployments', (req, res) => {
  const { vehicle_id, event_name, location, deploy_date, return_date, notes } = req.body;
  const id = uuid();
  req.db.prepare("INSERT INTO cru_deployments (id, vehicle_id, event_name, location, deploy_date, return_date, notes) VALUES (?,?,?,?,?,?,?)").run(id, vehicle_id, event_name, location, deploy_date, return_date, notes);
  if (deploy_date) req.db.prepare("UPDATE cru_vehicles SET status='deployed' WHERE id=?").run(vehicle_id);
  res.json({ id });
});

router.put('/deployments/:id', (req, res) => {
  const { event_name, location, deploy_date, return_date, status, notes } = req.body;
  req.db.prepare("UPDATE cru_deployments SET event_name=?, location=?, deploy_date=?, return_date=?, status=?, notes=? WHERE id=?").run(event_name, location, deploy_date, return_date, status, notes, req.params.id);
  if (status === 'returned') {
    const dep = req.db.prepare("SELECT vehicle_id FROM cru_deployments WHERE id=?").get(req.params.id);
    if (dep) req.db.prepare("UPDATE cru_vehicles SET status='available' WHERE id=?").run(dep.vehicle_id);
  }
  res.json({ ok: true });
});

// --- Stats ---
router.get('/stats', (req, res) => {
  const c = cid(req);
  const where = c ? "WHERE client_id = ?" : "";
  const args = c ? [c] : [];
  const total = req.db.prepare(`SELECT COUNT(*) as n FROM cru_vehicles ${where}`).get(...args).n;
  const available = req.db.prepare(`SELECT COUNT(*) as n FROM cru_vehicles ${where ? where + " AND" : "WHERE"} status='available'`).get(...args).n;
  const deployed = req.db.prepare(`SELECT COUNT(*) as n FROM cru_vehicles ${where ? where + " AND" : "WHERE"} status='deployed'`).get(...args).n;
  res.json({ total, available, deployed });
});

module.exports = router;
