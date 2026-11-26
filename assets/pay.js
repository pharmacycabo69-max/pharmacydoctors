/* PharmacyDoctors V5.1 — pay a CONFIRMED booking. Everything shown here comes from the server (/api/checkout),
   read from a signed link created by our concierge. The browser never sets services or amounts. */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var app = document.getElementById('pay-app'); if (!app) return;
  var ES = q.get('l') === 'es' || (document.documentElement.lang || '').indexOf('es') === 0;
  function t(en, es) { return ES ? es : en; }
  var WA = '526242261023';
  var NAMES = function () { return { iv: t('IV therapy', 'Sueroterapia'), nad: t('NAD+ therapy', 'Terapia NAD+'), doc: t('Doctor visit', 'Consulta médica'), video: t('Video consultation', 'Videoconsulta'), q_xray: t('X-ray (accepted quote)', 'Rayos X (cotización aceptada)'), q_lab: t('Laboratory tests (accepted quote)', 'Laboratorio (cotización aceptada)'), q_aes: t('Aesthetic treatment (after evaluation)', 'Tratamiento estético (tras valoración)'), q_nurse: t('Private nurse (accepted quote)', 'Enfermera privada (cotización aceptada)') }; };
  function money(c) { return '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 }) + ' USD'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wa(msg) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg); }
  function waBtn(msg) { return '<a class="btn btn-wa" href="' + wa(msg) + '" target="_blank" rel="noopener">WhatsApp +52 624 226 1023</a>'; }
  function box(title, text, extra) { app.innerHTML = '<h2>' + title + '</h2><p>' + text + '</p>' + (extra || ''); }

  // ---------- success page: status verified by the server with Stripe ----------
  if (app.getAttribute('data-mode') === 'success') {
    var sid = q.get('session_id') || '';
    box(t('Checking your payment…', 'Verificando tu pago…'), '');
    fetch('/api/checkout?session_id=' + encodeURIComponent(sid)).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.paid) {
        if (typeof window.gtag === 'function') window.gtag('event', 'purchase', { transaction_id: j.booking, value: j.amount / 100, currency: 'USD' });
        app.innerHTML = '<div class="bk-ok" aria-hidden="true">✓</div><h2>' + t('Payment received — thank you', 'Pago recibido — gracias') + '</h2><p>' + t('Booking', 'Reserva') + ' <b>' + esc(j.booking) + '</b> · ' + money(j.amount) + '</p><p>' + t('Stripe emails your receipt. Our team has been notified and will see you at the confirmed time. To change anything, message us.', 'Stripe te envía el recibo por correo. Nuestro equipo ya fue notificado y te vemos a la hora confirmada. Para cualquier cambio, escríbenos.') + '</p>' + waBtn(t('Hi! I just paid booking ', '¡Hola! Acabo de pagar la reserva ') + j.booking);
      } else if (j && (j.status === 'unpaid' || j.status === 'no_payment_required') && j.session_status === 'complete') {
        box(t('Payment processing', 'Pago en proceso'), t('Your bank is still confirming the payment. You will receive the Stripe receipt by email once it is complete.', 'Tu banco aún está confirmando el pago. Recibirás el recibo de Stripe por correo cuando se complete.'), waBtn(t('Hi! My payment is processing for booking ', '¡Hola! Mi pago está en proceso, reserva ') + (j.booking || '')));
      } else {
        box(t('We could not confirm the payment', 'No pudimos confirmar el pago'), t('If you completed it, you will receive the Stripe receipt by email. Otherwise you can try again from your payment link.', 'Si lo completaste, recibirás el recibo de Stripe por correo. Si no, puedes intentarlo de nuevo desde tu enlace de pago.'), waBtn(t('Hi! I need help with my payment.', '¡Hola! Necesito ayuda con mi pago.')));
      }
    }).catch(function () { box(t('Payment status unavailable', 'Estado del pago no disponible'), t('Check your email for the Stripe receipt or message us.', 'Revisa tu correo (recibo de Stripe) o escríbenos.'), waBtn(t('Hi! I need help with my payment.', '¡Hola! Necesito ayuda con mi pago.'))); });
    return;
  }

  // ---------- pay page ----------
  var token = q.get('t') || '';
  if (!token) { box(t('Payment links come from our team', 'Los enlaces de pago los envía nuestro equipo'), t('After we confirm availability, our concierge sends you a secure payment link. Nothing is charged before that.', 'Después de confirmar disponibilidad, nuestro concierge te envía un enlace de pago seguro. No se cobra nada antes.'), waBtn(t('Hi! I would like to book.', '¡Hola! Quiero reservar.'))); return; }
  box(t('Loading your booking…', 'Cargando tu reserva…'), '');
  fetch('/api/checkout?t=' + encodeURIComponent(token)).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); }).then(function (x) {
    var j = x.j || {};
    if (j.lang === 'es') ES = true;
    if (x.s === 410) return box(t('This payment link has expired', 'Este enlace de pago venció'), t('For your security, payment links expire. Message us and we will confirm your booking and send a new one.', 'Por seguridad, los enlaces de pago vencen. Escríbenos y te confirmamos la reserva con un enlace nuevo.'), waBtn(t('Hi! My payment link expired.', '¡Hola! Mi enlace de pago venció.')));
    if (x.s === 503) return box(t('Online payment is being activated', 'El pago en línea se está activando'), t('Message us on WhatsApp and we will help you complete the payment securely.', 'Escríbenos por WhatsApp y te ayudamos a completar el pago de forma segura.'), waBtn(t('Hi! I would like to pay my booking.', '¡Hola! Quiero pagar mi reserva.')));
    if (x.s !== 200) return box(t('This payment link is not valid', 'Este enlace de pago no es válido'), t('Please use the exact link our team sent you, or message us for a new one.', 'Usa el enlace exacto que te envió nuestro equipo, o escríbenos para uno nuevo.'), waBtn(t('Hi! My payment link does not work.', '¡Hola! Mi enlace de pago no funciona.')));
    if (j.paid) return box(t('This booking is already paid', 'Esta reserva ya está pagada'), t('Booking', 'Reserva') + ' <b>' + esc(j.booking) + '</b>. ' + t('Thank you — nothing else to pay.', 'Gracias — no hay nada más que pagar.'), waBtn(t('Hi! Question about booking ', '¡Hola! Pregunta sobre la reserva ') + j.booking));
    var N = NAMES();
    var lines = j.lines.map(function (l) {
      var name = N[l.key] + (l.key === 'iv' && l.unit === 11900 ? t(' (group rate)', ' (tarifa de grupo)') : '') + (l.key === 'doc' ? (j.where === 'door' ? t(' at your location', ' a domicilio') : t(' at the clinic', ' en la clínica')) : '');
      return '<li><span>' + esc(name) + (l.qty > 1 ? ' × ' + l.qty : '') + '</span><b>' + money(l.qty * l.unit) + '</b></li>';
    }).join('');
    var exp = new Date(j.expires * 1000);
    app.innerHTML = '<span class="v5-label">' + t('Confirmed booking', 'Reserva confirmada') + '</span><h2>' + t('Pay securely', 'Pago seguro') + '</h2><p class="v5-note">' + t('Booking', 'Reserva') + ' <b>' + esc(j.booking) + '</b> · ' + (j.where === 'door' ? t('At your location', 'A domicilio') : t('At our downtown clinic', 'En nuestra clínica')) + ' · ' + t('link valid until ', 'enlace válido hasta ') + exp.toLocaleString(ES ? 'es-MX' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) + '</p>'
      + (q.get('cancelled') ? '<p class="v5-msg">' + t('Payment was not completed. You can try again below.', 'El pago no se completó. Puedes intentarlo de nuevo.') + '</p>' : '')
      + '<ul class="v5-lines">' + lines + '</ul><div class="v5-total"><span>' + t('Total', 'Total') + '</span><span>' + money(j.total) + ' <small>' + t('tax incl.', 'IVA incl.') + '</small></span></div>'
      + '<label class="v5-agree"><input type="checkbox" id="pay-agree"> <span>' + t('I agree to the <a href="/refund-policy/" target="_blank">cancellation and refund policy</a>: full refund if I cancel 24 hours or more before the visit, or if PharmacyDoctors cancels.', 'Acepto la <a href="/refund-policy/" target="_blank">política de cancelación y reembolso</a>: reembolso total si cancelo con 24 horas o más de anticipación, o si PharmacyDoctors cancela.') + '</span></label>'
      + '<button class="btn btn-dark" id="pay-go" type="button" disabled>' + t('Pay ', 'Pagar ') + money(j.total) + '</button><p class="v5-msg" id="pay-msg" role="status"></p>'
      + '<p class="v5-secure"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>' + t('Card payment processed by Stripe. We never see or store your card number.', 'Pago con tarjeta procesado por Stripe. Nunca vemos ni guardamos tu tarjeta.') + '</p>';
    var agree = document.getElementById('pay-agree'), go = document.getElementById('pay-go'), msg = document.getElementById('pay-msg');
    if (!j.payments_enabled) { go.disabled = true; agree.disabled = true; msg.innerHTML = t('Online card payment is being activated. Message us and we will help you complete the payment securely.', 'El pago en línea se está activando. Escríbenos y te ayudamos a completar el pago de forma segura.') + ' <a href="' + wa(t('Hi! I would like to pay booking ', '¡Hola! Quiero pagar la reserva ') + j.booking) + '" target="_blank" rel="noopener">WhatsApp</a>'; return; }
    agree.onchange = function () { go.disabled = !agree.checked; };
    go.onclick = function () {
      go.disabled = true; go.textContent = t('Opening secure checkout…', 'Abriendo pago seguro…'); msg.textContent = '';
      fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token }) })
        .then(function (r) { return r.json().then(function (k) { return { s: r.status, j: k }; }, function () { return { s: r.status, j: {} }; }); })
        .then(function (y) {
          if (y.s === 200 && y.j.url) { location.href = y.j.url; return; }
          go.textContent = t('Pay ', 'Pagar ') + money(j.total);
          if (y.s === 409) { msg.textContent = t('This booking is already paid. Thank you!', 'Esta reserva ya está pagada. ¡Gracias!'); return; }
          go.disabled = false; msg.className = 'v5-msg v5-err';
          msg.textContent = y.s === 410 ? t('This link has expired. Message us for a new one.', 'El enlace venció. Escríbenos para uno nuevo.') : t('We could not open the payment. Please try again or message us.', 'No pudimos abrir el pago. Intenta de nuevo o escríbenos.');
        })
        .catch(function () { go.disabled = false; go.textContent = t('Pay ', 'Pagar ') + money(j.total); msg.className = 'v5-msg v5-err'; msg.textContent = t('Connection problem. Please try again.', 'Problema de conexión. Intenta de nuevo.'); });
    };
  }).catch(function () { box(t('Connection problem', 'Problema de conexión'), t('Please reload the page or message us.', 'Recarga la página o escríbenos.'), waBtn(t('Hi! I need help with my payment.', '¡Hola! Necesito ayuda con mi pago.'))); });
})();
