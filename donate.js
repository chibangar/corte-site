(() => {
  // Shows the "Support Corte" section only when a real PayPal link is configured,
  // so the site never offers a donate button that goes nowhere.
  const url = ((window.CORTE_DONATE || {}).url || '').trim();
  const valid = /^https:\/\/(www\.)?paypal\.me\/[A-Za-z0-9._-]+\/?$/.test(url)
    || /^https:\/\/www\.paypal\.com\/donate\/?\?hosted_button_id=[A-Za-z0-9]+$/.test(url);
  if (!valid) return;
  document.querySelectorAll('.donate-link').forEach(a => { a.href = url; });
  document.querySelectorAll('#apoiar, .donate-nav').forEach(el => { el.hidden = false; });
})();
