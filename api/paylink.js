// PharmacyDoctors — staff-only payment link generator (V5.1).
// POST /api/paylink  header "x-concierge-key: <CONCIERGE_KEY>"  body {b, i, w, hours, l}
//   -> {url, total, expires, lines}
// Used by the concierge AFTER confirming availability. Without CONCIERGE_KEY + PAY_LINK_SECRET set in Vercel it is disabled.
'use strict';
const L = require('./_lib/pay.js');

async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return L.send(res, 405, { error: 'method_not_allowed' }); }
  const staffKey = process.env.CONCIERGE_KEY || '';
  const secret = process.env.PAY_LINK_SECRET || '';
  if (staffKey.length < 16 || secret.length < 32) return L.send(res, 503, { error: 'not_configured' });
  if (!L.safeEqual(req.headers['x-concierge-key'], staffKey)) return L.send(res, 401, { error: 'unauthorized' });
  const body = await L.readJson(req);
  const made = L.makeToken({ b: body.b, i: body.i, w: body.w, hours: body.hours, l: body.l }, secret);
  if (!made) return L.send(res, 400, { error: 'bad_request' });
  const url = `${L.originOf(req)}/pay/?t=${made.token}`;
  return L.send(res, 200, { url, booking: made.p.b, total: made.q.total, lines: made.q.lines, expires: made.p.exp });
}

module.exports = handler;
