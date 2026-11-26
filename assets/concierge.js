/* PharmacyDoctors V5.1 — concierge tool: create a signed payment link AFTER confirming availability.
   The staff key is kept only in this tab (sessionStorage) and sent to /api/paylink; prices come from the server. */
(function () {
  'use strict';
  var root = document.getElementById('cg-app'); if (!root) return;
  var q = new URLSearchParams(location.search);
  function $(id) { return document.getElementById(id); }
  function money(c) { return '$' + (c / 100).toLocaleString('en-US') + ' USD'; }
  var items = {}; (q.get('i') || '').split(',').forEach(function (p) { var m = /^(iv|nad|doc|video):(\d+)$/.exec(p); if (m) items[m[1]] = +m[2]; });
  root.innerHTML =
    '<h2>Create a payment link</h2><p class="v5-note">Only after you have confirmed availability, date, time and price with the guest. Links are signed and expire.</p>'
    + '<form id="cg-form" class="cg-form" autocomplete="off">'
    + '<label>Staff key<input id="cg-key" type="password" required autocomplete="off"></label>'
    + '<label>Booking code<input id="cg-b" required pattern="PD-\\d{6}-[A-Za-z0-9]{3,6}" placeholder="PD-261125-AB12" value="' + (q.get('b') || '').replace(/[^A-Za-z0-9-]/g, '') + '"></label>'
    + '<div class="cg-row"><label>Standard IVs<input id="cg-iv" type="number" min="0" max="30" value="' + (items.iv || 0) + '"></label><label>NAD+<input id="cg-nad" type="number" min="0" max="30" value="' + (items.nad || 0) + '"></label><label>Doctor visits<input id="cg-doc" type="number" min="0" max="30" value="' + (items.doc || 0) + '"></label><label>Video<input id="cg-video" type="number" min="0" max="30" value="' + (items.video || 0) + '"></label></div>'
    + '<div class="cg-row"><label>Quoted service (optional)<select id="cg-qx"><option value="">None</option><option value="xray">X-ray (accepted quote)</option><option value="lab">Laboratory (accepted quote)</option><option value="aes">Aesthetics (after evaluation)</option><option value="nurse">Private nurse (accepted quote)</option></select></label><label>Quoted amount USD (tax incl.)<input id="cg-qa" type="number" min="10" max="5000" step="1" placeholder="e.g. 125"></label></div>'
    + '<div class="cg-row"><label>Location<select id="cg-w"><option value="door">Guest location (hotel / villa / yacht)</option><option value="clinic">Downtown clinic</option></select></label><label>Link valid for<select id="cg-h"><option value="6">6 hours</option><option value="24" selected>24 hours</option><option value="48">48 hours</option><option value="72">72 hours</option></select></label><label>Guest language<select id="cg-l"><option value="en">English</option><option value="es">Español</option></select></label></div>'
    + '<label>Confirmed date &amp; time (for the message)<input id="cg-when" placeholder="Sat, Nov 28 · 10:00 AM"></label>'
    + '<label class="v5-agree"><input type="checkbox" id="cg-ok" required> <span>I confirmed availability, the price and the health questions with the guest.</span></label>'
    + '<button class="btn btn-dark" type="submit">Create secure link</button><p class="v5-msg" id="cg-msg" role="status"></p></form>'
    + '<div id="cg-out" hidden><h3>Link ready</h3><ul class="v5-lines" id="cg-lines"></ul><div class="v5-total"><span>Total</span><span id="cg-total"></span></div><label>Message for the guest<textarea id="cg-text" rows="5" readonly></textarea></label><div class="v5-actions"><button class="btn btn-dark" type="button" id="cg-copy">Copy message</button><a class="btn btn-wa" id="cg-wa" target="_blank" rel="noopener">Open WhatsApp</a></div></div>';
  if (q.get('w') === 'clinic') $('cg-w').value = 'clinic';
  if (q.get('l') === 'es') $('cg-l').value = 'es';
  try { $('cg-key').value = sessionStorage.getItem('pd_cg_key') || ''; } catch (e) {}
  var NAMES = { iv: 'IV therapy', nad: 'NAD+', doc: 'Doctor visit', video: 'Video consultation', q_xray: 'X-ray (quoted)', q_lab: 'Laboratory (quoted)', q_aes: 'Aesthetic treatment (quoted)', q_nurse: 'Private nurse (quoted)' };
  $('cg-form').onsubmit = function (e) {
    e.preventDefault();
    var parts = []; ['iv', 'nad', 'doc', 'video'].forEach(function (k) { var n = parseInt($('cg-' + k).value, 10) || 0; if (n > 0) parts.push(k + ':' + n); });
    var msg = $('cg-msg'); msg.className = 'v5-msg'; msg.textContent = '';
    var qx = $('cg-qx').value, qa = Math.round(parseFloat($('cg-qa').value || '0') * 100);
    if (!parts.length && !qx) { msg.textContent = 'Add at least one priced service, or a quoted service with the accepted amount. Pharmacy orders are not paid here.'; return; }
    if (qx && !(qa >= 1000 && qa <= 500000)) { msg.textContent = 'Enter the accepted quote amount ($10–$5,000).'; return; }
    try { sessionStorage.setItem('pd_cg_key', $('cg-key').value); } catch (e2) {}
    var body = { b: $('cg-b').value.trim().toUpperCase(), i: parts.join(','), w: $('cg-w').value, hours: $('cg-h').value, l: $('cg-l').value };
    if (qx) { body.qx = qx; body.qa = qa; }
    fetch('/api/paylink', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-concierge-key': $('cg-key').value }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (x) {
        if (x.s !== 200) { msg.className = 'v5-msg v5-err'; msg.textContent = x.s === 401 ? 'Wrong staff key.' : x.s === 503 ? 'Payment links are not configured yet (PAY_LINK_SECRET / CONCIERGE_KEY in Vercel).' : 'Check the booking code and services.'; return; }
        var j = x.j, es = body.l === 'es', when = $('cg-when').value.trim();
        $('cg-lines').innerHTML = j.lines.map(function (l) { return '<li><span>' + NAMES[l.key] + (l.qty > 1 ? ' × ' + l.qty : '') + (l.key === 'iv' && l.unit === 11900 ? ' (group rate)' : '') + '</span><b>' + money(l.qty * l.unit) + '</b></li>'; }).join('');
        $('cg-total').textContent = money(j.total) + ' (tax incl.)';
        var text = es
          ? 'Hola, tu reserva ' + j.booking + ' está confirmada' + (when ? ' para ' + when : '') + '. Total: ' + money(j.total) + ' (IVA incluido). Puedes pagar de forma segura aquí: ' + j.url + ' — Política de cancelación: https://www.pharmacydoctors.com/refund-policy/'
          : 'Hi! Your booking ' + j.booking + ' is confirmed' + (when ? ' for ' + when : '') + '. Total: ' + money(j.total) + ' (tax included). You can pay securely here: ' + j.url + ' — Cancellation policy: https://www.pharmacydoctors.com/refund-policy/';
        $('cg-text').value = text; $('cg-wa').href = 'https://wa.me/?text=' + encodeURIComponent(text);
        $('cg-out').hidden = false; msg.textContent = 'Link created. It expires ' + new Date(j.expires * 1000).toLocaleString() + '.';
      }).catch(function () { msg.className = 'v5-msg v5-err'; msg.textContent = 'Connection problem.'; });
  };
  root.addEventListener('click', function (e) { if (e.target && e.target.id === 'cg-copy') { $('cg-text').select(); try { navigator.clipboard.writeText($('cg-text').value); e.target.textContent = 'Copied'; } catch (e3) { document.execCommand('copy'); } } });
})();
