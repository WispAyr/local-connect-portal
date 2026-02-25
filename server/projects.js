const express = require('express');
const { v4: uuid } = require('uuid');
const { authenticate, requireRole } = require('./auth');
const router = express.Router();

function clientFilter(user) {
  if (user.role === 'admin' || user.role === 'staff') return { where: '', params: [] };
  return { where: 'AND p.client_id = ?', params: [user.client_id] };
}

// List projects
router.get('/', authenticate, (req, res) => {
  const f = clientFilter(req.user);
  const { status, client_id, category } = req.query;
  let where = '1=1 ' + f.where;
  const params = [...f.params];
  if (status) { where += ' AND p.status = ?'; params.push(status); }
  if (client_id && (req.user.role === 'admin' || req.user.role === 'staff')) { where += ' AND p.client_id = ?'; params.push(client_id); }
  if (category) { where += ' AND p.category = ?'; params.push(category); }
  const projects = req.db.prepare(`SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE ${where} ORDER BY p.updated_at DESC`).all(...params);
  res.json(projects);
});

// Get single project with activity
router.get('/:id', authenticate, (req, res) => {
  const f = clientFilter(req.user);
  const project = req.db.prepare(`SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ? ${f.where}`).get(req.params.id, ...f.params);
  if (!project) return res.status(404).json({ error: 'Not found' });
  const activity = req.db.prepare('SELECT pa.*, u.name as user_name FROM project_activity pa LEFT JOIN users u ON pa.user_id = u.id WHERE pa.project_id = ? ORDER BY pa.created_at ASC').all(req.params.id);
  const assets = req.db.prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC').all(req.params.id);
  const invoice = project.invoice_id ? req.db.prepare('SELECT * FROM invoices WHERE id = ?').get(project.invoice_id) : null;
  res.json({ ...project, activity, assets, invoice });
});

// Create project
router.post('/', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const { client_id, title, description, brief, category, priority, due_date, budget } = req.body;
  const id = uuid();
  req.db.prepare('INSERT INTO projects (id, client_id, title, description, brief, category, priority, due_date, budget, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)').run(
    id, client_id, title, description || null, brief || null, category || null, priority || 'normal', due_date || null, budget || null, req.user.id
  );
  res.json(req.db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
});

// Update project
router.put('/:id', authenticate, (req, res) => {
  const project = req.db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'client' && req.user.client_id !== project.client_id) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, brief, status, priority, category, due_date, budget, assigned_to } = req.body;
  const oldStatus = project.status;
  req.db.prepare('UPDATE projects SET title=?, description=?, brief=?, status=?, priority=?, category=?, due_date=?, budget=?, assigned_to=?, updated_at=datetime("now") WHERE id=?').run(
    title ?? project.title, description ?? project.description, brief ?? project.brief,
    status ?? project.status, priority ?? project.priority, category ?? project.category,
    due_date ?? project.due_date, budget ?? project.budget, assigned_to ?? project.assigned_to, req.params.id
  );

  if (status && status !== oldStatus) {
    req.db.prepare('INSERT INTO project_activity (id, project_id, user_id, type, content) VALUES (?,?,?,?,?)').run(
      uuid(), req.params.id, req.user.id, 'status_change', `Status changed from ${oldStatus} to ${status}`
    );
  }
  res.json(req.db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

// Add activity/comment
router.post('/:id/activity', authenticate, (req, res) => {
  const { type = 'comment', content, metadata } = req.body;
  const id = uuid();
  req.db.prepare('INSERT INTO project_activity (id, project_id, user_id, type, content, metadata) VALUES (?,?,?,?,?,?)').run(
    id, req.params.id, req.user.id, type, content, JSON.stringify(metadata || {})
  );
  res.json(req.db.prepare('SELECT pa.*, u.name as user_name FROM project_activity pa LEFT JOIN users u ON pa.user_id = u.id WHERE pa.id = ?').get(id));
});

module.exports = router;
