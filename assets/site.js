/* Mobile drawer for the shared header (assets/site.css). */
(function () {
  function init() {
    var d = document.getElementById('px-drawer'), b = document.querySelector('.px-burger');
    if (!d || !b) return;
    function set(o) {
      d.classList.toggle('px-open', o); d.setAttribute('aria-hidden', String(!o));
      b.setAttribute('aria-expanded', String(o)); document.documentElement.style.overflow = o ? 'hidden' : '';
    }
    b.addEventListener('click', function () { set(true); });
    d.addEventListener('click', function (e) { if (e.target.closest('[data-px-close]') || e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    // Mark current page in the nav
    var p = location.pathname;
    [].forEach.call(document.querySelectorAll('.px-nav a, .px-dd a'), function (a) {
      if (a.getAttribute('href') === p) a.setAttribute('aria-current', 'page');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
