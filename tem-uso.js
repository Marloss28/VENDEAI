'use strict';
(() => {
  let items = [];
  let active = 'todos';
  let lastTrigger;
  const catalog = document.getElementById('catalog');
  const search = document.getElementById('search');
  const dialog = document.getElementById('guide-dialog');
  const labels = { casa: 'Casa', mesa: 'Mesa de trabalho', organizacao: 'Organização' };
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function affiliateLink(value) {
    if (!value) return null;
    try { const url = new URL(value); return url.protocol === 'https:' && ['s.shopee.com.br', 'shopee.com.br'].includes(url.hostname) ? url.href : null; } catch { return null; }
  }
  function openGuide(item, trigger) {
    lastTrigger = trigger;
    document.getElementById('guide-category').textContent = `${item.number} / ${item.label}`;
    document.getElementById('guide-title').textContent = item.name;
    document.getElementById('guide-intro').textContent = item.description;
    const checks = document.getElementById('guide-checks'); checks.replaceChildren();
    item.checks.forEach(check => { const li = document.createElement('li'); li.textContent = check; checks.append(li); });
    const affiliate = affiliateLink(item.affiliateUrl);
    const link = document.getElementById('guide-link');
    link.href = affiliate || `https://shopee.com.br/search?keyword=${encodeURIComponent(item.keyword)}`;
    link.rel = affiliate ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
    link.textContent = affiliate ? 'Ver na Shopee ↗' : 'Pesquisar na Shopee ↗';
    document.getElementById('guide-disclosure').textContent = affiliate
      ? 'Link de afiliado. Podemos receber comissão por compras válidas. Confira modelo, preço, frete e vendedor no anúncio.'
      : 'Esta é uma busca por categoria, não a indicação de um modelo específico. Confira preço, frete e vendedor na Shopee.';
    dialog.showModal();
  }
  function render() {
    const query = normalize(search.value.trim());
    const visible = items.filter(item => (active === 'todos' || item.category === active) && normalize(`${item.name} ${item.label} ${item.description} ${item.keyword}`).includes(query));
    catalog.replaceChildren();
    visible.forEach(item => {
      const article = document.createElement('article'); article.className = `product-card ${item.category}`;
      const visual = document.createElement('div'); visual.className = 'card-cover';
      const top = document.createElement('div'); top.className = 'card-top';
      const number = document.createElement('span'); number.textContent = item.number;
      const label = document.createElement('span'); label.textContent = 'GUIA DE ESCOLHA'; top.append(number, label);
      const word = document.createElement('p'); word.className = 'cover-word'; word.textContent = item.word;
      const bottom = document.createElement('span'); bottom.className = 'cover-label'; bottom.textContent = labels[item.category]; visual.append(top, word, bottom);
      const name = document.createElement('h3'); name.textContent = item.name;
      const description = document.createElement('p'); description.className = 'card-description'; description.textContent = item.description;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'guide-button'; button.textContent = 'Ver o que observar ↗'; button.setAttribute('aria-label', `Ver guia: ${item.name}`); button.addEventListener('click', () => openGuide(item, button));
      article.append(visual, name, description, button); catalog.append(article);
    });
    if (!visible.length) { const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Ainda não temos uma ideia com esse termo. Tente “mesa”, “gaveta” ou “pia”.'; catalog.append(empty); }
    document.getElementById('result-count').textContent = `${visible.length} ${visible.length === 1 ? 'guia encontrado' : 'guias encontrados'}.`;
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    active = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    render();
  }));
  search.addEventListener('input', render);
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { if (lastTrigger?.isConnected) lastTrigger.focus(); });
  async function loadCatalog() {
    const error = document.getElementById('catalog-error'); error.hidden = true;
    try {
      const response = await fetch('/catalogo.json'); if (!response.ok) throw new Error('Catalog unavailable');
      const data = await response.json();
      if (!Array.isArray(data) || !data.every(item => typeof item.name === 'string' && typeof item.keyword === 'string' && typeof item.description === 'string' && typeof item.label === 'string' && Array.isArray(item.checks) && item.category in labels)) throw new Error('Invalid catalog');
      items = data; document.getElementById('catalog-toolbar').hidden = false; render();
    } catch { error.hidden = false; }
  }
  document.getElementById('retry-catalog').addEventListener('click', loadCatalog);
  loadCatalog();
})();
