/* PharmacyDoctors.com online booking: catalog + cart + calendar + details -> email (Web3Forms; FormSubmit if no key) + WhatsApp.
   Optional $50 Stripe deposit after sending. Prices mirror /prices/. Language from <html lang>. */
(function () {
  'use strict';
  var ORDER_EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/cmccompanydental@gmail.com';
  // Web3Forms lets us set the sender name. Paste the free access key here to switch providers.
  var WEB3FORMS_KEY = '61ecefdf-b8ed-4b03-b9e9-b83c05a29c0f';
  // V4 (2026-11-25): no deposit. Nothing is charged online at request time; after the team confirms
  // availability it sends a secure payment link for 100% of the confirmed price (or the guest pays at the visit).
  var DEPOSIT_URL = '';
  var DEPOSIT = 50;
  var SENDER_NAME = 'Pharmacy & Doctors Cabo – Bookings';
  var WA = '526242261023';
  var ES = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
  function t(en, es) { return ES ? es : en; }

  var DRIPS = [
    { id: 'rapid-hydration', name: 'Rapid Hydration', door: 159, clinic: 129, tag: t('Hydration', 'Hidratación'), desc: t('Fluids + electrolytes for sun, heat and travel.', 'Líquidos y electrolitos para sol, calor y viaje.') },
    { id: 'hangover-rescue', name: 'Hangover Rescue', door: 159, clinic: 129, tag: t('Recovery', 'Recuperación'), desc: t('Rehydration, vitamins and anti-nausea support.', 'Rehidratación, vitaminas y apoyo contra la náusea.') },
    { id: 'myers-cocktail', name: 'Myers Cocktail', door: 159, clinic: 129, tag: t('Wellness', 'Bienestar'), desc: t('The classic vitamin & mineral wellness drip.', 'El suero clásico de vitaminas y minerales.') },
    { id: 'immunity-armor', name: 'Immunity Armor', door: 159, clinic: 129, tag: t('Immunity', 'Inmunidad'), desc: t('High-dose vitamin C, zinc and antioxidants.', 'Vitamina C en dosis alta, zinc y antioxidantes.') },
    { id: 'energy-b12', name: 'Energy & B12', door: 159, clinic: 129, tag: t('Energy', 'Energía'), desc: t('B-complex recharge for jet lag and fatigue.', 'Complejo B para jet lag y cansancio.') },
    { id: 'performance-recovery', name: 'Performance & Recovery', door: 159, clinic: 129, tag: t('Athletic', 'Deportivo'), desc: t('Recover after golf, fishing or training.', 'Recuperación después de golf, pesca o ejercicio.') },
    { id: 'beauty-glow', name: 'Beauty Glow', door: 159, clinic: 129, tag: t('Beauty', 'Belleza'), desc: t('Hydration with antioxidants for your skin.', 'Hidratación con antioxidantes para la piel.') },
    { id: 'nad-plus', name: 'NAD+', door: 279, clinic: 279, noGroup: true, tag: t('Premium', 'Premium'), desc: t('Ask our team whether NAD+ is right for you.', 'Pregunta a nuestro equipo si el NAD+ es adecuado para ti.') }
  ];
  var GROUP_MIN = 6, GROUP_PRICE = 119;
  var DOCTOR = { door: 189, clinic: 99 };
  var VIDEO = 59;
  var AREAS = ['Cabo San Lucas (downtown / Medano / Marina)', 'Pedregal', 'Tourist Corridor (Cabo Real, Chileno, Palmilla)', 'San José del Cabo', 'Puerto Los Cabos / Costa Azul', t('Other (tell us below)', 'Otra (indícala abajo)')];

  var AES = [
    { id: 'lips', name: t('Lip fillers', 'Relleno de labios'), price: '$600', desc: t('Hyaluronic acid lip fillers', 'Ácido hialurónico para labios') },
    { id: 'botox', name: t('Facial Botox', 'Botox facial'), price: '$550', desc: t('Upper face from $550 · other areas from $170', 'Tercio superior $550 · otras zonas desde $170') },
    { id: 'rejuvenation', name: t('Facial rejuvenation', 'Rejuvenecimiento facial'), price: t('from $300', 'desde $300'), desc: t('NCTF, polynucleotides, Radiesse, Sculptra', 'NCTF, polinucleótidos, Radiesse, Sculptra') },
    { id: 'brightening', name: t('Skin brightening', 'Aclaramiento facial'), price: '$1,500', desc: t('Cosmelan depigmenting peel', 'Peeling despigmentante Cosmelan') }
  ];
  var state = { where: 'door', qty: {}, aes: {}, imaging: false, doctor: false, video: false, pharmacy: false, nurse: false, pharmacyList: '', date: null, time: '', step: 1 };
  DRIPS.forEach(function (d) { state.qty[d.id] = 0; });

  // ---------- helpers ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); } if (html != null) e.innerHTML = html; return e; }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function totalIV() { var n = 0; for (var k in state.qty) n += state.qty[k]; return n; }
  function groupIV() { var n = 0; DRIPS.forEach(function (d) { if (!d.noGroup) n += state.qty[d.id]; }); return n; }
  function isGroup() { return groupIV() >= GROUP_MIN && state.where === 'door'; }
  function lines() {
    var out = [], group = isGroup();
    DRIPS.forEach(function (d) {
      var q = state.qty[d.id]; if (!q) return;
      var g = group && !d.noGroup, unit = g ? GROUP_PRICE : (state.where === 'door' ? d.door : d.clinic);
      out.push({ label: d.name + ' IV × ' + q, unit: unit, amount: unit * q, note: g ? t('group rate, tax incl.', 'precio de grupo, IVA incl.') : t('tax incl.', 'IVA incl.') });
    });
    if (state.doctor) out.push({ label: t('Doctor visit', 'Consulta médica') + (state.where === 'door' ? t(' at your location', ' a domicilio') : t(' at the clinic', ' en la clínica')), unit: DOCTOR[state.where], amount: DOCTOR[state.where], note: '' });
    if (state.video) out.push({ label: t('Video consultation', 'Videoconsulta'), unit: VIDEO, amount: VIDEO, note: '' });
    if (state.pharmacy) out.push({ label: t('Pharmacy delivery', 'Farmacia a domicilio'), unit: 0, amount: 0, note: t('items priced on confirmation · free delivery over $50', 'productos se cotizan al confirmar · envío gratis desde $50') });
    if (state.nurse) out.push({ label: t('Private nurse', 'Enfermera privada'), unit: 0, amount: 0, note: t('quoted on confirmation', 'se cotiza al confirmar') });
    AES.forEach(function (a) {
      if (state.aes[a.id]) out.push({ label: t('Aesthetic evaluation: ', 'Valoración estética: ') + a.name, unit: 0, amount: 0, note: t('evaluation first · listed price ', 'valoración primero · precio publicado ') + a.price + t(' (tax incl.)', ' (IVA incl.)') });
    });
    if (state.imaging) out.push({ label: t('Imaging quote request', 'Solicitud de cotización de estudios de imagen'), unit: 0, amount: 0, note: t('X-ray / ultrasound · quoted on confirmation', 'rayos X / ultrasonido · se cotiza al confirmar') });
    return out;
  }
  function total() { return lines().reduce(function (s, l) { return s + l.amount; }, 0); }
  function hasAes() { return AES.some(function (a) { return state.aes[a.id]; }); }
  function hasItems() { return totalIV() > 0 || state.doctor || state.video || state.pharmacy || state.nurse || hasAes() || state.imaging; }
  // the $50 deposit only applies to IV drips, doctor and video visits
  function payable() { return totalIV() > 0 || state.doctor || state.video; }

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
    if (tot) h += '<div class="bk-total"><span>' + t('Estimated total', 'Total estimado') + '</span><b>' + money(tot) + ' USD</b></div><p class="bk-fine">' + t('All prices include tax.', 'Todos los precios incluyen IVA.') + ' ' + ((DEPOSIT_URL && payable()) ? t('$' + DEPOSIT + ' deposit secures your time; it is deducted at the visit.', 'Un anticipo de $' + DEPOSIT + ' asegura tu horario y se descuenta en la visita.') : t('Nothing is charged now. We confirm availability first, then you pay the full price by secure card link or at the visit.', 'No se cobra nada ahora. Primero confirmamos disponibilidad y después pagas el precio total con enlace seguro o en la visita.')) + '</p>';
    var left = GROUP_MIN - groupIV();
    if (state.where === 'door' && groupIV() > 0 && left > 0) h += '<div class="bk-nudge">👥 ' + t('Add ' + left + ' more IV' + (left > 1 ? 's' : '') + ' and everyone pays $119 (tax incl.)', 'Agrega ' + left + ' suero' + (left > 1 ? 's' : '') + ' más y todos pagan $119 (IVA incl.)') + '</div>';
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
      var q = state.qty[d.id], price = (isGroup() && !d.noGroup) ? GROUP_PRICE : (state.where === 'door' ? d.door : d.clinic);
      var c = el('div', { class: 'bk-item' + (q ? ' sel' : '') });
      c.innerHTML = '<div class="bk-item-t"><span class="bk-tag">' + d.tag + '</span><b>' + esc(d.name) + '</b><small>' + esc(d.desc) + '</small></div>'
        + '<div class="bk-item-p"><b>' + money(price) + '</b><small>' + t('tax incl.', 'IVA incl.') + '</small></div>'
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
     ['video', t('Video consultation', 'Videoconsulta'), money(VIDEO) + ' USD', t('See a doctor by video from anywhere', 'Consulta con un doctor por video desde donde estés')],
     ['pharmacy', t('Pharmacy delivery', 'Farmacia a domicilio'), t('Free over $50', 'Gratis desde $50'), t('Medications & essentials to your room', 'Medicinas y productos a tu habitación')],
     ['nurse', t('Private nurse', 'Enfermera privada'), t('Quote', 'Cotización'), t('Wound care, injections, monitoring', 'Curaciones, inyecciones, monitoreo')]].forEach(function (o) {
      var lab = el('label', { class: 'bk-check' + (state[o[0]] ? ' sel' : '') });
      lab.innerHTML = '<input type="checkbox"' + (state[o[0]] ? ' checked' : '') + '><span><b>' + o[1] + '</b><small>' + o[3] + '</small></span><em>' + o[2] + '</em>';
      lab.querySelector('input').onchange = function (e) { state[o[0]] = e.target.checked; render(); };
      ex.appendChild(lab);
    });
    main.appendChild(ex);
    main.appendChild(el('h3', { class: 'bk-h' }, t('Aesthetic medicine', 'Medicina estética') + ' <small>' + t('evaluation first · Dra. Rosibel Núñez Rojo', 'valoración primero · Dra. Rosibel Núñez Rojo') + '</small>'));
    var ae = el('div', { class: 'bk-extras' });
    AES.forEach(function (a) {
      var lab = el('label', { class: 'bk-check' + (state.aes[a.id] ? ' sel' : '') });
      lab.innerHTML = '<input type="checkbox"' + (state.aes[a.id] ? ' checked' : '') + '><span><b>' + a.name + '</b><small>' + a.desc + '</small></span><em>' + a.price + '<small style="display:block;font-weight:500;font-size:.72em">' + t('tax incl.', 'IVA incl.') + '</small></em>';
      lab.querySelector('input').onchange = function (e) { state.aes[a.id] = e.target.checked; render(); };
      ae.appendChild(lab);
    });
    var im = el('label', { class: 'bk-check' + (state.imaging ? ' sel' : '') });
    im.innerHTML = '<input type="checkbox"' + (state.imaging ? ' checked' : '') + '><span><b>' + t('Imaging quote', 'Cotización de estudios de imagen') + '</b><small>' + t('X-ray or ultrasound, coordinated with our imaging team', 'Rayos X o ultrasonido, coordinado con nuestro equipo de imagenología') + '</small></span><em>' + t('Quote', 'Cotización') + '</em>';
    im.querySelector('input').onchange = function (e) { state.imaging = e.target.checked; render(); };
    ae.appendChild(im);
    main.appendChild(ae);
    if (hasAes()) main.appendChild(el('p', { class: 'bk-fine' }, t('Aesthetic treatments are only done after an in-person evaluation; the evaluation fee and your final plan are confirmed by our team.', 'Los tratamientos estéticos se hacen solo después de una valoración presencial; el costo de la valoración y tu plan final los confirma nuestro equipo.')));
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
    main.appendChild(el('p', { class: 'bk-sub' }, t('You can request care 24/7. Times are Cabo time (Mountain Time, same as Denver/Phoenix). We confirm the arrival time when we confirm your booking.', 'Puedes solicitar atención 24/7. Horario de Los Cabos. Confirmamos la hora de llegada al confirmar tu reserva.')));
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
      if (isToday) opts.push(t('As soon as possible (we confirm the time)', 'Lo antes posible (confirmamos la hora)'));
      for (var hi = 0; hi < 24; hi++) for (var mm = 0; mm < 60; mm += 30) {
        var hh = (hi + 7) % 24;   // list starts at 7:00 AM, late-night slots at the end
        if (state.where === "clinic" && (hh < 9 || hh >= 17)) continue;   // V4: clinic 9 AM-5 PM; other times by appointment
        if (isToday && hh < 7) continue;
        if (isToday && (hh * 60 + mm) < now.getHours() * 60 + now.getMinutes() + 60) continue;
        var dt = new Date(2000, 0, 1, hh, mm);
        opts.push(dt.toLocaleTimeString(ES ? 'es-MX' : 'en-US', { hour: 'numeric', minute: '2-digit' }));
      }
      opts.forEach(function (o) { var b = el('button', { type: 'button', class: state.time === o ? 'on' : '' }, o); b.onclick = function () { state.time = o; render(); }; slots.appendChild(b); });
      main.appendChild(slots);
      if (state.where === "clinic") main.appendChild(el("p", { class: "bk-sub" }, t("Clinic hours: 9 AM–5 PM. Need another time? Message us on WhatsApp and we will try to arrange an appointment.", "Horario de clínica: 9:00–17:00. ¿Necesitas otra hora? Escríbenos por WhatsApp y buscamos una cita.")));
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
      t('Estimated total', 'Total estimado') + ': ' + money(total()) + ' USD ' + t('(tax incl.)', '(IVA incl.)'),
      t('Name', 'Nombre') + ': ' + form.name, t('Phone', 'Teléfono') + ': ' + form.phone, 'Email: ' + form.email,
      form.notes ? t('Notes', 'Notas') + ': ' + form.notes : ''
    ].filter(Boolean).join('\n');
  }
  function stepReview(main) {
    if (!orderId) { var d = new Date(); orderId = 'PD-' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
    main.appendChild(el('h2', {}, t('Review and send', 'Revisa y envía')));
    var pre = el('div', { class: 'bk-review' }); pre.textContent = summaryText(); main.appendChild(pre);
    main.appendChild(el('ul', { class: 'bk-assure' }, '<li>' + ((DEPOSIT_URL && payable()) ? t('After sending, secure your time with a $' + DEPOSIT + ' card deposit — it is deducted from your total. The rest is paid at the visit.', 'Al enviar, asegura tu horario con un anticipo de $' + DEPOSIT + ' con tarjeta — se descuenta de tu total. El resto lo pagas en la visita.') : t('Nothing is charged now. After we confirm availability you pay the full confirmed price — by secure card link or at the visit (card, USD or pesos). No deposit.', 'No se cobra nada ahora. Cuando confirmamos disponibilidad pagas el precio total — con enlace seguro o en la visita (tarjeta, USD o pesos). Sin anticipo.')) + '</li><li>' + t('We confirm availability by WhatsApp or phone before you pay.', 'Confirmamos disponibilidad por WhatsApp o llamada antes de que pagues.') + '</li><li>' + t('Licensed doctors and nurses.', 'Equipo con licencia.') + '</li><li>' + t('In a life-threatening emergency call 911.', 'En una emergencia que ponga en riesgo la vida llama al 911.') + '</li>'));
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
        _subject: 'PharmacyDoctors.com · New booking ' + orderId + ' — ' + form.name + ' — ' + fmtDate(state.date) + ' ' + state.time + (window.PD_REF ? ' · ref ' + window.PD_REF : ''),
        _template: 'table', _captcha: 'false', _replyto: form.email,
        Booking: orderId, Name: form.name, Phone: form.phone, Email: form.email,
        Where: state.where === 'door' ? 'At customer location' : 'Downtown clinic', Area: form.area || '-', Address: form.address || '-',
        Date: fmtDate(state.date), Time: state.time,
        Services: lines().map(function (l) { return l.label + (l.amount ? ' ' + money(l.amount) : '') + (l.note ? ' (' + l.note + ')' : ''); }).join(' | '),
        'Pharmacy list': state.pharmacyList || '-', 'Estimated total USD': money(total()) + (isGroup() ? ' (group rate, tax incl.)' : ' (tax incl.)'),
        Payment: (DEPOSIT_URL && payable()) ? ('$' + DEPOSIT + ' deposit link shown — check Stripe for ' + orderId) : 'Full price after confirmation (send secure payment link or collect at visit)', 'Referred by': window.PD_REF || '-', Notes: form.notes || '-', Language: ES ? 'Spanish' : 'English', Page: location.href
      };
      var url = ORDER_EMAIL_ENDPOINT, body = payload;
      if (WEB3FORMS_KEY) {
        url = 'https://api.web3forms.com/submit';
        body = { access_key: WEB3FORMS_KEY, from_name: SENDER_NAME, subject: payload._subject, replyto: form.email, botcheck: '' };
        for (var k in payload) if (k.charAt(0) !== '_') body[k] = payload[k];
      }
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) })
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
      var payUrl = (DEPOSIT_URL && payable()) ? DEPOSIT_URL + '?client_reference_id=' + encodeURIComponent(orderId + (window.PD_REF ? '_ref-' + window.PD_REF : '')) + (form.email ? '&prefilled_email=' + encodeURIComponent(form.email) : '') : '';
      var nextBox = '<div class="bk-next-steps"><b>' + t('What happens next', 'Qué sigue') + '</b><ol><li>' + t('We check availability and confirm your date and time.', 'Revisamos disponibilidad y confirmamos fecha y hora.') + '</li><li>' + t('You receive a secure payment link for the full confirmed price — or you pay at the visit.', 'Recibes un enlace seguro para pagar el precio total confirmado — o pagas en la visita.') + '</li><li>' + t('Your nurse or doctor arrives at the confirmed time.', 'Tu enfermera o doctor llega a la hora confirmada.') + '</li></ol></div>';
      var payBox = payUrl ? '<div class="bk-pay"><b>' + t('Secure your appointment', 'Asegura tu cita') + '</b><p>' + t('Pay a $' + DEPOSIT + ' USD deposit by card. It is deducted from your total at the visit.', 'Paga un anticipo de $' + DEPOSIT + ' USD con tarjeta. Se descuenta de tu total en la visita.') + '</p><a class="btn bk-paybtn" href="' + payUrl + '" target="_blank" rel="noopener">💳 ' + t('Pay $' + DEPOSIT + ' deposit', 'Pagar anticipo de $' + DEPOSIT) + '</a><small>' + t('Secure checkout by Stripe · Full refund if you cancel 24+ hours before', 'Pago seguro con Stripe · Reembolso completo si cancelas con 24 h o más') + ' (<a href="/refund-policy/" target="_blank">' + t('policy', 'política') + '</a>)</small></div>' : '';
      main.innerHTML = '<div class="bk-done"><div class="bk-ok">✓</div><h2>' + (ok ? t('Request received!', '¡Solicitud recibida!') : t('Almost done — send it on WhatsApp', 'Casi listo — envíala por WhatsApp')) + '</h2>'
        + '<p>' + (ok ? t('Your booking number is', 'Tu número de reserva es') + ' <b>' + orderId + '</b>. ' + t('We will confirm by WhatsApp or phone shortly.', 'Te confirmamos por WhatsApp o llamada en breve.') : t('We could not send it by email from your browser. Tap below to send the same booking on WhatsApp — it takes one tap.', 'No pudimos enviarla por correo desde tu navegador. Toca abajo para mandar la misma reserva por WhatsApp.')) + '</p>'
        + (ok ? nextBox + payBox + '<p class="bk-fine">' + t('For the fastest confirmation, also send it on WhatsApp:', 'Para confirmar más rápido, envíala también por WhatsApp:') + '</p>' : '')
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
    if (q.get('service') === 'aesthetic' || q.get('service') === 'imaging') state.where = 'clinic';
    var tr = q.get('treatment'); AES.forEach(function (a) { if (a.id === tr) state.aes[a.id] = true; });
    var s = q.get('service'); if (s === 'aesthetic' && !tr) state.aes.lips = true; if (s === 'imaging') state.imaging = true; if (s === 'doctor') state.doctor = true; if (s === 'video') state.video = true; if (s === 'pharmacy') state.pharmacy = true; if (s === 'nurse') state.nurse = true;
    render();
    root.scrollIntoView = root.scrollIntoView || function () {};
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
