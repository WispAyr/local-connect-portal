const express = require('express');
const { v4: uuid } = require('uuid');
const { authenticate, requireRole } = require('./auth');
const router = express.Router();

// List clients (admin sees all, client sees own)
router.get('/', authenticate, (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'staff') {
    res.json(req.db.prepare('SELECT * FROM clients WHERE is_active = 1 ORDER BY name').all());
  } else {
    const client = req.db.prepare('SELECT * FROM clients WHERE id = ?').get(req.user.client_id);
    res.json(client ? [client] : []);
  }
});

// Get single client
router.get('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.client_id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const client = req.db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  const users = req.db.prepare('SELECT id, email, name, role, avatar_url FROM users WHERE client_id = ?').all(req.params.id);
  res.json({ ...client, users });
});

// Create client (admin)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const { name, slug, email, phone, branding, product_lines, modules, plan } = req.body;
  const id = req.body.id || uuid();
  try {
    req.db.prepare('INSERT INTO clients (id, name, slug, email, phone, branding, product_lines, modules, plan) VALUES (?,?,?,?,?,?,?,?,?)').run(
      id, name, slug || name.toLowerCase().replace(/\s+/g, '-'), email || null, phone || null,
      JSON.stringify(branding || {}), JSON.stringify(product_lines || ['digital']),
      JSON.stringify(modules || []), plan || 'starter'
    );
    res.json(req.db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Update client (admin)
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const { name, email, phone, branding, product_lines, modules, plan, is_active } = req.body;
  const client = req.db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  req.db.prepare('UPDATE clients SET name=?, email=?, phone=?, branding=?, product_lines=?, modules=?, plan=?, is_active=? WHERE id=?').run(
    name ?? client.name, email ?? client.email, phone ?? client.phone,
    branding ? JSON.stringify(branding) : client.branding,
    product_lines ? JSON.stringify(product_lines) : client.product_lines,
    modules ? JSON.stringify(modules) : client.modules,
    plan ?? client.plan, is_active ?? client.is_active, req.params.id
  );
  res.json(req.db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
});

module.exports = router;
