const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'local-connect-dev-secret-change-me';
const JWT_EXPIRY = '7d';

// Middleware to verify JWT
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = req.db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role, client_id: user.client_id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  const client = user.client_id ? req.db.prepare('SELECT * FROM clients WHERE id = ?').get(user.client_id) : null;
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, client_id: user.client_id, avatar_url: user.avatar_url }, client });
});

// Register (admin only)
router.post('/register', authenticate, requireRole('admin'), (req, res) => {
  const { email, password, name, role = 'client', client_id } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const id = uuid();
  try {
    req.db.prepare('INSERT INTO users (id, email, password_hash, name, role, client_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, email, hash, name, role, client_id || null);
    res.json({ id, email, name, role, client_id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  const user = req.db.prepare('SELECT id, email, name, role, client_id, avatar_url FROM users WHERE id = ?').get(req.user.id);
  const client = user?.client_id ? req.db.prepare('SELECT * FROM clients WHERE id = ?').get(user.client_id) : null;
  res.json({ user, client });
});

module.exports = router;
module.exports.authenticate = authenticate;
module.exports.requireRole = requireRole;
