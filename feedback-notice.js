(() => {
  const notice = document.getElementById('feedback-notice');
  const close = document.getElementById('feedback-notice-close');
  const key = 'corte-feedback-notice-dismissed';
  try { notice.hidden = sessionStorage.getItem(key) === 'yes'; } catch { /* Still dismissible when storage is unavailable. */ }
  function dismiss() {
    notice.hidden = true;
    try { sessionStorage.setItem(key, 'yes'); } catch { /* Optional session memory. */ }
  }
  close.addEventListener('click', dismiss);
  document.getElementById('feedback-notice-link').addEventListener('click', dismiss);
  function language() { close.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Dismiss feedback notice' : 'Fechar aviso de feedback'); }
  new MutationObserver(language).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  language();
})();
