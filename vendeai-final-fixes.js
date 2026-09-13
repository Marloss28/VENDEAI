/* VendeAI loader: preserva todas as correções existentes e integra a área de e-books. */
document.write('<script src="/vendeai-core-fixes.js"><\/script>');
document.write('<script src="/ebooks-nav.js"><\/script>');

/* Identidade visual oficial: aplica o símbolo em todos os pontos da marca. */
document.addEventListener('DOMContentLoaded', function () {
  var style = document.createElement('style');
  style.textContent = '.brand{display:inline-flex!important;align-items:center;gap:9px}.brand .vendeaiLogo{width:32px;height:32px;display:block;flex:0 0 auto;filter:drop-shadow(0 0 12px #72f59d2e)}';
  document.head.appendChild(style);

  document.querySelectorAll('.brand').forEach(function (brand) {
    if (brand.querySelector('.vendeaiLogo')) return;
    var logo = document.createElement('img');
    logo.className = 'vendeaiLogo';
    logo.src = '/assets/vendeai-logo.svg';
    logo.alt = '';
    logo.width = 32;
    logo.height = 32;
    logo.setAttribute('aria-hidden', 'true');
    brand.prepend(logo);
  });
});
