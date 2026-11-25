/* PharmacyDoctors V5 — pay a CONFIRMED booking (100% of the confirmed price). The amount shown here is for display;
   the server (/api/checkout) recomputes it from its own price table. Bilingual via ?l=es. */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var ES = q.get('l') === 'es';
  function t(en, es) { return ES ? es : en; }
  var WA = '526242261023';
  var P = { iv: { door: 159, clinic: 129 }, ivGroup: 119, nad: { door: 279, clinic: 279 }, doc: { door: 189, clinic: 99 }, video: { door: 59, clinic: 59 } };
  var NAMES = { iv: t('IV therapy', 'Sueroterapia'), nad: t('NAD+ therapy', 'Terapia NAD+'), doc: t('Doctor visit', 'Consulta médica'), video: t('Video consultation', 'Videoconsulta') };
  function money(n) { return '$' + n.toLocaleString('en-US') + ' USD'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function parse(i) {
    var out = {}; if (!i || i.length > 80) return null;
    var parts = i.split(','); for (var k = 0; k < parts.length; k++) {
      var m = /^(iv|nad|doc|video):(\d{1,2})$/.exec(parts[k].trim()); if (!m) return null;
      var n = parseInt(m[2], 10); if (n < 1 || n > 30) return null; out[m[1]] = (out[m[1]] || 0) + n;
    }
    return out;
  }
  function lines(items, w) {
    var L = [];
    if (items.iv) { var u = (w === 'door' && items.iv >= 6) ? P.ivGroup : P.iv[w]; L.push([NAMES.iv + (u === P.ivGroup ? t(' (group rate)', ' (tarifa de grupo)') : ''), items.iv, u]); }
    if (items.nad) L.push([NAMES.nad, items.nad, P.nad[w]]);
    if (items.doc) L.push([NAMES.doc + (w === 'door' ? t(' at your location', ' a domicilio') : t(' at the clinic', ' en la clínica')), items.doc, P.doc[w]]);
    if (items.video) L.push([NAMES.video, items.video, P.video[w]]);
    return L;
  }
  function waLink(msg) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg); }
  var app = document.getElementById('pay-app'); if (!app) return;

  // ---------- success page ----------
  if (app.getAttribute('data-mode') === 'success') {
    var b = (q.get('b') || '').toUpperCase(), sid = q.get('session_id') || '';
    var head = '<h2>' + t('Checking your payment…', 'Verificando tu pago…') + '</h2>';
    app.innerHTML = head;
    fetch('/api/checkout?session_id=' + encodeURIComponent(sid)).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.paid) {
        app.innerHTML = '<div class="bk-ok" aria-hidden="true">✓</div><h2>' + t('Payment received — thank you', 'Pago recibido — gracias') + '</h2><p>' + t('Booking', 'Reserva') + ' <b>' + esc(j.booking || b) + '</b> · ' + money(j.amount / 100) + '</p><p>' + t('Your receipt is sent by Stripe to your email. We will see you at the confirmed time. Need to change anything? Message us on WhatsApp.', 'Stripe envía tu recibo a tu correo. Te vemos a la hora confirmada. ¿Necesitas cambiar algo? Escríbenos por WhatsApp.') + '</p><a class="btn btn-wa" href="' + waLink(t('Hi! I just paid booking ', '¡Hola! Acabo de pagar la reserva ') + (j.booking || b)) + '" target="_blank" rel="noopener">WhatsApp</a>';
      } else {
        app.innerHTML = '<h2>' + t('We could not confirm the payment yet', 'Aún no podemos confirmar el pago') + '</h2><p>' + t('If you completed the payment, you will receive the Stripe receipt by email. If not, you can try again from your payment link or pay at the visit.', 'Si completaste el pago, recibirás el recibo de Stripe por correo. Si no, puedes intentarlo de nuevo desde tu enlace o pagar en la visita.') + '</p><a class="btn btn-wa" href="' + waLink(t('Hi! I need help with the payment for booking ', '¡Hola! Necesito ayuda con el pago de la reserva ') + b) + '" target="_blank" rel="noopener">WhatsApp</a>';
      }
    }).catch(function () { app.innerHTML = '<h2>' + t('Payment status unavailable', 'Estado del pago no disponible') + '</h2><p>' + t('Check your email for the Stripe receipt or message us on WhatsApp.', 'Revisa tu correo (recibo de Stripe) o escríbenos por WhatsApp.') + '</p>'; });
    return;
  }

  // ---------- pay page ----------
  var booking = (q.get('b') || '').toUpperCase(), iParam = q.get('i') || '', w = q.get('w') === 'clinic' ? 'clinic' : 'door';
  var items = parse(iParam);
  if (!/^PD-\d{6}-[A-Z0-9]{3,6}$/.test(booking) || !items) {
    app.innerHTML = '<h2>' + t('This payment link is not complete', 'Este enlace de pago no está completo') + '</h2><p>' + t('Payment links are sent by our team after we confirm your booking. If you have not received one, message us.', 'Nuestro equipo envía el enlace de pago después de confirmar tu reserva. Si no lo recibiste, escríbenos.') + '</p><a class="btn btn-wa" href="' + waLink(t('Hi! I need my payment link.', '¡Hola! Necesito mi enlace de pago.')) + '" target="_blank" rel="noopener">WhatsApp</a>';
    return;
  }
  var L = lines(items, w), total = L.reduce(function (s, l) { return s + l[1] * l[2]; }, 0);
  app.innerHTML = '<span class="v5-label">' + t('Confirmed booking', 'Reserva confirmada') + '</span><h2>' + t('Pay securely', 'Pago seguro') + '</h2><p class="v5-note">' + t('Booking', 'Reserva') + ' <b>' + esc(booking) + '</b> · ' + (w === 'door' ? t('At your location', 'A domicilio') : t('At our downtown clinic', 'En nuestra clínica')) + '</p>'
    + (q.get('cancelled') ? '<p class="v5-msg">' + t('Payment was not completed. You can try again below.', 'El pago no se completó. Puedes intentarlo de nuevo.') + '</p>' : '')
    + '<ul class="v5-lines">' + L.map(function (l) { return '<li><span>' + esc(l[0]) + (l[1] > 1 ? ' × ' + l[1] : '') + '</span><b>' + money(l[1] * l[2]) + '</b></li>'; }).join('') + '</ul>'
    + '<div class="v5-total"><span>' + t('Total', 'Total') + '</span><span>' + money(total) + ' <small>' + t('tax incl.', 'IVA incl.') + '</small></span></div>'
    + '<label class="v5-agree"><input type="checkbox" id="pay-agree"> <span>' + t('I agree to the <a href="/refund-policy/" target="_blank">cancellation and refund policy</a>: full refund if I cancel 24 hours or more before the visit, or if PharmacyDoctors cancels.', 'Acepto la <a href="/refund-policy/" target="_blank">política de cancelación y reembolso</a>: reembolso total si cancelo con 24 horas o más de anticipación, o si PharmacyDoctors cancela.') + '</span></label>'
    + '<button class="btn btn-dark" id="pay-go" type="button" disabled>' + t('Pay ', 'Pagar ') + money(total) + '</button>'
    + '<p class="v5-msg" id="pay-msg" role="status"></p>'
    + '<p class="v5-secure"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' + t('Card payment processed by Stripe. We never see or store your card number.', 'Pago con tarjeta procesado por Stripe. Nunca vemos ni guardamos tu tarjeta.') + '</p>';
  var agree = document.getElementById('pay-agree'), go = document.getElementById('pay-go'), msg = document.getElementById('pay-msg');
  agree.onchange = function () { go.disabled = !agree.checked; };
  go.onclick = function () {
    go.disabled = true; go.textContent = t('Opening secure checkout…', 'Abriendo pago seguro…'); msg.textContent = '';
    fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ b: booking, i: iParam, w: w, l: ES ? 'es' : 'en' }) })
      .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }, function () { return { s: r.status, j: {} }; }); })
      .then(function (x) {
        if (x.s === 200 && x.j.url) { location.href = x.j.url; return; }
        go.disabled = false; go.textContent = t('Pay ', 'Pagar ') + money(total);
        if (x.s === 503) msg.innerHTML = t('Online card payment is being activated. You can pay at the visit (card, USD or pesos), or message us and we send you a secure link.', 'El pago en línea se está activando. Puedes pagar en la visita (tarjeta, USD o pesos) o escríbenos y te enviamos un enlace seguro.') + ' <a href="' + waLink(t('Hi! I would like to pay booking ', '¡Hola! Quiero pagar la reserva ') + booking) + '" target="_blank" rel="noopener">WhatsApp</a>';
        else { msg.className = 'v5-msg v5-err'; msg.textContent = t('We could not open the payment. Please try again or message us on WhatsApp.', 'No pudimos abrir el pago. Intenta de nuevo o escríbenos por WhatsApp.'); }
      })
      .catch(function () { go.disabled = false; go.textContent = t('Pay ', 'Pagar ') + money(total); msg.className = 'v5-msg v5-err'; msg.textContent = t('Connection problem. Please try again.', 'Problema de conexión. Intenta de nuevo.'); });
  };
})();
