/* A demonstração é ilustrativa. A geração personalizada acontece no FREE. */
(() => {
  const result = document.querySelector('#analysisResult');
  if (!result) return;
  const next = document.createElement('div');
  next.className = 'demo-next';
  next.innerHTML = '<p>Esse é um exemplo ilustrativo. Quer testar com a sua conversa? Crie uma conta FREE e use seus 5 créditos diários.</p><button class="primary" id="demo-free">Criar conta grátis e testar minha conversa</button><button class="ghost" id="demo-plans">Comparar PRO e PRO + E-book</button>';
  result.append(next);
  document.querySelector('#demo-free').onclick = () => {
    if (authUser) { showApp(); render('generator'); }
    else openLogin();
  };
  document.querySelector('#demo-plans').onclick = () => window.upgrade();
})();
