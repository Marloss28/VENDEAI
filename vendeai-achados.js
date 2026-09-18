'use strict';
(() => {
  const tabs = Array.from(document.querySelectorAll('[data-preview]'));
  const panel = document.getElementById('group-preview-panel');
  const subtitle = document.getElementById('chat-subtitle');
  const caption = document.getElementById('preview-caption');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let transitionTimer;
  function selectTab(tab, moveFocus = false) {
    const channel = tab.dataset.preview;
    if (!panel || !['whatsapp', 'telegram'].includes(channel)) return;
    const name = channel === 'telegram' ? 'Telegram' : 'WhatsApp';
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panel.dataset.channel = channel;
    panel.setAttribute('aria-labelledby', tab.id);
    subtitle.textContent = `Prévia de grupo no ${name}`;
    caption.textContent = `Prévia ilustrativa do ${name}. Não é uma conversa real.`;
    clearTimeout(transitionTimer);
    panel.classList.remove('switched');
    if (!reducedMotion.matches) {
      requestAnimationFrame(() => panel.classList.add('switched'));
      transitionTimer = setTimeout(() => panel.classList.remove('switched'), 350);
    }
    if (moveFocus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reducedMotion.matches) {
          entry.target.classList.add('arrived');
          entry.target.addEventListener('animationend', () => entry.target.classList.remove('arrived'), { once: true });
        }
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.channel, .themes-inner, .found, .questions').forEach(element => observer.observe(element));
  }
})();
