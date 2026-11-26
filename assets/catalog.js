/* PharmacyDoctors V5.3 — interactive catalog, treatment picker and group calculator.
   Progressive enhancement: cards, prices and links are in the HTML (indexable, work without JS).
   Prices come from data-* attributes generated from assets/pd-data.json; the server recomputes every amount at payment. */
(function () {
  'use strict';
  var ES = (document.documentElement.lang || '').indexOf('es') === 0;
  function t(en, es) { return ES ? es : en; }
  var BOOK = ES ? '/es/reservar/' : '/book/';
  var PLACE = { clinic: t('at our downtown clinic', 'en nuestra clínica'), hotel: t('at your hotel', 'en tu hotel'), villa: t('at your villa', 'en tu villa'), yacht: t('on your yacht', 'en tu yate') };
  function usd(c) { return '$' + Math.round(c / 100).toLocaleString('en-US'); }
  function whereOf(mode) { return mode === 'clinic' ? 'clinic' : 'door'; }
  function unit(el, mode, guests, gUnit, gMin) {
    var w = whereOf(mode), kind = el.getAttribute('data-kind');
    if (kind === 'iv' && w === 'door' && guests >= gMin) return gUnit;
    return parseInt(el.getAttribute(w === 'door' ? 'data-door' : 'data-clinic'), 10);
  }
  function bookUrl(id, mode, guests) {
    return BOOK + '?drip=' + encodeURIComponent(id) + '&where=' + whereOf(mode) + (guests > 1 ? '&qty=' + guests : '') + (mode !== 'clinic' ? '&place=' + mode : '');
  }
  function stepper(root, onChange) {
    var input = root.querySelector('input'), minus = root.querySelector('[data-step="-1"]'), plus = root.querySelector('[data-step="1"]');
    function set(v) { v = Math.max(1, Math.min(30, v || 1)); input.value = v; onChange(v); }
    minus.onclick = function () { set(parseInt(input.value, 10) - 1); };
    plus.onclick = function () { set(parseInt(input.value, 10) + 1); };
    input.onchange = function () { set(parseInt(input.value, 10)); };
    return { get: function () { return parseInt(input.value, 10) || 1; } };
  }
  function seg(root, onChange) {
    var btns = root.querySelectorAll('button[data-mode]');
    [].forEach.call(btns, function (b) { b.onclick = function () { [].forEach.call(btns, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); onChange(b.getAttribute('data-mode')); }; });
    var on = root.querySelector('button[aria-pressed="true"]'); return on ? on.getAttribute('data-mode') : 'hotel';
  }

  // ---------- catalog ----------
  [].forEach.call(document.querySelectorAll('[data-pd-catalog]'), function (cat) {
    var gUnit = parseInt(cat.getAttribute('data-group-unit'), 10), gMin = parseInt(cat.getAttribute('data-group-min'), 10);
    var cards = [].slice.call(cat.querySelectorAll('.tx'));
    var state = { mode: 'hotel', guests: parseInt(cat.getAttribute('data-guests') || '1', 10), goal: 'all', q: '' };
    var note = cat.querySelector('[data-cat-note]'), empty = cat.querySelector('[data-cat-empty]');
    function render() {
      var shown = 0;
      cards.forEach(function (c) {
        var okGoal = state.goal === 'all' || c.getAttribute('data-goal') === state.goal;
        var okQ = !state.q || (c.getAttribute('data-search') || '').indexOf(state.q) !== -1;
        c.hidden = !(okGoal && okQ); if (!c.hidden) shown++;
        var u = unit(c, state.mode, state.guests, gUnit, gMin);
        c.querySelector('[data-price]').textContent = usd(u);
        c.querySelector('[data-per]').textContent = (state.guests > 1 ? t(' per person', ' por persona') : '');
        c.querySelector('[data-where]').textContent = PLACE[state.mode];
        var tot = c.querySelector('[data-total]');
        tot.textContent = state.guests > 1 ? t('Total for ', 'Total para ') + state.guests + ': ' + usd(u * state.guests) : '';
        var b = c.querySelector('[data-book]'); b.href = bookUrl(c.getAttribute('data-id'), state.mode, state.guests);
      });
      if (empty) empty.hidden = shown !== 0;
      if (note) note.textContent = whereOf(state.mode) === 'door'
        ? (state.guests >= gMin ? t('Group rate applied: ' + usd(gUnit) + ' per standard IV for ' + gMin + '+ guests at your location (NAD+ not included). Each guest answers their own health questions.', 'Tarifa de grupo aplicada: ' + usd(gUnit) + ' por suero estándar con ' + gMin + '+ personas a domicilio (NAD+ no incluido). Cada persona responde sus propias preguntas de salud.') : t('Groups of ' + gMin + ' or more at your location pay ' + usd(gUnit) + ' per standard IV.', 'Grupos de ' + gMin + ' o más a domicilio pagan ' + usd(gUnit) + ' por suero estándar.'))
        : t('Clinic prices. The group rate applies at your location.', 'Precios en clínica. La tarifa de grupo aplica a domicilio.');
    }
    var segEl = cat.querySelector('[data-seg]'); if (segEl) state.mode = seg(segEl, function (m) { state.mode = m; render(); });
    var st = cat.querySelector('[data-stepper]'); if (st) stepper(st, function (v) { state.guests = v; render(); });
    var q = cat.querySelector('[data-cat-search]'); if (q) q.oninput = function () { state.q = q.value.trim().toLowerCase(); render(); };
    [].forEach.call(cat.querySelectorAll('[data-goal-btn]'), function (b) {
      b.onclick = function () { [].forEach.call(cat.querySelectorAll('[data-goal-btn]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); state.goal = b.getAttribute('data-goal-btn'); render(); };
    });
    cat.classList.add('is-live'); render();
  });

  // ---------- single-treatment picker (treatment pages, group pages) ----------
  [].forEach.call(document.querySelectorAll('[data-pd-picker]'), function (p) {
    var gUnit = parseInt(p.getAttribute('data-group-unit'), 10), gMin = parseInt(p.getAttribute('data-group-min'), 10);
    var id = p.getAttribute('data-id'), state = { mode: 'hotel', guests: parseInt(p.getAttribute('data-guests') || '1', 10) };
    function render() {
      var u = unit(p, state.mode, state.guests, gUnit, gMin);
      p.querySelector('[data-price]').textContent = usd(u);
      p.querySelector('[data-per]').textContent = state.guests > 1 ? t(' per person', ' por persona') : '';
      p.querySelector('[data-total]').textContent = state.guests > 1 ? t('Total for ', 'Total para ') + state.guests + ': ' + usd(u * state.guests) + t(', tax included', ', IVA incluido') : t('Tax included', 'IVA incluido');
      var cond = p.querySelector('[data-cond]');
      if (cond) cond.textContent = p.getAttribute('data-kind') !== 'iv' ? t('Not part of the group rate.', 'No aplica tarifa de grupo.') : (whereOf(state.mode) === 'door' && state.guests >= gMin ? t('Group rate: ' + gMin + '+ standard IVs at the same place and visit.', 'Tarifa de grupo: ' + gMin + '+ sueros estándar en el mismo lugar y visita.') : t('Group rate from ' + gMin + ' guests at your location: ' + usd(gUnit) + ' each.', 'Tarifa de grupo desde ' + gMin + ' personas a domicilio: ' + usd(gUnit) + ' c/u.'));
      p.querySelector('[data-book]').href = bookUrl(id, state.mode, state.guests);
    }
    var segEl = p.querySelector('[data-seg]'); if (segEl) state.mode = seg(segEl, function (m) { state.mode = m; render(); });
    var st = p.querySelector('[data-stepper]'); if (st) stepper(st, function (v) { state.guests = v; render(); });
    p.classList.add('is-live'); render();
  });

  // ---------- service picker (doctor: home / clinic / video) ----------
  [].forEach.call(document.querySelectorAll('[data-pd-service]'), function (p) {
    var btns = p.querySelectorAll('button[data-opt]');
    function pick(b) {
      [].forEach.call(btns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      p.querySelector('[data-price]').textContent = b.getAttribute('data-price');
      p.querySelector('[data-desc]').textContent = b.getAttribute('data-desc');
      p.querySelector('[data-book]').href = b.getAttribute('data-href');
    }
    [].forEach.call(btns, function (b) { b.onclick = function () { pick(b); }; });
    p.classList.add('is-live');
  });

  // ---------- horizontal carousel controls ----------
  [].forEach.call(document.querySelectorAll('[data-carousel]'), function (c) {
    var track = c.querySelector('[data-track]'); if (!track) return;
    var prev = c.querySelector('[data-prev]'), next = c.querySelector('[data-next]');
    function step(dir) { var card = track.querySelector('.tx'); var w = card ? card.getBoundingClientRect().width + 18 : 300; track.scrollBy({ left: dir * w, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    function upd() { if (prev) prev.disabled = track.scrollLeft < 8; if (next) next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8; }
    if (prev) prev.onclick = function () { step(-1); };
    if (next) next.onclick = function () { step(1); };
    track.addEventListener('scroll', upd, { passive: true }); upd();
  });
})();
