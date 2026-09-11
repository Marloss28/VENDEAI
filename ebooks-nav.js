(() => {
  'use strict';

  const EBOOKS_URL = '/ebooks';

  function addEbooksLinks() {
    // Landing desktop
    const topNav = document.querySelector('.top nav');
    if (topNav && !topNav.querySelector('[data-ebooks-link]')) {
      const link = document.createElement('a');
      link.href = EBOOKS_URL;
      link.dataset.ebooksLink = 'true';
      link.textContent = 'E-books';
      topNav.appendChild(link);
    }

    // Painel desktop
    const aside = document.querySelector('#app aside, .app aside');
    if (aside && !aside.querySelector('[data-ebooks-link]')) {
      const profile = aside.querySelector('.profile');
      const link = document.createElement('a');
      link.href = EBOOKS_URL;
      link.dataset.ebooksLink = 'true';
      link.className = 'navitem';
      link.style.textDecoration = 'none';
      link.innerHTML = '<span>📚</span><span>E-books</span>';
      if (profile) aside.insertBefore(link, profile);
      else aside.appendChild(link);
    }

    // Navegação mobile inferior
    const mobileNav = document.querySelector('#mobileNav');
    if (mobileNav && !mobileNav.querySelector('[data-ebooks-link]')) {
      const link = document.createElement('a');
      link.href = EBOOKS_URL;
      link.dataset.ebooksLink = 'true';
      link.className = 'mnav';
      link.style.textDecoration = 'none';
      link.innerHTML = '<b>📚</b>E-books';
      mobileNav.appendChild(link);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addEbooksLinks);
  } else {
    addEbooksLinks();
  }

  // Garante o link caso o app seja re-renderizado/restaurado.
  const observer = new MutationObserver(addEbooksLinks);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
