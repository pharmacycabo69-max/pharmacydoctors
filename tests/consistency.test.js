// Consistency tests (V5.3): one source of truth (assets/pd-data.json) for prices, and no contradictory claims.
// Usage: node tests/consistency.test.js
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = process.argv[2] || path.resolve(__dirname, '..');
const D = JSON.parse(fs.readFileSync(path.join(root, 'assets/pd-data.json'), 'utf8'));
const P = D.prices; const cents = (d) => Math.round(d * 100);
let pass = 0; const ok = (c, m) => { assert.ok(c, m); pass++; console.log('PASS', m); };

// ---- booking.js mirrors the data file ----
const bk = fs.readFileSync(path.join(root, 'assets/booking.js'), 'utf8');
const drips = [...bk.matchAll(/\{ id: '([a-z0-9-]+)', name: '[^']+', door: (\d+), clinic: (\d+)(, noGroup: true)?/g)].map(m => ({ id: m[1], door: cents(+m[2]), clinic: cents(+m[3]), noGroup: !!m[4] }));
ok(drips.length === D.treatments.length, `booking.js lists ${drips.length} drips = ${D.treatments.length} treatments in pd-data.json`);
for (const t of D.treatments) {
  const b = drips.find(d => d.id === t.id); const k = t.kind === 'nad' ? 'nad' : 'iv';
  ok(b && b.door === P[k].door && b.clinic === P[k].clinic && b.noGroup === (t.kind === 'nad'), `booking.js price for ${t.id} matches data file`);
}
const g = /GROUP_MIN = (\d+), GROUP_PRICE = (\d+)/.exec(bk), doc = /DOCTOR = \{ door: (\d+), clinic: (\d+) \}/.exec(bk), vid = /VIDEO = (\d+);/.exec(bk);
ok(+g[1] === P.ivGroup.min && cents(+g[2]) === P.ivGroup.unit, 'group rule matches data file');
ok(cents(+doc[1]) === P.doc.door && cents(+doc[2]) === P.doc.clinic && cents(+vid[1]) === P.video.door, 'doctor / clinic / video prices match data file');

// ---- server uses the data file ----
const lib = require(path.join(root, 'api/_lib/pay.js'));
ok(lib.PRICES.iv.door === P.iv.door && lib.PRICES.nad.door === P.nad.door && lib.PRICES.ivGroup === P.ivGroup.unit, 'server prices come from data file');

// ---- every HTML page ----
const pages = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!['.git', 'docs', 'wp-content', 'wp-includes', 'tools', 'tests', 'node_modules', '.claude', 'concierge', 'pay'].includes(e.name)) walk(p); } else if (e.name === 'index.html') pages.push(p); } })(root);
ok(pages.length > 70, `${pages.length} public pages scanned`);
const allowed = new Set([P.iv.door, P.iv.clinic, P.ivGroup.unit, P.nad.door, P.doc.door, P.doc.clinic, P.video.door].map(c => String(c / 100)));
const aesthetics = new Set(['600', '550', '300', '1500', '180', '170', '350', '1000', '1200']);  // owner-sourced (see PENDING_APPROVALS P1-4)
const banned = [
  [/\$50 deposit|deposit of \$50|anticipo de \$50|\bpay (?:a|the) deposit\b/i, 'deposit'],
  [/(?:by secure card link,? )?or at the visit|o en la visita\b|you pay at the visit|pagas en la visita/i, 'pay at the visit (medical)'],
  [/(?:arrive|arrives|llega|llegan)[^.<]{0,30}\b(?:30|20|15)\s?(?:–|-|&ndash;| to | a )\s?(?:45|60|30) ?min/i, 'arrival-time promise'],
  [/open 24 hours(?! in Cabo?)|abierto las 24 horas|open now<|abierto ahora</i, 'physical 24h claim'],
  [/(?:confirm|respond|reply)[^.<]{0,20}(?:with)?in minutes/i, 'response-time promise'],
  [/board.certified|cofepris/i, 'unverified credential claim'],
  [/\bultrasound\b(?! , CT or MRI\?)(?!, CT or MRI)/i, 'ultrasound (not offered)'],
];
let schemaBad = [], textBad = [], cardBad = [];
for (const f of pages) {
  const s = fs.readFileSync(f, 'utf8'); const rel = path.relative(root, f);
  for (const m of s.matchAll(/"price":"?(\d+(?:\.\d+)?)"?/g)) if (!allowed.has(m[1]) && !(rel.startsWith('aesthetic') && aesthetics.has(m[1]))) schemaBad.push(`${rel}: price ${m[1]}`);
  const vis = s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
  for (const [re, what] of banned) { const m = re.exec(vis); if (m && !/Do you offer ultrasound/.test(vis.slice(Math.max(0, m.index - 40), m.index + 40))) textBad.push(`${rel}: ${what} -> "${vis.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, ' ')}"`); }
  for (const m of s.matchAll(/<article class="tx" data-id="([a-z0-9-]+)" data-kind="(iv|nad)"[^>]*data-door="(\d+)" data-clinic="(\d+)"/g)) { const k = m[2]; if (+m[3] !== P[k].door || +m[4] !== P[k].clinic) cardBad.push(`${rel}: card ${m[1]}`); }
}
if (schemaBad.length) console.log(schemaBad.join('\n'));
ok(schemaBad.length === 0, 'structured-data prices only use approved prices');
if (cardBad.length) console.log(cardBad.join('\n'));
ok(cardBad.length === 0, 'catalog cards carry data-file prices');
if (textBad.length) console.log(textBad.slice(0, 20).join('\n'));
ok(textBad.length === 0, 'no deposits, pay-at-visit, arrival/response promises, 24h physical claims, unverified credentials or ultrasound in visible text');
console.log(`\n${pass} tests passed`);
