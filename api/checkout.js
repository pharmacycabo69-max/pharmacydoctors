// PharmacyDoctors — secure payment of 100% of a CONFIRMED booking (V5, 2026-11-25).
// POST /api/checkout  {b:"PD-261125-ABCD", i:"iv:2,nad:1,doc:1,video:1", w:"door"|"clinic"}  -> {url}
// GET  /api/checkout?session_id=cs_...                                                     -> {paid, amount, booking}
// Prices live HERE (server side): the browser can never set an amount. USD, tax included.
// Requires env STRIPE_SECRET_KEY (set by the owner in Vercel). Without it the endpoint answers 503 and the
// pay page falls back to "pay at the visit / we send you a link on WhatsApp". No health data is sent to Stripe:
// the line item is a generic "PharmacyDoctors service · Booking PD-…".
'use strict';

const PRICES = {               // cents, USD, tax included (approved master prices)
  iv:    { door: 15900, clinic: 12900 },
  ivGroup: 11900,              // per IV when 6+ standard IVs at the guest's location
  nad:   { door: 27900, clinic: 27900 },   // never part of the group rate
  doc:   { door: 18900, clinic: 9900 },
  video: { door: 5900,  clinic: 5900 },
};
const GROUP_MIN = 6;
const MAX_QTY = 30;
const BOOKING_RE = /^PD-\d{6}-[A-Z0-9]{3,6}$/;

function parseItems(i) {
  const out = {};
  if (typeof i !== 'string' || i.length > 80) return null;
  for (const part of i.split(',')) {
    const m = /^(iv|nad|doc|video):(\d{1,2})$/.exec(part.trim());
    if (!m) return null;
    const q = parseInt(m[2], 10);
    if (q < 1 || q > MAX_QTY) return null;
    out[m[1]] = (out[m[1]] || 0) + q;
  }
  return Object.keys(out).length ? out : null;
}

function quote(items, where) {
  if (where !== 'door' && where !== 'clinic') return null;
  const lines = [];
  if (items.iv) {
    const unit = (where === 'door' && items.iv >= GROUP_MIN) ? PRICES.ivGroup : PRICES.iv[where];
    lines.push({ key: 'iv', qty: items.iv, unit });
  }
  if (items.nad) lines.push({ key: 'nad', qty: items.nad, unit: PRICES.nad[where] });
  if (items.doc) lines.push({ key: 'doc', qty: items.doc, unit: PRICES.doc[where] });
  if (items.video) lines.push({ key: 'video', qty: items.video, unit: PRICES.video[where] });
  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  return total > 0 ? { lines, total } : null;
}

function form(obj, prefix, out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v !== null && typeof v === 'object') form(v, key, out);
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  }
  return out.join('&');
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 4096) break; }
  try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
}

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function handler(req, res) {
  const key = process.env.STRIPE_SECRET_KEY || '';
  const configured = /^sk_(test|live)_/.test(key);
  const fetchFn = handler.fetch || fetch;

  if (req.method === 'GET') {
    const id = new URL(req.url, 'http://x').searchParams.get('session_id') || '';
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) return send(res, 400, { error: 'bad_session' });
    if (!configured) return send(res, 503, { error: 'not_configured' });
    const r = await fetchFn('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(id), { headers: { Authorization: 'Bearer ' + key } });
    const s = await r.json();
    if (!r.ok) return send(res, 502, { error: 'stripe_error' });
    return send(res, 200, { paid: s.payment_status === 'paid', amount: s.amount_total, currency: s.currency, booking: s.client_reference_id || null });
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { error: 'method_not_allowed' }); }
  const body = await readJson(req);
  const booking = String(body.b || '').toUpperCase();
  const items = parseItems(body.i);
  const where = body.w === 'clinic' ? 'clinic' : (body.w === 'door' ? 'door' : null);
  if (!BOOKING_RE.test(booking) || !items || !where) return send(res, 400, { error: 'bad_request' });
  const q = quote(items, where);
  if (!q) return send(res, 400, { error: 'bad_request' });
  if (!configured) return send(res, 503, { error: 'not_configured', total: q.total });

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.pharmacydoctors.com').replace(/[^a-z0-9.:-]/gi, '');
  const origin = 'https://' + host;
  const back = `${origin}/pay/?b=${encodeURIComponent(booking)}&i=${encodeURIComponent(body.i)}&w=${where}`;
  const params = {
    mode: 'payment',
    success_url: `${origin}/pay/success/?b=${encodeURIComponent(booking)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: back + '&cancelled=1',
    client_reference_id: booking,
    submit_type: 'pay',
    locale: body.l === 'es' ? 'es' : 'en',
    'metadata[booking]': booking,
    'payment_intent_data[description]': `PharmacyDoctors booking ${booking}`,
    'payment_intent_data[metadata][booking]': booking,
    'line_items[0][quantity]': 1,
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': q.total,
    'line_items[0][price_data][product_data][name]': `PharmacyDoctors service · Booking ${booking}`,
    'line_items[0][price_data][product_data][description]': 'Confirmed booking. USD, tax included.',
  };
  const r = await fetchFn('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `${booking}-${q.total}-${Math.floor(Date.now() / 600000)}` },
    body: form(params),
  });
  const s = await r.json().catch(() => ({}));
  if (!r.ok || !s.url) return send(res, 502, { error: 'stripe_error' });
  return send(res, 200, { url: s.url, total: q.total });
}

module.exports = handler;
module.exports._test = { parseItems, quote, form, PRICES };
