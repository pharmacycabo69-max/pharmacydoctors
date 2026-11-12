/* Turns the old Elementor contact forms (which posted to WordPress, now gone)
   into WhatsApp forms: on submit, the filled fields open a prefilled WhatsApp chat. */
(function () {
  var WA = '526242261023';
  function labelFor(form, el) {
    var l = el.id && form.querySelector('label[for="' + el.id + '"]');
    var wrap = !l && el.closest('label');
    var wrapText = wrap && wrap.firstChild && wrap.firstChild.nodeType === 3 ? wrap.firstChild.textContent : '';
    var t = (l && l.textContent) || wrapText || el.getAttribute('placeholder') || el.name || '';
    return t.replace(/\s+/g, ' ').replace(/[*:]+\s*$/, '').trim();
  }
  function onSubmit(e) {
    var form = e.target;
    if (!form.matches || !form.matches('form.elementor-form, form[data-wa-form]')) return;
    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    var lines = ['Hi! New request from pharmacydoctors.com (' + document.title.split('|')[0].trim() + '):'];
    [].forEach.call(form.querySelectorAll('input, select, textarea'), function (el) {
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
      if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
      var v = (el.value || '').trim(); if (!v) return;
      var lab = labelFor(form, el) || 'Info';
      lines.push(lab + (/\?$/.test(lab) ? ' ' : ': ') + v);
    });
    var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n'));
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_click', { link_url: url.slice(0, 100), link_text: 'contact form', page_path: location.pathname });
      window.gtag('event', 'generate_lead', { method: 'whatsapp_form' });
    }
    var w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
  }
  document.addEventListener('submit', onSubmit, true);
  function relabel() {
    [].forEach.call(document.querySelectorAll('form.elementor-form'), function (f) {
      var btn = f.querySelector('button[type="submit"]');
      var b = btn && (btn.querySelector('.elementor-button-text') || btn);
      if (b) b.textContent = 'Send via WhatsApp';
      if (!f.querySelector('.wa-form-note')) {
        var p = document.createElement('p'); p.className = 'wa-form-note';
        p.style.cssText = 'margin:10px 0 0;font-size:13px;color:#78716c;width:100%';
        p.textContent = 'Opens WhatsApp with your details filled in. Our team replies 24/7.';
        f.appendChild(p);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', relabel); else relabel();
})();
