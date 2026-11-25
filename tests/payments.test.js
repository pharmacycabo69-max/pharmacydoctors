// Unit tests for api/checkout.js and api/stripe-webhook.js — no network, mock fetch, fake keys.
const assert = require('assert');
const crypto = require('crypto');
const root = process.argv[2] || require("path").resolve(__dirname, "..");  // usage: node tests/payments.test.js
const co = require(root + '/api/checkout.js');
const wh = require(root + '/api/stripe-webhook.js');
const { parseItems, quote } = co._test;
let pass = 0; const ok = (c, m) => { assert.ok(c, m); pass++; console.log('PASS', m); };

// pricing
ok(quote(parseItems('iv:1'), 'door').total === 15900, 'IV at door = $159');
ok(quote(parseItems('iv:1'), 'clinic').total === 12900, 'IV at clinic = $129');
ok(quote(parseItems('iv:6'), 'door').total === 6 * 11900, '6 IVs at door = group $119 each');
ok(quote(parseItems('iv:6'), 'clinic').total === 6 * 12900, 'group rate not applied at clinic (mirrors booking.js)');
ok(quote(parseItems('iv:5,nad:1'), 'door').total === 5 * 15900 + 27900, 'NAD+ does not count toward group');
ok(quote(parseItems('nad:1'), 'clinic').total === 27900, 'NAD+ = $279 at clinic too');
ok(quote(parseItems('doc:1'), 'door').total === 18900, 'Doctor at door = $189');
ok(quote(parseItems('doc:1'), 'clinic').total === 9900, 'Doctor at clinic = $99');
ok(quote(parseItems('video:1'), 'door').total === 5900, 'Video = $59');
ok(quote(parseItems('iv:2,doc:1'), 'door').total === 2 * 15900 + 18900, 'mixed cart');
// validation
ok(parseItems('iv:0') === null, 'qty 0 rejected');
ok(parseItems('iv:31') === null, 'qty > 30 rejected');
ok(parseItems('botox:1') === null, 'unknown/quote-only service rejected');
ok(parseItems('iv:1;drop') === null, 'garbage rejected');
ok(quote(parseItems('iv:1'), 'mars') === null, 'bad location rejected');

function mockRes() { return { statusCode: 0, headers: {}, body: '', setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } }; }
(async () => {
  // not configured -> 503 with total, no Stripe call
  delete process.env.STRIPE_SECRET_KEY;
  let called = 0; co.fetch = async () => { called++; return { ok: true, json: async () => ({}) }; };
  let res = mockRes();
  await co({ method: 'POST', headers: { host: 'preview.example' }, body: { b: 'PD-261125-ABCD', i: 'iv:2', w: 'door' } }, res);
  ok(res.statusCode === 503 && JSON.parse(res.body).total === 31800 && called === 0, 'no key -> 503 not_configured, no Stripe call');
  // bad booking code
  res = mockRes();
  await co({ method: 'POST', headers: {}, body: { b: 'hack', i: 'iv:2', w: 'door' } }, res);
  ok(res.statusCode === 400, 'bad booking code -> 400');
  // configured -> correct Stripe request, amount from server table, generic name
  process.env.STRIPE_SECRET_KEY = 'sk_test_FAKE';
  let sent;
  co.fetch = async (url, opt) => { sent = { url, opt }; return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_x' }) }; };
  res = mockRes();
  await co({ method: 'POST', headers: { host: 'pharmacydoctors-git-v5.vercel.app' }, body: { b: 'pd-261125-abcd', i: 'iv:6', w: 'door', amount: 1 } }, res);
  const form = decodeURIComponent(sent.opt.body);
  ok(res.statusCode === 200 && JSON.parse(res.body).url.startsWith('https://checkout.stripe.com/'), 'configured -> returns Checkout URL');
  ok(sent.url === 'https://api.stripe.com/v1/checkout/sessions', 'calls Stripe Checkout Sessions');
  ok(form.includes('line_items[0][price_data][unit_amount]=71400'), 'amount computed server-side (6 x $119 = $714), client amount ignored');
  ok(form.includes('client_reference_id=PD-261125-ABCD'), 'booking code uppercased and attached');
  ok(form.match(/product_data\]\[name\]=([^&]*)/)[1] === 'PharmacyDoctors service · Booking PD-261125-ABCD', 'generic Stripe line item name (no service/health detail)');
  ok(form.includes('success_url=https://pharmacydoctors-git-v5.vercel.app/pay/success/'), 'success URL on same host (works on preview)');
  // GET session status
  co.fetch = async () => ({ ok: true, json: async () => ({ payment_status: 'paid', amount_total: 15900, currency: 'usd', client_reference_id: 'PD-261125-ABCD' }) });
  res = mockRes();
  await co({ method: 'GET', url: '/api/checkout?session_id=cs_test_abcdefghijkl', headers: {} }, res);
  const g = JSON.parse(res.body);
  ok(g.paid === true && g.amount === 15900 && g.booking === 'PD-261125-ABCD', 'GET verifies paid session');

  // webhook signature
  const secret = 'whsec_test_secret';
  const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', client_reference_id: 'PD-261125-ABCD', amount_total: 18900, payment_status: 'paid' } } });
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  ok(wh._test.verify(payload, `t=${t},v1=${sig}`, secret) === true, 'valid Stripe signature accepted');
  ok(wh._test.verify(payload, `t=${t},v1=${'0'.repeat(64)}`, secret) === false, 'forged signature rejected');
  ok(wh._test.verify(payload, `t=${t - 1000},v1=${sig}`, secret) === false, 'old timestamp rejected (replay)');
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  let mail; wh.fetch = async (u, o) => { mail = { u, o }; return { ok: true }; };
  res = mockRes();
  await wh({ method: 'POST', headers: { 'stripe-signature': `t=${t},v1=${sig}` }, body: payload }, res);
  const m = JSON.parse(mail.o.body);
  ok(res.statusCode === 200 && mail.u === 'https://api.web3forms.com/submit' && m.subject === 'PAID · Booking PD-261125-ABCD · $189.00 USD', 'paid event emails the team');
  ok(!('Name' in m) && !('Notes' in m), 'webhook email carries no patient details');
  res = mockRes();
  await wh({ method: 'POST', headers: { 'stripe-signature': 'bad' }, body: payload }, res);
  ok(res.statusCode === 400, 'unsigned webhook -> 400');
  console.log(`\n${pass} tests passed`);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
