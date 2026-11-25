// PharmacyDoctors — Stripe webhook (V5). On checkout.session.completed it emails the team automatically
// ("Booking PD-… PAID $…") through the same Web3Forms channel the booking form uses.
// Requires env STRIPE_WEBHOOK_SECRET (whsec_…). Optional env WEB3FORMS_KEY (defaults to the public site key).
// Signature verification follows Stripe's scheme: HMAC-SHA256 of "<t>.<raw body>", 5-minute tolerance.
// No health information is read or forwarded: only booking code, amount and payment status.
'use strict';
const crypto = require('crypto');

const TOLERANCE_S = 300;
const DEFAULT_W3F = '61ecefdf-b8ed-4b03-b9e9-b83c05a29c0f';

function verify(raw, header, secret, nowS) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')).filter(p => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const sigs = header.split(',').filter(p => p.trim().startsWith('v1=')).map(p => p.trim().slice(3));
  const t = parseInt(parts.t, 10);
  if (!t || !sigs.length) return false;
  if (Math.abs((nowS || Math.floor(Date.now() / 1000)) - t) > TOLERANCE_S) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw}`, 'utf8').digest('hex');
  return sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

async function rawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw;
}

async function handler(req, res) {
  const done = (code, msg) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(msg)); };
  if (req.method !== 'POST') return done(405, { error: 'method_not_allowed' });
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret) return done(503, { error: 'not_configured' });
  const raw = await rawBody(req);
  if (!verify(raw, req.headers['stripe-signature'], secret)) return done(400, { error: 'bad_signature' });
  let evt; try { evt = JSON.parse(raw); } catch (e) { return done(400, { error: 'bad_json' }); }
  if (evt.type !== 'checkout.session.completed' && evt.type !== 'checkout.session.async_payment_succeeded') return done(200, { received: true, ignored: evt.type });
  const s = evt.data && evt.data.object || {};
  const booking = /^PD-\d{6}-[A-Z0-9]{3,6}$/.test(s.client_reference_id || '') ? s.client_reference_id : 'unknown';
  const amount = typeof s.amount_total === 'number' ? (s.amount_total / 100).toFixed(2) : '?';
  const fetchFn = handler.fetch || fetch;
  try {
    await fetchFn('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_KEY || DEFAULT_W3F,
        from_name: 'Pharmacy & Doctors Cabo – Payments',
        subject: `PAID · Booking ${booking} · $${amount} USD`,
        Booking: booking, 'Amount USD': amount, 'Payment status': s.payment_status || '-',
        'Stripe session': s.id || '-', Note: 'Paid online after confirmation. Check the Stripe dashboard for the receipt.',
      }),
    });
  } catch (e) { /* email failure must not make Stripe retry forever; Stripe dashboard remains the source of truth */ }
  return done(200, { received: true });
}

module.exports = handler;
module.exports._test = { verify };
