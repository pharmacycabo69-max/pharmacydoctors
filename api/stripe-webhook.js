// PharmacyDoctors — Stripe webhook (V5.1). Source of truth for payments = Stripe; this endpoint notifies the team.
// Events handled: checkout.session.completed (paid / pending), checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed, checkout.session.expired, charge.refunded.
// Requires env STRIPE_WEBHOOK_SECRET (whsec_…). Signature: HMAC-SHA256 of "<t>.<raw body>", 5-minute tolerance.
// Amount and currency are checked against the expected total stored in the session metadata by /api/checkout.
// The payment record lives in Stripe even if the notification email fails (we still answer 200).
// No health information is read or forwarded: only booking code, amount and status.
'use strict';
const crypto = require('crypto');
const L = require('./_lib/pay.js');
const TOLERANCE_S = 300;

function verify(raw, header, secret, nowS) {
  if (!header || !secret) return false;
  const items = String(header).split(',').map(p => p.trim());
  const t = parseInt((items.find(p => p.startsWith('t=')) || '').slice(2), 10);
  const sigs = items.filter(p => p.startsWith('v1=')).map(p => p.slice(3));
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

function classify(evt) {
  const o = (evt.data && evt.data.object) || {};
  const md = o.metadata || {};
  const booking = L.BOOKING_RE.test(o.client_reference_id || md.booking || '') ? (o.client_reference_id || md.booking) : 'unknown';
  const usd = (c) => (typeof c === 'number' ? (c / 100).toFixed(2) : '?');
  switch (evt.type) {
    case 'checkout.session.completed': {
      const amountOk = String(o.amount_total) === String(md.expected_total) && o.currency === 'usd';
      if (o.payment_status === 'paid') return { status: amountOk ? 'PAID' : 'PAID – AMOUNT MISMATCH, REVIEW', booking, amount: usd(o.amount_total) };
      return { status: 'PENDING (delayed payment method)', booking, amount: usd(o.amount_total) };
    }
    case 'checkout.session.async_payment_succeeded': return { status: 'PAID (delayed method confirmed)', booking, amount: usd(o.amount_total) };
    case 'checkout.session.async_payment_failed': return { status: 'PAYMENT FAILED', booking, amount: usd(o.amount_total) };
    case 'checkout.session.expired': return { status: 'LINK EXPIRED / NOT PAID', booking, amount: usd(o.amount_total), quiet: true };
    case 'charge.refunded': {
      const m = /PD-\d{6}-[A-Z0-9]{3,6}/.exec(md.booking || o.description || '');
      return { status: o.amount_refunded >= o.amount ? 'REFUNDED (full)' : 'REFUNDED (partial)', booking: m ? m[0] : 'see Stripe', amount: usd(o.amount_refunded) };
    }
    default: return null;
  }
}

async function handler(req, res) {
  const done = (code, msg) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(msg)); };
  if (req.method !== 'POST') return done(405, { error: 'method_not_allowed' });
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret) return done(503, { error: 'not_configured' });
  const raw = await rawBody(req);
  if (!verify(raw, req.headers['stripe-signature'], secret)) return done(400, { error: 'bad_signature' });
  let evt; try { evt = JSON.parse(raw); } catch (e) { return done(400, { error: 'bad_json' }); }
  const c = classify(evt);
  if (!c) return done(200, { received: true, ignored: evt.type });
  let emailed = false;
  if (!c.quiet || process.env.NOTIFY_EXPIRED === '1') {
    emailed = await L.notifyTeam(handler.fetch || fetch, {
      subject: `${c.status} · Booking ${c.booking} · $${c.amount} USD`,
      Booking: c.booking, Status: c.status, 'Amount USD': c.amount, 'Stripe event': evt.id || '-', 'Event type': evt.type,
      Note: 'Stripe is the payment record. Check the Stripe dashboard before confirming or refunding.',
    });
  }
  return done(200, { received: true, status: c.status, emailed });
}

module.exports = handler;
module.exports._test = { verify, classify };
