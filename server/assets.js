const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const { authenticate, requireRole } = require('./auth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => cb(null, `${uuid()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB

// List assets (filtered by client)
router.get('/', authenticate, (req, res) => {
  const { project_id, client_id, type } = req.query;
  let where = '1=1';
  const params = [];
  if (req.user.role === 'client') { where += ' AND a.client_id = ?'; params.push(req.user.client_id); }
  else if (client_id) { where += ' AND a.client_id = ?'; params.push(client_id); }
  if (project_id) { where += ' AND a.project_id = ?'; params.push(project_id); }
  if (type) { where += ' AND a.type = ?'; params.push(type); }
  res.json(req.db.prepare(`SELECT a.*, u.name as uploaded_by FROM assets a LEFT JOIN users u ON a.created_by = u.id WHERE ${where} ORDER BY a.created_at DESC`).all(...params));
});

// Upload asset
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { project_id, client_id, name, type = 'deliverable', requires_payment = 0 } = req.body;
  const cid = client_id || req.user.client_id;
  if (!cid) return res.status(400).json({ error: 'client_id required' });
  const id = uuid();
  const shareToken = uuid();
  req.db.prepare('INSERT INTO assets (id, project_id, client_id, name, filename, file_path, file_size, mime_type, type, share_token, requires_payment, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id, project_id || null, cid, name || req.file.originalname, req.file.originalname,
    req.file.filename, req.file.size, req.file.mimetype, type, shareToken, requires_payment ? 1 : 0, req.user.id
  );
  if (project_id) {
    req.db.prepare('INSERT INTO project_activity (id, project_id, user_id, type, content) VALUES (?,?,?,?,?)').run(
      uuid(), project_id, req.user.id, 'file_upload', `Uploaded ${req.file.originalname}`
    );
  }
  res.json(req.db.prepare('SELECT * FROM assets WHERE id = ?').get(id));
});

// Download / view asset
router.get('/:id/download', authenticate, (req, res) => {
  const asset = req.db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'client' && req.user.client_id !== asset.client_id) return res.status(403).json({ error: 'Forbidden' });
  if (asset.requires_payment && req.user.role === 'client') {
    const invoice = req.db.prepare('SELECT * FROM invoices WHERE project_id = ? AND status = ?').get(asset.project_id, 'paid');
    if (!invoice) return res.status(402).json({ error: 'Payment required' });
  }
  req.db.prepare('UPDATE assets SET download_count = download_count + 1 WHERE id = ?').run(asset.id);
  res.sendFile(path.join(__dirname, '..', 'uploads', asset.file_path));
});

// Public share link
router.get('/share/:token', (req, res) => {
  const asset = req.db.prepare('SELECT * FROM assets WHERE share_token = ?').get(req.params.token);
  if (!asset) return res.status(404).json({ error: 'Not found' });
  if (asset.requires_payment) {
    const invoice = req.db.prepare('SELECT * FROM invoices WHERE project_id = ? AND status = ?').get(asset.project_id, 'paid');
    if (!invoice) return res.status(402).json({ error: 'Payment required' });
  }
  req.db.prepare('UPDATE assets SET download_count = download_count + 1 WHERE id = ?').run(asset.id);
  res.sendFile(path.join(__dirname, '..', 'uploads', asset.file_path));
});

module.exports = router;
