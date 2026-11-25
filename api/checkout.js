// PharmacyDoctors — pay 100% of a CONFIRMED booking (V5.1).
// GET  /api/checkout?t=<signed token>     -> booking summary computed on the server (+ paid status)
// POST /api/checkout {t}                   -> Stripe Checkout URL (idempotent per token, refuses if already paid)
// GET  /api/checkout?session_id=cs_…       -> verified payment status from Stripe (amount, currency, booking)
// Tokens are created only by staff through /api/paylink after availability is confirmed (see docs/PAYMENTS_SETUP.md).
'use strict';
const L = require('./_lib/pay.js');

async function handler(req, res) {
  const fetchFn = handler.fetch || fetch;
  const secret = process.env.PAY_LINK_SECRET || '';
  const url = new URL(req.url || '/', 'http://x');

  // ---- payment status after Checkout (server-verified, never trusts the browser) ----
  const sid = url.searchParams.get('session_id');
  if (req.method === 'GET' && sid) {
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sid)) return L.send(res, 400, { error: 'bad_session' });
    if (!L.stripeKey()) return L.send(res, 503, { error: 'not_configured' });
    const r = await L.stripe(fetchFn, 'GET', '/v1/checkout/sessions/' + encodeURIComponent(sid));
    if (!r.ok) return L.send(res, 502, { error: 'stripe_error' });
    const s = r.j, md = s.metadata || {};
    const amountOk = String(s.amount_total) === String(md.expected_total) && s.currency === 'usd';
    return L.send(res, 200, { paid: s.payment_status === 'paid' && amountOk, status: s.payment_status, session_status: s.status, amount: s.amount_total, currency: s.currency, booking: s.client_reference_id || null, amount_ok: amountOk });
  }

  // ---- summary for the pay page ----
  if (req.method === 'GET') {
    const v = L.verifyToken(url.searchParams.get('t'), secret);
    if (!v.ok) return L.send(res, v.error === 'not_configured' ? 503 : (v.error === 'expired' ? 410 : 400), { error: v.error, booking: v.booking || null });
    let paid = null;
    if (L.stripeKey()) { const f = await L.findPaid(fetchFn, v.p.b); paid = f.error ? null : f.paid; }
    return L.send(res, 200, { booking: v.p.b, where: v.p.w, lang: v.p.l, expires: v.p.exp, lines: v.q.lines, total: v.q.total, paid, payments_enabled: !!L.stripeKey() });
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return L.send(res, 405, { error: 'method_not_allowed' }); }

  // ---- create Checkout session ----
  const body = await L.readJson(req);
  const v = L.verifyToken(body.t, secret);
  if (!v.ok) return L.send(res, v.error === 'not_configured' ? 503 : (v.error === 'expired' ? 410 : 400), { error: v.error });
  if (!L.stripeKey()) return L.send(res, 503, { error: 'not_configured', total: v.q.total });

  const already = await L.findPaid(fetchFn, v.p.b);
  if (already.error) return L.send(res, 502, { error: 'stripe_error' });
  if (already.paid) return L.send(res, 409, { error: 'already_paid', booking: v.p.b });

  const origin = L.originOf(req);
  const nowS = Math.floor(Date.now() / 1000);
  const expiresAt = Math.max(nowS + 31 * 60, Math.min(v.p.exp, nowS + 23 * 3600));   // Stripe allows 30 min – 24 h
  const tid = L.tokenId(body.t);
  const params = {
    mode: 'payment',
    success_url: `${origin}/pay/success/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pay/?t=${encodeURIComponent(body.t)}&cancelled=1`,
    client_reference_id: v.p.b,
    expires_at: expiresAt,
    submit_type: 'pay',
    locale: v.p.l === 'es' ? 'es' : 'en',
    'metadata[booking]': v.p.b,
    'metadata[expected_total]': v.q.total,
    'metadata[link_id]': tid,
    'payment_intent_data[description]': `PharmacyDoctors booking ${v.p.b}`,
    'payment_intent_data[metadata][booking]': v.p.b,
    'payment_intent_data[metadata][expected_total]': v.q.total,
    'line_items[0][quantity]': 1,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': v.q.total,
    'line_items[0][price_data][product_data][name]': `PharmacyDoctors service · Booking ${v.p.b}`,
    'line_items[0][price_data][product_data][description]': 'Confirmed booking. USD, tax included.',
  };
  // Same link -> same Checkout session for 24 h (Stripe idempotency); prevents double sessions from double clicks.
  const r = await L.stripe(fetchFn, 'POST', '/v1/checkout/sessions', params, { 'Idempotency-Key': `pd-${tid}` });
  if (!r.ok || !r.j.url) return L.send(res, 502, { error: 'stripe_error' });
  return L.send(res, 200, { url: r.j.url, total: v.q.total });
}

module.exports = handler;
