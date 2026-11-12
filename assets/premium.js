/* Premium interactions: header shadow on scroll, reveal-on-scroll, hero quick-book widget. */
(function () {
  'use strict';
  var ES = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
  function init() {
    // Header state on scroll
    var hdr = document.querySelector('.hdr');
    if (hdr) { var on = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 24); }; on(); window.addEventListener('scroll', on, { passive: true }); }

    // Reveal on scroll
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var items = document.querySelectorAll('.sec-head, .iv, .card, .svc a, .rv, .steps li, .gallery figure, .area-list li, .post, .cway, .faq details');
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
      [].forEach.call(items, function (el, i) {
        if (el.getBoundingClientRect().top < innerHeight) return;   // already visible: no animation
        el.classList.add('rv-in'); el.style.transitionDelay = ((i % 4) * 70) + 'ms'; io.observe(el);
      });
    }

    // Quick-book widget (placeholder element in hero)
    var qb = document.querySelector('[data-quickbook]');
    if (qb) {
      var drips = [['rapid-hydration', 'Rapid Hydration — $159'], ['hangover-rescue', 'Hangover Rescue — $189.99'], ['myers-cocktail', 'Myers Cocktail — $189.99'], ['immunity-armor', 'Immunity Armor — $179.99'],
                   ['energy-b12', 'Energy & B12 — $179.99'], ['performance-recovery', 'Performance & Recovery — $179.99'], ['beauty-glow', 'Beauty Glow — $179.99']];
      var book = ES ? '/es/reservar/' : '/book/';
      var html = '<label>' + (ES ? 'Tu suero' : 'Your IV drip') + '<select name="drip">' + drips.map(function (d) { return '<option value="' + d[0] + '">' + d[1] + '</option>'; }).join('') + '</select></label>'
        + '<label class="qb-n">' + (ES ? 'Personas' : 'People') + '<select name="qty">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(function (n) { return '<option value="' + n + '">' + n + (n >= 6 ? ' ★' : '') + '</option>'; }).join('') + '</select></label>'
        + '<button type="submit">' + (ES ? 'Ver disponibilidad →' : 'Check availability →') + '</button>'
        + '<p class="qb-note">' + (ES ? 'Desde $159 + IVA a domicilio · $129 en clínica · ' : 'From $159 + tax at your door · $129 at our clinic · ') + '<b>' + (ES ? '6+ personas: $119 c/u, IVA incl.' : '6+ people: $119 each, tax incl.') + '</b> · ' + (ES ? 'sin pago por adelantado' : 'no payment upfront') + '</p>';
      var chip = qb.previousElementSibling;
      if (chip && chip.classList.contains('price-chip')) chip.remove();
      var f = document.createElement('form'); f.className = 'qb'; f.setAttribute('aria-label', ES ? 'Reserva rápida' : 'Quick booking'); f.innerHTML = html;
      f.onsubmit = function (e) { e.preventDefault(); location.href = book + '?drip=' + f.drip.value + '&qty=' + f.qty.value; };
      f.qty.onchange = function () { var n = +f.qty.value; f.querySelector('button').textContent = n >= 6 ? (ES ? 'Reservar grupo a $119 →' : 'Book group at $119 →') : (ES ? 'Ver disponibilidad →' : 'Check availability →'); };
      qb.replaceWith(f);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
