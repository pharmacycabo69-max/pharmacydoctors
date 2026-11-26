// Unit tests — payments V5.1 (no network, fake keys). Usage: node tests/payments.test.js
'use strict';
const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const root = process.argv[2] || path.resolve(__dirname, '..');
const L = require(root + '/api/_lib/pay.js');
const co = require(root + '/api/checkout.js');
const pl = require(root + '/api/paylink.js');
const wh = require(root + '/api/stripe-webhook.js');
let pass = 0; const ok = (c, m) => { assert.ok(c, m); pass++; console.log('PASS', m); };
const SECRET = 'test-pay-link-secret-0123456789abcdef-XYZ';
const STAFF = 'test-staff-key-123456';
function res() { return { statusCode: 0, headers: {}, body: '', setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; }, get j() { return JSON.parse(this.body); } }; }

(async () => {
  // ---------- prices ----------
  const Q = (i, w) => L.quote(L.parseItems(i), w).total;
  ok(Q('iv:1', 'door') === 15900, 'IV at your location $159');
  ok(Q('iv:1', 'clinic') === 12900, 'IV at clinic $129');
  ok(Q('iv:6', 'door') === 71400, '6 standard IVs at location: group $119 each = $714 (owner-approved 2026-11-24)');
  ok(Q('iv:5', 'door') === 79500, '5 IVs: no group rate');
  ok(Q('iv:6', 'clinic') === 6 * 12900, 'group rate not applied at clinic');
  ok(Q('iv:5,nad:1', 'door') === 5 * 15900 + 27900, 'NAD+ never counts toward group');
  ok(Q('nad:6', 'door') === 6 * 27900, '6 NAD+: no discount');
  ok(Q('doc:1', 'door') === 18900 && Q('doc:1', 'clinic') === 9900 && Q('video:1', 'door') === 5900, 'Home Doctor $189 · Walk-in $99 · Video $59');
  ok(L.parseItems('iv:0') === null && L.parseItems('iv:31') === null && L.parseItems('botox:1') === null && L.parseItems('iv:1;x') === null, 'invalid quantities / quote-only services rejected');

  // ---------- signed tokens ----------
  const now = 1795000000;
  const made = L.makeToken({ b: 'pd-261125-abcd', i: 'iv:2,doc:1', w: 'door', hours: 24, l: 'en' }, SECRET, now);
  ok(made && made.p.b === 'PD-261125-ABCD' && made.q.total === 2 * 15900 + 18900, 'staff token created with server price');
  ok(L.verifyToken(made.token, SECRET, now + 60).ok, 'valid token verifies');
  ok(L.verifyToken(made.token, SECRET, now + 25 * 3600).error === 'expired', 'expired token rejected');
  ok(L.verifyToken(made.token, 'another-secret-0123456789abcdefghijkl', now).error === 'bad_token', 'token signed with another secret rejected');
  const [body] = made.token.split('.');
  const forged = Buffer.from(JSON.stringify(Object.assign({}, made.p, { i: 'iv:1' }))).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.' + made.token.split('.')[1];
  ok(L.verifyToken(forged, SECRET, now).error === 'bad_token', 'tampered services (cheaper cart) rejected');
  ok(L.verifyToken(body + '.AAAA', SECRET, now).error === 'bad_token', 'tampered signature rejected');
  ok(L.verifyToken(made.token, '', now).error === 'not_configured', 'no PAY_LINK_SECRET -> payments disabled');
  ok(L.makeToken({ b: 'hack', i: 'iv:1', w: 'door' }, SECRET) === null, 'bad booking code cannot get a token');
  ok(L.makeToken({ b: 'PD-261125-ABCD', i: 'iv:1', w: 'door', hours: 999 }, SECRET, now).p.exp === now + 72 * 3600, 'link validity capped at 72 h');
  // quoted services (X-ray, lab, aesthetics, nurse): amount set by staff inside the signed link
  const xr = L.makeToken({ b: 'PD-261125-XRAY', w: 'door', qx: 'xray', qa: 12500 }, SECRET, now);
  ok(xr && xr.q.total === 12500 && L.verifyToken(xr.token, SECRET, now).q.lines[0].key === 'q_xray', 'staff-quoted X-ray link: $125 from the signed quote');
  ok(L.makeToken({ b: 'PD-261125-XRAY', w: 'door', qx: 'xray', qa: 500 }, SECRET, now) === null && L.makeToken({ b: 'PD-261125-XRAY', w: 'door', qx: 'xray', qa: 900000 }, SECRET, now) === null, 'quoted amount bounded ($10–$5,000)');
  ok(L.makeToken({ b: 'PD-261125-XRAY', w: 'door', qx: 'ultrasound', qa: 12500 }, SECRET, now) === null, 'unknown quoted service type rejected');
  const mix = L.makeToken({ b: 'PD-261125-MIX1', i: 'iv:1', w: 'door', qx: 'nurse', qa: 20000 }, SECRET, now);
  ok(mix && mix.q.total === 15900 + 20000, 'priced + quoted items in one link');
  const xb = xr.token.split('.'); const fp = JSON.parse(Buffer.from(xb[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()); fp.qa = 100;
  const forgedQ = Buffer.from(JSON.stringify(fp)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.' + xb[1];
  ok(L.verifyToken(forgedQ, SECRET, now).error === 'bad_token', 'tampered quoted amount rejected');

  // ---------- /api/paylink (staff only) ----------
  delete process.env.CONCIERGE_KEY; delete process.env.PAY_LINK_SECRET;
  let r = res(); await pl({ method: 'POST', headers: { 'x-concierge-key': STAFF }, body: { b: 'PD-261125-ABCD', i: 'iv:1', w: 'door' } }, r);
  ok(r.statusCode === 503, 'paylink disabled until CONCIERGE_KEY + PAY_LINK_SECRET exist');
  process.env.CONCIERGE_KEY = STAFF; process.env.PAY_LINK_SECRET = SECRET;
  r = res(); await pl({ method: 'POST', headers: { 'x-concierge-key': 'guess' }, body: { b: 'PD-261125-ABCD', i: 'iv:1', w: 'door' } }, r);
  ok(r.statusCode === 401, 'visitor without staff key cannot create a payment link');
  r = res(); await pl({ method: 'POST', headers: { 'x-concierge-key': STAFF, host: 'preview.example' }, body: { b: 'PD-261125-ABCD', i: 'iv:6', w: 'door', hours: 6 } }, r);
  const link = r.j; const tok = new URL(link.url).searchParams.get('t');
  ok(r.statusCode === 200 && link.total === 71400 && /^https:\/\/preview\.example\/pay\/\?t=/.test(link.url), 'staff creates signed link on same host');

  // ---------- /api/checkout ----------
  delete process.env.STRIPE_SECRET_KEY;
  r = res(); await co({ method: 'GET', url: '/api/checkout?t=' + tok, headers: {} }, r);
  ok(r.statusCode === 200 && r.j.total === 71400 && r.j.booking === 'PD-261125-ABCD' && r.j.payments_enabled === false, 'pay page summary comes from server token');
  r = res(); await co({ method: 'POST', headers: {}, body: { t: tok } }, r);
  ok(r.statusCode === 503, 'no Stripe key -> 503, nothing charged');
  r = res(); await co({ method: 'GET', url: '/api/checkout?t=abc.def', headers: {} }, r);
  ok(r.statusCode === 400, 'garbage link -> 400');

  process.env.STRIPE_SECRET_KEY = 'sk_test_FAKE';
  const calls = [];
  let paidAlready = false;
  co.fetch = async (url, opt) => {
    calls.push({ url, opt });
    if (url.includes('/v1/payment_intents/search')) return { ok: true, status: 200, json: async () => ({ data: paidAlready ? [{ id: 'pi_1', status: 'succeeded' }] : [] }) };
    if (url.endsWith('/v1/checkout/sessions')) return { ok: true, status: 200, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_x' }) };
    return { ok: false, status: 404, json: async () => ({}) };
  };
  r = res(); await co({ method: 'POST', headers: { host: 'pharmacydoctors-git-v5.vercel.app' }, body: { t: tok, i: 'iv:1', total: 1 } }, r);
  const create = calls.find(c => c.url.endsWith('/v1/checkout/sessions'));
  const form = decodeURIComponent(create.opt.body);
  ok(r.statusCode === 200 && r.j.url.startsWith('https://checkout.stripe.com/'), 'checkout session created');
  ok(form.includes('line_items[0][price_data][unit_amount]=71400') && form.includes('metadata[expected_total]=71400'), 'amount from signed token, browser fields ignored');
  ok(form.includes('line_items[0][price_data][product_data][name]=PharmacyDoctors service · Booking PD-261125-ABCD') && !/hangover|nad|iv therapy|doctor visit|symptom/i.test(form.replace(/PharmacyDoctors/g, '')), 'no medical detail sent to Stripe');
  const ik1 = create.opt.headers['Idempotency-Key'];
  calls.length = 0; r = res(); await co({ method: 'POST', headers: {}, body: { t: tok } }, r);
  ok(calls.find(c => c.url.endsWith('/v1/checkout/sessions')).opt.headers['Idempotency-Key'] === ik1, 'same link -> same idempotency key (no duplicate sessions)');
  const ex = parseInt(/expires_at=(\d+)/.exec(form)[1], 10), n = Math.floor(Date.now() / 1000);
  ok(ex >= n + 30 * 60 && ex <= n + 24 * 3600, 'Checkout session expiry within Stripe limits and the link validity');
  paidAlready = true; r = res(); await co({ method: 'POST', headers: {}, body: { t: tok } }, r);
  ok(r.statusCode === 409 && r.j.error === 'already_paid', 'already-paid booking cannot be charged twice');
  r = res(); await co({ method: 'GET', url: '/api/checkout?t=' + tok, headers: {} }, r);
  ok(r.j.paid === true, 'pay page shows "already paid"');
  co.fetch = async () => ({ ok: true, status: 200, json: async () => ({ payment_status: 'paid', status: 'complete', amount_total: 15900, currency: 'usd', client_reference_id: 'PD-261125-ABCD', metadata: { expected_total: '15900' } }) });
  r = res(); await co({ method: 'GET', url: '/api/checkout?session_id=cs_test_abcdefghijkl', headers: {} }, r);
  ok(r.j.paid === true && r.j.amount_ok === true, 'success page verifies payment with Stripe (server side)');
  co.fetch = async () => ({ ok: true, status: 200, json: async () => ({ payment_status: 'paid', status: 'complete', amount_total: 100, currency: 'usd', client_reference_id: 'PD-261125-ABCD', metadata: { expected_total: '15900' } }) });
  r = res(); await co({ method: 'GET', url: '/api/checkout?session_id=cs_test_abcdefghijkl', headers: {} }, r);
  ok(r.j.paid === false && r.j.amount_ok === false, 'amount mismatch is never reported as paid');

  // ---------- webhook ----------
  const WS = 'whsec_test_secret';
  const sign = (p, t) => `t=${t},v1=${crypto.createHmac('sha256', WS).update(`${t}.${p}`).digest('hex')}`;
  const t0 = Math.floor(Date.now() / 1000);
  const ev = (type, obj) => JSON.stringify({ id: 'evt_1', type, data: { object: obj } });
  const paid = ev('checkout.session.completed', { id: 'cs_1', client_reference_id: 'PD-261125-ABCD', amount_total: 18900, currency: 'usd', payment_status: 'paid', metadata: { expected_total: '18900' } });
  ok(wh._test.verify(paid, sign(paid, t0), WS) && !wh._test.verify(paid, `t=${t0},v1=${'0'.repeat(64)}`, WS) && !wh._test.verify(paid, sign(paid, t0 - 1000), WS), 'webhook signature: valid ok, forged and replayed rejected');
  process.env.STRIPE_WEBHOOK_SECRET = WS;
  let mails = []; wh.fetch = async (u, o) => { mails.push(JSON.parse(o.body)); return { ok: true }; };
  r = res(); await wh({ method: 'POST', headers: { 'stripe-signature': sign(paid, t0) }, body: paid }, r);
  ok(r.statusCode === 200 && mails[0].subject === 'PAID · Booking PD-261125-ABCD · $189.00 USD' && !('Name' in mails[0]) && !('Notes' in mails[0]), 'paid -> team email without patient data');
  const bad = ev('checkout.session.completed', { client_reference_id: 'PD-261125-ABCD', amount_total: 100, currency: 'usd', payment_status: 'paid', metadata: { expected_total: '18900' } });
  ok(wh._test.classify(JSON.parse(bad)).status.includes('MISMATCH'), 'paid with wrong amount flagged for review');
  ok(wh._test.classify(JSON.parse(ev('checkout.session.completed', { client_reference_id: 'PD-261125-ABCD', payment_status: 'unpaid', amount_total: 100 }))).status.startsWith('PENDING'), 'delayed payment -> PENDING');
  ok(wh._test.classify(JSON.parse(ev('checkout.session.async_payment_failed', { client_reference_id: 'PD-261125-ABCD', amount_total: 100 }))).status === 'PAYMENT FAILED', 'failed delayed payment');
  ok(wh._test.classify(JSON.parse(ev('checkout.session.expired', { client_reference_id: 'PD-261125-ABCD' }))).quiet === true, 'expired session recorded quietly');
  ok(wh._test.classify(JSON.parse(ev('charge.refunded', { amount: 18900, amount_refunded: 18900, description: 'PharmacyDoctors booking PD-261125-ABCD', metadata: {} }))).booking === 'PD-261125-ABCD', 'refund matched to booking');
  wh.fetch = async () => { throw new Error('email down'); };
  r = res(); await wh({ method: 'POST', headers: { 'stripe-signature': sign(paid, t0) }, body: paid }, r);
  ok(r.statusCode === 200 && r.j.emailed === false, 'email failure does not lose the payment (Stripe keeps the record, 200 returned)');
  r = res(); await wh({ method: 'POST', headers: { 'stripe-signature': 'bad' }, body: paid }, r);
  ok(r.statusCode === 400, 'unsigned webhook -> 400');
  console.log(`\n${pass} tests passed`);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
