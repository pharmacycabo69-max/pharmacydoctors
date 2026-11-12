/* PharmacyDoctors.com online booking: catalog + cart + calendar + details -> email (FormSubmit) + WhatsApp.
   No payment is taken. Prices mirror /prices/. Language from <html lang>. */
(function () {
  'use strict';
  var ORDER_EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/cmccompanydental@gmail.com';
  var WA = '526242261023';
  var ES = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
  function t(en, es) { return ES ? es : en; }

  var DRIPS = [
    { id: 'rapid-hydration', name: 'Rapid Hydration', door: 159, clinic: 129, tag: t('Hydration', 'Hidratación'), desc: t('Fluids + electrolytes for sun, heat and travel.', 'Líquidos y electrolitos para sol, calor y viaje.') },
    { id: 'hangover-rescue', name: 'Hangover Rescue', door: 189.99, clinic: 159, tag: t('Recovery', 'Recuperación'), desc: t('Rehydration, vitamins and anti-nausea support.', 'Rehidratación, vitaminas y apoyo contra la náusea.') },
    { id: 'myers-cocktail', name: 'Myers Cocktail', door: 189.99, clinic: 159, tag: t('Wellness', 'Bienestar'), desc: t('The classic vitamin & mineral wellness drip.', 'El suero clásico de vitaminas y minerales.') },
    { id: 'immunity-armor', name: 'Immunity Armor', door: 179.99, clinic: 149, tag: t('Immunity', 'Inmunidad'), desc: t('High-dose vitamin C, zinc and antioxidants.', 'Vitamina C en dosis alta, zinc y antioxidantes.') },
    { id: 'energy-b12', name: 'Energy & B12', door: 179.99, clinic: 149, tag: t('Energy', 'Energía'), desc: t('B-complex recharge for jet lag and fatigue.', 'Complejo B para jet lag y cansancio.') },
    { id: 'performance-recovery', name: 'Performance & Recovery', door: 179.99, clinic: 149, tag: t('Athletic', 'Deportivo'), desc: t('Recover after golf, fishing or training.', 'Recuperación después de golf, pesca o ejercicio.') },
    { id: 'beauty-glow', name: 'Beauty Glow', door: 179.99, clinic: 149, tag: t('Beauty', 'Belleza'), desc: t('Hydration with antioxidants for your skin.', 'Hidratación con antioxidantes para la piel.') }
  ];
  var GROUP_MIN = 6, GROUP_PRICE = 119;
  var DOCTOR = { door: 199, clinic: 99 };
  var AREAS = ['Cabo San Lucas (downtown / Medano / Marina)', 'Pedregal', 'Tourist Corridor (Cabo Real, Chileno, Palmilla)', 'San José del Cabo', 'Puerto Los Cabos / Costa Azul', t('Other (tell us below)', 'Otra (indícala abajo)')];

  var state = { where: 'door', qty: {}, doctor: false, pharmacy: false, nurse: false, pharmacyList: '', date: null, time: '', step: 1 };
  DRIPS.forEach(function (d) { state.qty[d.id] = 0; });

  // ---------- helpers ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); } if (html != null) e.innerHTML = html; return e; }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function totalIV() { var n = 0; for (var k in state.qty) n += state.qty[k]; return n; }
  function isGroup() { return totalIV() >= GROUP_MIN && state.where === 'door'; }
  function lines() {
    var out = [], group = isGroup();
    DRIPS.forEach(function (d) {
      var q = state.qty[d.id]; if (!q) return;
      var unit = group ? GROUP_PRICE : (state.where === 'door' ? d.door : d.clinic);
      out.push({ label: d.name + ' IV × ' + q, unit: unit, amount: unit * q, note: group ? t('group rate, tax incl.', 'precio de grupo, IVA incl.') : t('+ tax', '+ IVA') });
    });
    if (state.doctor) out.push({ label: t('Doctor visit', 'Consulta médica') + (state.where === 'door' ? t(' at your location', ' a domicilio') : t(' at the clinic', ' en la clínica')), unit: DOCTOR[state.where], amount: DOCTOR[state.where], note: '' });
    if (state.pharmacy) out.push({ label: t('Pharmacy delivery', 'Farmacia a domicilio'), unit: 0, amount: 0, note: t('items priced on confirmation · free delivery over $50', 'productos se cotizan al confirmar · envío gratis desde $50') });
    if (state.nurse) out.push({ label: t('Private nurse', 'Enfermera privada'), unit: 0, amount: 0, note: t('quoted on confirmation', 'se cotiza al confirmar') });
    return out;
  }
  function total() { return lines().reduce(function (s, l) { return s + l.amount; }, 0); }
  function hasItems() { return totalIV() > 0 || state.doctor || state.pharmacy || state.nurse; }

  // ---------- render ----------
  var root;
  function render() {
    root.innerHTML = '';
    var steps = [t('Choose', 'Elige'), t('Date & time', 'Fecha y hora'), t('Your details', 'Tus datos'), t('Confirm', 'Confirmar')];
    var prog = el('ol', { class: 'bk-steps', 'aria-label': t('Booking steps', 'Pasos de la reserva') });
    steps.forEach(function (s, i) { prog.appendChild(el('li', { class: (i + 1 === state.step ? 'on' : '') + (i + 1 < state.step ? ' done' : '') }, '<span>' + (i + 1) + '</span>' + s)); });
    root.appendChild(prog);
    var grid = el('div', { class: 'bk-grid' });
    var main = el('div', { class: 'bk-main' });
    var side = el('aside', { class: 'bk-side', 'aria-label': t('Your booking', 'Tu reserva') });
    grid.appendChild(main); grid.appendChild(side); root.appendChild(grid);
    [stepChoose, stepDate, stepDetails, stepReview][state.step - 1](main);
    renderSummary(side);
    if (lastStep !== null && lastStep !== state.step) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    lastStep = state.step;
  }
  var lastStep = null;

  function renderSummary(side) {
    var ls = lines();
    var h = '<h3>' + t('Your booking', 'Tu reserva') + '</h3>';
    h += '<div class="bk-where">' + (state.where === 'door' ? t('At your hotel, villa or yacht', 'En tu hotel, villa o yate') : t('At our downtown clinic', 'En nuestra clínica del centro')) + '</div>';
    if (!ls.length) h += '<p class="bk-empty">' + t('Nothing selected yet.', 'Aún no seleccionas nada.') + '</p>';
    else h += '<ul class="bk-lines">' + ls.map(function (l) { return '<li><span>' + esc(l.label) + (l.note ? '<small>' + esc(l.note) + '</small>' : '') + '</span><b>' + (l.amount ? money(l.amount) : '—') + '</b></li>'; }).join('') + '</ul>';
    if (state.date) h += '<div class="bk-when">📅 ' + fmtDate(state.date) + (state.time ? ' · ' + esc(state.time) : '') + '</div>';
    var tot = total();
    if (tot) h += '<div class="bk-total"><span>' + t('Estimated total', 'Total estimado') + '</span><b>' + money(tot) + ' USD</b></div><p class="bk-fine">' + (isGroup() ? t('Group rate includes tax.', 'El precio de grupo incluye IVA.') : t('Individual IV prices are plus tax.', 'Los sueros individuales son más IVA.')) + ' ' + t('No payment now — you pay at the visit.', 'No pagas ahora — pagas en la visita.') + '</p>';
    var left = GROUP_MIN - totalIV();
    if (state.where === 'door' && totalIV() > 0 && left > 0) h += '<div class="bk-nudge">👥 ' + t('Add ' + left + ' more IV' + (left > 1 ? 's' : '') + ' and everyone pays $119 (tax incl.)', 'Agrega ' + left + ' suero' + (left > 1 ? 's' : '') + ' más y todos pagan $119 (IVA incl.)') + '</div>';
    if (isGroup()) h += '<div class="bk-nudge ok">🎉 ' + t('Group rate applied: $119 per person, tax included', 'Precio de grupo aplicado: $119 por persona, IVA incluido') + '</div>';
    side.innerHTML = h;
  }

  function navButtons(main, canNext, nextLabel, onNext) {
    var row = el('div', { class: 'bk-nav' });
    if (state.step > 1) { var b = el('button', { type: 'button', class: 'bk-back' }, '← ' + t('Back', 'Atrás')); b.onclick = function () { state.step--; render(); }; row.appendChild(b); }
    var n = el('button', { type: 'button', class: 'bk-next' + (canNext ? '' : ' off') }, nextLabel);
    n.onclick = function () { if (!canNext) { var m = $('.bk-msg', main); if (m) { m.style.display = 'block'; } return; } onNext(); };
    row.appendChild(n); main.appendChild(row);
  }

  // Step 1: catalog
  function stepChoose(main) {
    main.appendChild(el('h2', {}, t('What would you like?', '¿Qué necesitas?')));
    var tog = el('div', { class: 'bk-toggle', role: 'radiogroup' });
    [['door', t('At my hotel / villa / yacht', 'En mi hotel / villa / yate')], ['clinic', t('At your downtown clinic', 'En su clínica del centro')]].forEach(function (o) {
      var b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(state.where === o[0]), class: state.where === o[0] ? 'on' : '' }, o[1]);
      b.onclick = function () { state.where = o[0]; render(); }; tog.appendChild(b);
    });
    main.appendChild(tog);
    main.appendChild(el('h3', { class: 'bk-h' }, t('IV drips', 'Sueros') + ' <small>' + t('one per person', 'uno por persona') + '</small>'));
    var cat = el('div', { class: 'bk-cat' });
    DRIPS.forEach(function (d) {
      var q = state.qty[d.id], price = isGroup() ? GROUP_PRICE : (state.where === 'door' ? d.door : d.clinic);
      var c = el('div', { class: 'bk-item' + (q ? ' sel' : '') });
      c.innerHTML = '<div class="bk-item-t"><span class="bk-tag">' + d.tag + '</span><b>' + esc(d.name) + '</b><small>' + esc(d.desc) + '</small></div>'
        + '<div class="bk-item-p"><b>' + money(price) + '</b><small>' + (isGroup() ? t('tax incl.', 'IVA incl.') : t('+ tax', '+ IVA')) + '</small></div>'
        + '<div class="bk-qty"><button type="button" aria-label="' + t('Remove one', 'Quitar uno') + ' ' + esc(d.name) + '">−</button><span aria-live="polite">' + q + '</span><button type="button" aria-label="' + t('Add one', 'Agregar uno') + ' ' + esc(d.name) + '">+</button></div>';
      var bs = c.querySelectorAll('button');
      bs[0].onclick = function () { if (state.qty[d.id] > 0) { state.qty[d.id]--; render(); } };
      bs[1].onclick = function () { if (state.qty[d.id] < 30) { state.qty[d.id]++; render(); } };
      cat.appendChild(c);
    });
    main.appendChild(cat);
    main.appendChild(el('h3', { class: 'bk-h' }, t('Doctors, pharmacy & nursing', 'Doctor, farmacia y enfermería')));
    var ex = el('div', { class: 'bk-extras' });
    [['doctor', t('Doctor visit', 'Consulta médica'), money(DOCTOR[state.where]) + ' USD', t('English-speaking doctor, 24/7', 'Doctor bilingüe, 24/7')],
     ['pharmacy', t('Pharmacy delivery', 'Farmacia a domicilio'), t('Free over $50', 'Gratis desde $50'), t('Medications & essentials to your room', 'Medicinas y productos a tu habitación')],
     ['nurse', t('Private nurse', 'Enfermera privada'), t('Quote', 'Cotización'), t('Wound care, injections, monitoring', 'Curaciones, inyecciones, monitoreo')]].forEach(function (o) {
      var lab = el('label', { class: 'bk-check' + (state[o[0]] ? ' sel' : '') });
      lab.innerHTML = '<input type="checkbox"' + (state[o[0]] ? ' checked' : '') + '><span><b>' + o[1] + '</b><small>' + o[3] + '</small></span><em>' + o[2] + '</em>';
      lab.querySelector('input').onchange = function (e) { state[o[0]] = e.target.checked; render(); };
      ex.appendChild(lab);
    });
    main.appendChild(ex);
    if (state.pharmacy) {
      var ta = el('textarea', { class: 'bk-in', rows: '3', placeholder: t('What do you need from the pharmacy? (product names, or say you will send a prescription photo)', '¿Qué necesitas de la farmacia? (productos, o di que mandarás foto de la receta)') });
      ta.value = state.pharmacyList; ta.oninput = function () { state.pharmacyList = ta.value; }; main.appendChild(ta);
    }
    main.appendChild(el('p', { class: 'bk-msg' }, t('Choose at least one service to continue.', 'Elige al menos un servicio para continuar.')));
    navButtons(main, hasItems(), t('Choose date & time →', 'Elegir fecha y hora →'), function () { state.step = 2; render(); });
  }

  // Step 2: calendar
  var viewMonth = null;
  function fmtDate(d) { return d.toLocaleDateString(ES ? 'es-MX' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function stepDate(main) {
    main.appendChild(el('h2', {}, t('When should we come?', '¿Cuándo vamos?')));
    main.appendChild(el('p', { class: 'bk-sub' }, t('We work 24/7. Times are Cabo time (Mountain Time, same as Denver/Phoenix). Same-day visits usually arrive in 30–45 minutes.', 'Atendemos 24/7. Horario de Los Cabos. Las visitas del mismo día suelen llegar en 30–45 minutos.')));
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var max = new Date(today); max.setDate(max.getDate() + 90);
    if (!viewMonth) viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    var cal = el('div', { class: 'bk-cal' });
    var head = el('div', { class: 'bk-cal-h' });
    var prev = el('button', { type: 'button', 'aria-label': t('Previous month', 'Mes anterior') }, '‹'), next = el('button', { type: 'button', 'aria-label': t('Next month', 'Mes siguiente') }, '›');
    var title = el('b', {}, viewMonth.toLocaleDateString(ES ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' }));
    prev.disabled = viewMonth <= new Date(today.getFullYear(), today.getMonth(), 1);
    next.disabled = viewMonth >= new Date(max.getFullYear(), max.getMonth(), 1);
    prev.onclick = function () { viewMonth.setMonth(viewMonth.getMonth() - 1); render(); };
    next.onclick = function () { viewMonth.setMonth(viewMonth.getMonth() + 1); render(); };
    head.appendChild(prev); head.appendChild(title); head.appendChild(next); cal.appendChild(head);
    var gridc = el('div', { class: 'bk-cal-g', role: 'grid' });
    (ES ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).forEach(function (w) { gridc.appendChild(el('span', { class: 'bk-dow' }, w)); });
    var first = new Date(viewMonth), offset = (first.getDay() + 6) % 7;
    for (var i = 0; i < offset; i++) gridc.appendChild(el('span', {}));
    var dim = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    for (var dd = 1; dd <= dim; dd++) {
      (function (day) {
        var d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        var off = d < today || d > max;
        var b = el('button', { type: 'button', class: (sameDay(d, state.date) ? 'on' : '') + (sameDay(d, today) ? ' today' : ''), 'aria-label': fmtDate(d) }, String(day));
        if (off) b.disabled = true;
        b.onclick = function () { state.date = d; state.time = ''; render(); };
        gridc.appendChild(b);
      })(dd);
    }
    cal.appendChild(gridc); main.appendChild(cal);
    if (state.date) {
      main.appendChild(el('h3', { class: 'bk-h' }, t('Choose a time', 'Elige la hora')));
      var slots = el('div', { class: 'bk-slots' });
      var now = new Date(), isToday = sameDay(state.date, now);
      var opts = [];
      if (isToday) opts.push(t('As soon as possible (30–45 min)', 'Lo antes posible (30–45 min)'));
      for (var hi = 0; hi < 24; hi++) for (var mm = 0; mm < 60; mm += 30) {
        var hh = (hi + 7) % 24;   // list starts at 7:00 AM, late-night slots at the end
        if (isToday && hh < 7) continue;
        if (isToday && (hh * 60 + mm) < now.getHours() * 60 + now.getMinutes() + 60) continue;
        var dt = new Date(2000, 0, 1, hh, mm);
        opts.push(dt.toLocaleTimeString(ES ? 'es-MX' : 'en-US', { hour: 'numeric', minute: '2-digit' }));
      }
      opts.forEach(function (o) { var b = el('button', { type: 'button', class: state.time === o ? 'on' : '' }, o); b.onclick = function () { state.time = o; render(); }; slots.appendChild(b); });
      main.appendChild(slots);
    }
    main.appendChild(el('p', { class: 'bk-msg' }, t('Pick a date and a time.', 'Elige fecha y hora.')));
    navButtons(main, !!(state.date && state.time), t('Your details →', 'Tus datos →'), function () { state.step = 3; render(); });
  }

  // Step 3: details
  var form = { name: '', email: '', phone: '', area: '', address: '', people: '', notes: '' };
  function stepDetails(main) {
    main.appendChild(el('h2', {}, t('Where and who?', '¿Dónde y quién?')));
    var f = el('div', { class: 'bk-form' });
    function field(key, label, type, ph, req, opts) {
      var w = el('label', { class: 'bk-f' }); w.appendChild(el('span', {}, label + (req ? ' *' : '')));
      var inp;
      if (opts) { inp = el('select', { class: 'bk-in' }); inp.appendChild(el('option', { value: '' }, t('Select…', 'Selecciona…'))); opts.forEach(function (o) { var op = el('option', { value: o }, o); if (form[key] === o) op.selected = true; inp.appendChild(op); }); }
      else if (type === 'textarea') { inp = el('textarea', { class: 'bk-in', rows: '3', placeholder: ph || '' }); }
      else { inp = el('input', { class: 'bk-in', type: type, placeholder: ph || '', autocomplete: { name: 'name', email: 'email', phone: 'tel' }[key] || 'off' }); }
      if (!opts) inp.value = form[key];
      inp.oninput = inp.onchange = function () { form[key] = inp.value; };
      w.appendChild(inp); f.appendChild(w); return inp;
    }
    field('name', t('Full name', 'Nombre completo'), 'text', '', true);
    field('phone', t('Phone / WhatsApp (with country code)', 'Teléfono / WhatsApp (con lada)'), 'tel', '+1 555 123 4567', true);
    field('email', t('Email', 'Correo'), 'email', 'you@example.com', true);
    if (state.where === 'door') {
      field('area', t('Area', 'Zona'), '', '', true, AREAS);
      field('address', t('Hotel & room, villa address or yacht slip', 'Hotel y habitación, dirección de la villa o muelle del yate'), 'text', '', true);
    }
    field('notes', t('Anything we should know? (symptoms, allergies, medications, group details)', '¿Algo que debamos saber? (síntomas, alergias, medicamentos, detalles del grupo)'), 'textarea', '', false);
    main.appendChild(f);
    main.appendChild(el('p', { class: 'bk-msg' }, t('Please fill in the required fields (*) with a valid email and phone.', 'Llena los campos obligatorios (*) con correo y teléfono válidos.')));
    navButtons(main, true, t('Review booking →', 'Revisar reserva →'), function () {
      var ok = form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.phone.replace(/\D/g, '').length >= 8 && (state.where !== 'door' || (form.area && form.address.trim()));
      if (!ok) { $('.bk-msg', main).style.display = 'block'; return; }
      state.step = 4; render();
    });
  }

  // Step 4: review + submit
  var orderId = null;
  function summaryText() {
    var L = lines().map(function (l) { return '• ' + l.label + (l.amount ? ' — ' + money(l.amount) : '') + (l.note ? ' (' + l.note + ')' : ''); }).join('\n');
    return [
      t('Booking', 'Reserva') + ' ' + orderId,
      t('Where', 'Dónde') + ': ' + (state.where === 'door' ? (form.area + ' — ' + form.address) : t('Downtown clinic', 'Clínica del centro')),
      t('When', 'Cuándo') + ': ' + fmtDate(state.date) + ' · ' + state.time,
      L,
      state.pharmacy && state.pharmacyList ? t('Pharmacy list', 'Lista de farmacia') + ': ' + state.pharmacyList : '',
      t('Estimated total', 'Total estimado') + ': ' + money(total()) + ' USD ' + (isGroup() ? t('(tax incl.)', '(IVA incl.)') : t('(+ tax on IVs)', '(+ IVA en sueros)')),
      t('Name', 'Nombre') + ': ' + form.name, t('Phone', 'Teléfono') + ': ' + form.phone, 'Email: ' + form.email,
      form.notes ? t('Notes', 'Notas') + ': ' + form.notes : ''
    ].filter(Boolean).join('\n');
  }
  function stepReview(main) {
    if (!orderId) { var d = new Date(); orderId = 'PD-' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
    main.appendChild(el('h2', {}, t('Review and send', 'Revisa y envía')));
    var pre = el('div', { class: 'bk-review' }); pre.textContent = summaryText(); main.appendChild(pre);
    main.appendChild(el('ul', { class: 'bk-assure' }, '<li>' + t('No payment now — you pay at the visit (card, USD or pesos).', 'No pagas ahora — pagas en la visita (tarjeta, USD o pesos).') + '</li><li>' + t('We confirm by WhatsApp or phone, usually within minutes.', 'Te confirmamos por WhatsApp o llamada, normalmente en minutos.') + '</li><li>' + t('Licensed, COFEPRIS-authorized team (#05-022-B).', 'Equipo con licencia COFEPRIS (#05-022-B).') + '</li><li>' + t('In a life-threatening emergency call 911.', 'En una emergencia que ponga en riesgo la vida llama al 911.') + '</li>'));
    var hp = el('input', { type: 'text', name: '_honey', tabindex: '-1', autocomplete: 'off', style: 'position:absolute;left:-9999px', 'aria-hidden': 'true' }); main.appendChild(hp);
    var status = el('p', { class: 'bk-status', role: 'status' }); main.appendChild(status);
    var row = el('div', { class: 'bk-nav' });
    var back = el('button', { type: 'button', class: 'bk-back' }, '← ' + t('Back', 'Atrás')); back.onclick = function () { state.step = 3; render(); };
    var send = el('button', { type: 'button', class: 'bk-next' }, t('Send booking request', 'Enviar solicitud de reserva'));
    row.appendChild(back); row.appendChild(send); main.appendChild(row);
    send.onclick = function () {
      if (hp.value) return;
      send.disabled = true; send.textContent = t('Sending…', 'Enviando…');
      var payload = {
        _subject: 'New booking ' + orderId + ' — ' + form.name + ' — ' + fmtDate(state.date) + ' ' + state.time,
        _template: 'table', _captcha: 'false', _replyto: form.email,
        Booking: orderId, Name: form.name, Phone: form.phone, Email: form.email,
        Where: state.where === 'door' ? 'At customer location' : 'Downtown clinic', Area: form.area || '-', Address: form.address || '-',
        Date: fmtDate(state.date), Time: state.time,
        Services: lines().map(function (l) { return l.label + (l.amount ? ' ' + money(l.amount) : '') + (l.note ? ' (' + l.note + ')' : ''); }).join(' | '),
        'Pharmacy list': state.pharmacyList || '-', 'Estimated total USD': money(total()) + (isGroup() ? ' (group, tax incl.)' : ' (+ tax on IVs)'),
        Notes: form.notes || '-', Language: ES ? 'Spanish' : 'English', Page: location.href
      };
      fetch(ORDER_EMAIL_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) { done(j && (j.success === true || j.success === 'true')); })
        .catch(function () { done(false); });
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', { method: 'online_booking', value: total(), currency: 'USD' });
        window.gtag('event', 'booking_request', { value: total(), currency: 'USD', items: totalIV() });
      }
    };
    function done(ok) {
      var waUrl = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t('Hi! I just sent a booking request on your website:', '¡Hola! Acabo de enviar una solicitud de reserva en su sitio:') + '\n' + summaryText());
      main.innerHTML = '<div class="bk-done"><div class="bk-ok">✓</div><h2>' + (ok ? t('Request received!', '¡Solicitud recibida!') : t('Almost done — send it on WhatsApp', 'Casi listo — envíala por WhatsApp')) + '</h2>'
        + '<p>' + (ok ? t('Your booking number is', 'Tu número de reserva es') + ' <b>' + orderId + '</b>. ' + t('We will confirm by WhatsApp or phone shortly. For the fastest confirmation, also send it on WhatsApp:', 'Te confirmamos por WhatsApp o llamada en breve. Para confirmar más rápido, envíala también por WhatsApp:') : t('We could not send it by email from your browser. Tap below to send the same booking on WhatsApp — it takes one tap.', 'No pudimos enviarla por correo desde tu navegador. Toca abajo para mandar la misma reserva por WhatsApp.')) + '</p>'
        + '<a class="btn btn-wa" href="' + waUrl + '" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>' + t('Send on WhatsApp', 'Enviar por WhatsApp') + '</a>'
        + '<p class="bk-fine">' + t('Questions? Call', '¿Dudas? Llama al') + ' <a href="tel:+526242261023">+52 624 226 1023</a> (24/7).</p></div>';
    }
  }

  // ---------- boot ----------
  function boot() {
    root = document.getElementById('bk-app'); if (!root) return;
    var q = new URLSearchParams(location.search);
    if (q.get('where') === 'clinic') state.where = 'clinic';
    var drip = q.get('drip'), qty = parseInt(q.get('qty') || '1', 10);
    DRIPS.forEach(function (d) { if (d.id === drip) state.qty[d.id] = Math.max(1, Math.min(30, qty || 1)); });
    if (q.get('group')) { var g = DRIPS[1]; if (!drip) state.qty[g.id] = GROUP_MIN; }
    var s = q.get('service'); if (s === 'doctor') state.doctor = true; if (s === 'pharmacy') state.pharmacy = true; if (s === 'nurse') state.nurse = true;
    render();
    root.scrollIntoView = root.scrollIntoView || function () {};
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
