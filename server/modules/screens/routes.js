const { Router } = require('express');
const { v4: uuid } = require('uuid');
const router = Router();

function clientId(req) {
  return req.user?.client_id || req.query.client_id;
}

// GET /config
router.get('/config', (req, res) => {
  const cid = clientId(req);
  if (!cid) return res.status(400).json({ error: 'client_id required' });
  const config = req.db.prepare('SELECT id, client_id, screens_portal_url, screens_client_id, screen_count, last_synced, config, created_at FROM screens_config WHERE client_id = ?').get(cid);
  if (!config) return res.json(null);
  res.json(config);
});

// PUT /config
router.put('/config', (req, res) => {
  const { client_id, screens_portal_url, screens_client_id, portal_password, screen_count, config } = req.body;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });

  const existing = req.db.prepare('SELECT id FROM screens_config WHERE client_id = ?').get(client_id);
  if (existing) {
    req.db.prepare('UPDATE screens_config SET screens_portal_url = COALESCE(?, screens_portal_url), screens_client_id = COALESCE(?, screens_client_id), portal_password = COALESCE(?, portal_password), screen_count = COALESCE(?, screen_count), config = COALESCE(?, config) WHERE client_id = ?')
      .run(screens_portal_url || null, screens_client_id || null, portal_password || null, screen_count ?? null, config ? JSON.stringify(config) : null, client_id);
    res.json({ id: existing.id });
  } else {
    const id = uuid();
    req.db.prepare('INSERT INTO screens_config (id, client_id, screens_portal_url, screens_client_id, portal_password, screen_count) VALUES (?,?,?,?,?,?)')
      .run(id, client_id, screens_portal_url || 'https://screens.local-connect.uk', screens_client_id || null, portal_password || null, screen_count || 0);
    res.json({ id });
  }
});

// GET /status
router.get('/status', async (req, res) => {
  const cid = clientId(req);
  if (!cid) return res.status(400).json({ error: 'client_id required' });

  const config = req.db.prepare('SELECT * FROM screens_config WHERE client_id = ?').get(cid);
  if (!config) return res.json({ status: 'not_configured' });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(`${config.screens_portal_url}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);
    res.json({ status: resp.ok ? 'online' : 'degraded', portalUrl: config.screens_portal_url, screenCount: config.screen_count });
  } catch {
    res.json({ status: 'unreachable', portalUrl: config.screens_portal_url, screenCount: config.screen_count });
  }
});

module.exports = router;
