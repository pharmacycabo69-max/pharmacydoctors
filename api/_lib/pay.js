// PharmacyDoctors — shared payment logic (V5.1, 2026-11-25). Files under api/_lib are not exposed as endpoints.
// - Prices live only here (USD cents, tax included).
// - Payment links are HMAC-signed tokens created ONLY by staff (concierge) after confirming availability.
//   A visitor cannot create or alter a valid link: no secret, no link.
// - Nothing medical is sent to Stripe: only booking code and expected amount.
'use strict';
const crypto = require('crypto');

// Single source of truth: assets/pd-data.json (also used by the catalog and the consistency tests).
const D = require('../../assets/pd-data.json');
const P = D.prices;
const PRICES = {               // approved master prices (cents, USD, tax included)
  iv:    { door: P.iv.door, clinic: P.iv.clinic },       // $159 at your location · $129 at the clinic
  ivGroup: P.ivGroup.unit,                               // $119 per IV, 6+ standard IVs at the guest's location
  nad:   { door: P.nad.door, clinic: P.nad.clinic },     // $279, never part of the group rate
  doc:   { door: P.doc.door, clinic: P.doc.clinic },     // Home Doctor $189 · Walk-in $99
  video: { door: P.video.door, clinic: P.video.clinic }, // Video $59
};
const GROUP_MIN = P.ivGroup.min;
const MAX_QTY = 30;
const BOOKING_RE = /^PD-\d{6}-[A-Z0-9]{3,6}$/;
const MAX_HOURS = 72;

function parseItems(i) {
  const out = {};
  if (typeof i !== 'string' || !i || i.length > 80) return null;
  for (const part of i.split(',')) {
    const m = /^(iv|nad|doc|video):(\d{1,2})$/.exec(part.trim());
    if (!m) return null;
    const q = parseInt(m[2], 10);
    if (q < 1 || q > MAX_QTY) return null;
    out[m[1]] = (out[m[1]] || 0) + q;
  }
  return Object.keys(out).length ? out : null;
}

// Quoted services (X-ray, lab, aesthetics, private nurse): the amount is set by staff in the signed link after the
// written quote is accepted. Bounds protect against typos ($10 – $5,000).
const QUOTE_TYPES = ['xray', 'lab', 'aes', 'nurse'];
const QUOTE_MIN = 1000, QUOTE_MAX = 500000;
function validQuote(qx, qa) { return QUOTE_TYPES.includes(qx) && Number.isInteger(qa) && qa >= QUOTE_MIN && qa <= QUOTE_MAX; }

function quote(items, where, qx, qa) {
  if (where !== 'door' && where !== 'clinic') return null;
  items = items || {};
  const lines = [];
  if (items.iv) lines.push({ key: 'iv', qty: items.iv, unit: (where === 'door' && items.iv >= GROUP_MIN) ? PRICES.ivGroup : PRICES.iv[where] });
  if (items.nad) lines.push({ key: 'nad', qty: items.nad, unit: PRICES.nad[where] });
  if (items.doc) lines.push({ key: 'doc', qty: items.doc, unit: PRICES.doc[where] });
  if (items.video) lines.push({ key: 'video', qty: items.video, unit: PRICES.video[where] });
  if (qx !== undefined && qx !== null) { if (!validQuote(qx, qa)) return null; lines.push({ key: 'q_' + qx, qty: 1, unit: qa }); }
  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  return total > 0 ? { lines, total } : null;
}

const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function sign(payload, secret) {
  const body = b64u(JSON.stringify(payload));
  const sig = b64u(crypto.createHmac('sha256', secret).update(body).digest());
  return body + '.' + sig;
}

// Returns {ok:true, p, q} or {ok:false, error}
function verifyToken(token, secret, nowS) {
  if (!secret || secret.length < 32) return { ok: false, error: 'not_configured' };
  if (typeof token !== 'string' || token.length > 1024 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return { ok: false, error: 'bad_token' };
  const [body, sig] = token.split('.');
  const expect = b64u(crypto.createHmac('sha256', secret).update(body).digest());
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return { ok: false, error: 'bad_token' };
  let p; try { p = JSON.parse(unb64u(body).toString('utf8')); } catch (e) { return { ok: false, error: 'bad_token' }; }
  if (p.v !== 1 || !BOOKING_RE.test(p.b || '')) return { ok: false, error: 'bad_token' };
  const now = nowS || Math.floor(Date.now() / 1000);
  if (!p.exp || now > p.exp) return { ok: false, error: 'expired', booking: p.b };
  if (p.i && !parseItems(p.i)) return { ok: false, error: 'bad_token' };
  const q = quote(p.i ? parseItems(p.i) : {}, p.w, p.qx, p.qa);
  if (!q) return { ok: false, error: 'bad_token' };
  return { ok: true, p, q };
}

function makeToken({ b, i, w, hours, l, qx, qa }, secret, nowS) {
  const booking = String(b || '').toUpperCase();
  const items = i ? parseItems(i) : {};
  const hasQuote = qx !== undefined && qx !== null && qx !== '';
  if (hasQuote) qa = Math.round(Number(qa));
  if (!BOOKING_RE.test(booking) || !items || (w !== 'door' && w !== 'clinic')) return null;
  if (hasQuote && !validQuote(qx, qa)) return null;
  const q = quote(items, w, hasQuote ? qx : undefined, hasQuote ? qa : undefined);
  if (!q) return null;
  const h = Math.max(1, Math.min(MAX_HOURS, parseInt(hours, 10) || 24));
  const now = nowS || Math.floor(Date.now() / 1000);
  const p = { v: 1, b: booking, i: i ? String(i) : '', w, iat: now, exp: now + h * 3600, n: b64u(crypto.randomBytes(6)), l: l === 'es' ? 'es' : 'en' };
  if (hasQuote) { p.qx = qx; p.qa = qa; }
  return { token: sign(p, secret), p, q };
}

const tokenId = (token) => crypto.createHash('sha256').update(String(token)).digest('hex').slice(0, 24);

function safeEqual(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

function form(obj) {
  return Object.entries(obj).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(String(v))).join('&');
}

function stripeBase() { return process.env.STRIPE_API_BASE || 'https://api.stripe.com'; }
function stripeKey() { const k = process.env.STRIPE_SECRET_KEY || ''; return /^sk_(test|live)_/.test(k) ? k : ''; }

async function stripe(fetchFn, method, path, params, extraHeaders) {
  const key = stripeKey();
  const opts = { method, headers: Object.assign({ Authorization: 'Bearer ' + key }, extraHeaders || {}) };
  let url = stripeBase() + path;
  if (params && method === 'GET') url += (url.includes('?') ? '&' : '?') + form(params);
  else if (params) { opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'; opts.body = form(params); }
  const r = await fetchFn(url, opts);
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}

// Already paid? Uses Stripe's PaymentIntent search on our booking metadata.
async function findPaid(fetchFn, booking) {
  const r = await stripe(fetchFn, 'GET', '/v1/payment_intents/search', { query: `metadata['booking']:'${booking}' AND status:'succeeded'`, limit: 1 });
  if (!r.ok) return { error: true };
  return { paid: Array.isArray(r.j.data) && r.j.data.length > 0, pi: r.j.data && r.j.data[0] };
}

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 8192) break; }
  try { return JSON.parse(raw || '{}'); } catch (e) { return {}; }
}

function originOf(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.pharmacydoctors.com').replace(/[^a-z0-9.:-]/gi, '');
  const proto = /^localhost(:\d+)?$/.test(host) ? 'http' : 'https';
  return proto + '://' + host;
}

async function notifyTeam(fetchFn, fields) {
  try {
    const r = await fetchFn('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.assign({ access_key: process.env.WEB3FORMS_KEY || '61ecefdf-b8ed-4b03-b9e9-b83c05a29c0f', from_name: 'Pharmacy & Doctors Cabo – Payments' }, fields)),
    });
    return r.ok;
  } catch (e) { return false; }
}

module.exports = { QUOTE_TYPES, PRICES, GROUP_MIN, BOOKING_RE, MAX_HOURS, parseItems, quote, sign, verifyToken, makeToken, tokenId, safeEqual, form, stripe, stripeKey, findPaid, send, readJson, originOf, notifyTeam };
