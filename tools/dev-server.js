// Local dev server for PharmacyDoctors: static files + /api/* functions.
// MOCK_STRIPE=1 adds an in-process FAKE Stripe (clearly labelled) so the full flow can be clicked through locally.
// Nothing here talks to real Stripe; Web3Forms calls are intercepted and only logged. Never deployed (.vercelignore).
// Usage: node tools/dev-server.js 8081            (real Stripe test keys from env if you set them)
//        MOCK_STRIPE=1 node tools/dev-server.js 8081
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.argv[2] || process.env.PORT || '8081', 10);
const MOCK = process.env.MOCK_STRIPE === '1' || process.argv.includes('--mock');
if (MOCK) {
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_LOCALMOCKONLY';
  process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_LOCALMOCKONLY';
  process.env.STRIPE_API_BASE = `http://localhost:${PORT}/__mock_stripe`;
}
process.env.PAY_LINK_SECRET = process.env.PAY_LINK_SECRET || 'local-dev-pay-link-secret-0123456789abcdef';
process.env.CONCIERGE_KEY = process.env.CONCIERGE_KEY || 'local-dev-staff-key';

// Intercept outgoing emails in dev: log instead of sending.
const realFetch = global.fetch;
const LOG = [];
global.fetch = async (url, opts) => {
  if (String(url).includes('api.web3forms.com')) { const b = JSON.parse(opts.body); delete b.access_key; LOG.push({ at: new Date().toISOString(), email: b }); console.log('[dev] email intercepted:', b.subject); return new Response('{"success":true}', { status: 200 }); }
  return realFetch(url, opts);
};

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };

// ---------------- fake Stripe (only with MOCK_STRIPE=1) ----------------
const S = { sessions: {}, pis: [], idem: {} };
function parseForm(s) { const o = {}; for (const kv of String(s || '').split('&')) { if (!kv) continue; const [k, v] = kv.split('='); o[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' ')); } return o; }
function json(res, code, o) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); }
async function sendWebhook(type, obj) {
  const evt = JSON.stringify({ id: 'evt_mock_' + crypto.randomBytes(6).toString('hex'), type, data: { object: obj } });
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(`${t}.${evt}`).digest('hex');
  const r = await realFetch(`http://localhost:${PORT}/api/stripe-webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': `t=${t},v1=${sig}` }, body: evt });
  console.log('[mock stripe] webhook', type, '->', r.status, await r.text());
}
async function mockStripe(req, res, u, body) {
  const p = u.pathname.replace('/__mock_stripe', '');
  if (req.method === 'POST' && p === '/v1/checkout/sessions') {
    const key = req.headers['idempotency-key'];
    if (key && S.idem[key]) return json(res, 200, S.sessions[S.idem[key]]);
    const f = parseForm(body); const id = 'cs_test_mock' + crypto.randomBytes(8).toString('hex');
    S.sessions[id] = { id, object: 'checkout.session', url: `http://localhost:${PORT}/__mock_stripe/checkout/${id}`, amount_total: +f['line_items[0][price_data][unit_amount]'], currency: f['line_items[0][price_data][currency]'], client_reference_id: f.client_reference_id, metadata: { booking: f['metadata[booking]'], expected_total: f['metadata[expected_total]'], link_id: f['metadata[link_id]'] }, payment_status: 'unpaid', status: 'open', success_url: f.success_url, cancel_url: f.cancel_url, name: f['line_items[0][price_data][product_data][name]'] };
    if (key) S.idem[key] = id;
    console.log('[mock stripe] session created', id, S.sessions[id].amount_total, 'cents for', f.client_reference_id, '| line item:', S.sessions[id].name);
    return json(res, 200, S.sessions[id]);
  }
  let m;
  if (req.method === 'GET' && (m = /^\/v1\/checkout\/sessions\/(cs_[A-Za-z0-9_]+)$/.exec(p))) return S.sessions[m[1]] ? json(res, 200, S.sessions[m[1]]) : json(res, 404, { error: { message: 'No such session' } });
  if (req.method === 'GET' && p === '/v1/payment_intents/search') {
    const q = u.searchParams.get('query') || ''; const b = (/metadata\['booking'\]:'([^']+)'/.exec(q) || [])[1];
    return json(res, 200, { data: S.pis.filter(x => x.metadata.booking === b && x.status === 'succeeded') });
  }
  if ((m = /^\/checkout\/(cs_[A-Za-z0-9_]+)(\/(pay|cancel|fail))?$/.exec(p))) {
    const s = S.sessions[m[1]]; if (!s) { res.writeHead(404); return res.end('no session'); }
    if (m[3] === 'pay') {
      s.payment_status = 'paid'; s.status = 'complete';
      S.pis.push({ id: 'pi_mock_' + crypto.randomBytes(6).toString('hex'), status: 'succeeded', amount: s.amount_total, metadata: { booking: s.metadata.booking, expected_total: s.metadata.expected_total } });
      await sendWebhook('checkout.session.completed', s);
      res.writeHead(303, { Location: s.success_url.replace('{CHECKOUT_SESSION_ID}', s.id) }); return res.end();
    }
    if (m[3] === 'fail') { s.status = 'complete'; s.payment_status = 'unpaid'; await sendWebhook('checkout.session.async_payment_failed', s); res.writeHead(303, { Location: s.cancel_url }); return res.end(); }
    if (m[3] === 'cancel') { res.writeHead(303, { Location: s.cancel_url }); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>MOCK Stripe Checkout</title><body style="font-family:system-ui;max-width:520px;margin:40px auto;padding:0 16px"><p style="background:#fde68a;padding:10px;border-radius:8px"><b>LOCAL SIMULATION — not Stripe.</b> No card, no charge.</p><h1>Checkout</h1><p>${s.name}</p><p style="font-size:2rem">$${(s.amount_total / 100).toFixed(2)} ${s.currency.toUpperCase()}</p><p><a id="mock-pay" href="/__mock_stripe/checkout/${s.id}/pay">Simulate successful payment</a></p><p><a id="mock-fail" href="/__mock_stripe/checkout/${s.id}/fail">Simulate failed delayed payment</a></p><p><a id="mock-cancel" href="/__mock_stripe/checkout/${s.id}/cancel">Back (cancel)</a></p></body>`);
  }
  if (p === '/__log') return json(res, 200, { emails: LOG, sessions: Object.values(S.sessions).map(s => ({ id: s.id, booking: s.client_reference_id, amount: s.amount_total, paid: s.payment_status })) });
  if (req.method === 'POST' && (m = /^\/refund\/(PD-[A-Z0-9-]+)$/.exec(p))) {
    const pi = S.pis.find(x => x.metadata.booking === m[1]); if (!pi) return json(res, 404, {});
    await sendWebhook('charge.refunded', { id: 'ch_mock', amount: pi.amount, amount_refunded: pi.amount, description: `PharmacyDoctors booking ${m[1]}`, metadata: {} });
    return json(res, 200, { refunded: true });
  }
  json(res, 404, { error: { message: 'mock: unknown ' + p } });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  let body = '';
  if (req.method === 'POST') { for await (const c of req) body += c; }
  try {
    if (MOCK && u.pathname.startsWith('/__mock_stripe')) return await mockStripe(req, res, u, body);
    if (u.pathname === '/__mock_stripe/__log') return json(res, 200, { emails: LOG });
    const am = /^\/api\/([a-z-]+)\/?$/.exec(u.pathname);
    if (am) {
      const file = path.join(ROOT, 'api', am[1] + '.js');
      if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
      delete require.cache[require.resolve(file)];
      const h = require(file);
      req.body = body ? (req.headers['content-type'] || '').includes('json') && am[1] !== 'stripe-webhook' ? JSON.parse(body) : body : undefined;
      return await h(req, res);
    }
    let f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end(fs.existsSync(path.join(ROOT, '404.html')) ? fs.readFileSync(path.join(ROOT, '404.html')) : 'Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  } catch (e) { console.error(e); res.writeHead(500); res.end('dev error'); }
});
server.listen(PORT, () => console.log(`PharmacyDoctors dev server on http://localhost:${PORT}/ ${MOCK ? '(MOCK STRIPE — simulation)' : ''}`));
