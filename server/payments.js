const express = require('express');
const { v4: uuid } = require('uuid');
const { authenticate, requireRole } = require('./auth');
const router = express.Router();

// Stripe stub — will use real keys in production
const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;
try { if (stripeKey) stripe = require('stripe')(stripeKey); } catch {}

// List invoices
router.get('/invoices', authenticate, (req, res) => {
  let where = '1=1';
  const params = [];
  if (req.user.role === 'client') { where += ' AND i.client_id = ?'; params.push(req.user.client_id); }
  else if (req.query.client_id) { where += ' AND i.client_id = ?'; params.push(req.query.client_id); }
  const invoices = req.db.prepare(`SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE ${where} ORDER BY i.created_at DESC`).all(...params);
  res.json(invoices);
});

// Get single invoice with items
router.get('/invoices/:id', authenticate, (req, res) => {
  const invoice = req.db.prepare('SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'client' && req.user.client_id !== invoice.client_id) return res.status(403).json({ error: 'Forbidden' });
  const items = req.db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  res.json({ ...invoice, items });
});

// Create invoice (admin)
router.post('/invoices', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const { client_id, project_id, title, description, amount, currency = 'gbp', due_date, items = [] } = req.body;
  const id = uuid();
  req.db.prepare('INSERT INTO invoices (id, client_id, project_id, title, description, amount, currency, due_date) VALUES (?,?,?,?,?,?,?,?)').run(
    id, client_id, project_id || null, title, description || null, amount, currency, due_date || null
  );
  for (const item of items) {
    req.db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total) VALUES (?,?,?,?,?,?)').run(
      uuid(), id, item.description, item.quantity || 1, item.unit_price, item.total || item.unit_price * (item.quantity || 1)
    );
  }
  res.json(req.db.prepare('SELECT * FROM invoices WHERE id = ?').get(id));
});

// Create payment link (stub)
router.post('/invoices/:id/payment-link', authenticate, requireRole('admin', 'staff'), async (req, res) => {
  const invoice = req.db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Not found' });

  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price_data: { currency: invoice.currency, product_data: { name: invoice.title }, unit_amount: invoice.amount }, quantity: 1 }],
        mode: 'payment',
        success_url: `${req.headers.origin || 'http://localhost:5900'}/invoices?paid=${invoice.id}`,
        cancel_url: `${req.headers.origin || 'http://localhost:5900'}/invoices`,
        metadata: { invoice_id: invoice.id }
      });
      req.db.prepare('UPDATE invoices SET stripe_payment_link = ?, status = ? WHERE id = ?').run(session.url, 'sent', invoice.id);
      return res.json({ url: session.url });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Stub: fake payment link
  const fakeLink = `https://checkout.stripe.com/stub/${invoice.id}`;
  req.db.prepare('UPDATE invoices SET stripe_payment_link = ?, status = ? WHERE id = ?').run(fakeLink, 'sent', invoice.id);
  res.json({ url: fakeLink, stub: true });
});

// Mark as paid (admin manual or webhook)
router.post('/invoices/:id/mark-paid', authenticate, requireRole('admin'), (req, res) => {
  req.db.prepare('UPDATE invoices SET status = ?, paid_at = datetime("now") WHERE id = ?').run('paid', req.params.id);
  // Unlock assets
  const invoice = req.db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (invoice?.project_id) {
    req.db.prepare('UPDATE assets SET requires_payment = 0 WHERE project_id = ? AND requires_payment = 1').run(invoice.project_id);
    req.db.prepare('INSERT INTO project_activity (id, project_id, user_id, type, content) VALUES (?,?,?,?,?)').run(
      uuid(), invoice.project_id, req.user.id, 'payment', `Invoice paid: £${(invoice.amount / 100).toFixed(2)}`
    );
  }
  res.json({ ok: true });
});

// Stripe webhook
router.post('/webhook', (req, res) => {
  // In production, verify webhook signature
  try {
    const event = JSON.parse(req.body);
    if (event.type === 'checkout.session.completed') {
      const invoiceId = event.data?.object?.metadata?.invoice_id;
      if (invoiceId) {
        req.db.prepare('UPDATE invoices SET status = ?, paid_at = datetime("now"), stripe_payment_intent = ? WHERE id = ?').run('paid', event.data.object.payment_intent, invoiceId);
        const invoice = req.db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
        if (invoice?.project_id) {
          req.db.prepare('UPDATE assets SET requires_payment = 0 WHERE project_id = ? AND requires_payment = 1').run(invoice.project_id);
        }
      }
    }
  } catch {}
  res.json({ received: true });
});

module.exports = router;
