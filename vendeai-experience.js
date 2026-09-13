/* VendeAI — experiência e acolhimento pós-login */
(() => {
  const result = document.querySelector('#analysisResult');
  if (result && !result.querySelector('.demo-next')) {
    const next = document.createElement('div');
    next.className = 'demo-next';
    next.innerHTML = '<p>Esse é um exemplo ilustrativo. Quer testar com a sua conversa? Crie uma conta FREE e use seus 5 créditos diários.</p><button class="primary" id="demo-free">Criar conta grátis e testar minha conversa</button><button class="ghost" id="demo-plans">Comparar PRO e PRO + E-book</button>';
    result.append(next);
    const free = document.querySelector('#demo-free');
    const plans = document.querySelector('#demo-plans');
    if (free) free.onclick = () => {
      if ((typeof authUser!=='undefined'?authUser:null)) { showApp(); render('generator'); }
      else openLogin();
    };
    if (plans) plans.onclick = () => window.upgrade?.();
  }

  function safeName() {
    const user = (typeof authUser!=='undefined'?authUser:null);
    const meta = user?.user_metadata || {};
    let name = String(meta.full_name || meta.name || '').trim().split(/\s+/)[0] || '';
    if (!name && user?.email) {
      const raw = String(user.email).split('@')[0].replace(/[._-]+/g, ' ').trim();
      name = raw.split(/\s+/)[0] || '';
    }
    if (!name || /^(admin|user|usuario|usuário|conta)$/i.test(name)) return '';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function welcomeKey() {
    const id = (typeof authUser!=='undefined'?authUser:null)?.id || 'guest';
    const date = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Fortaleza'}).format(new Date());
    return 'vendeai_welcome_' + id + '_' + date;
  }

  function personalizeHeader() {
    const heading = document.querySelector('.apphead h1');
    const paragraph = document.querySelector('.apphead p');
    if (!heading || !(typeof authUser!=='undefined'?authUser:null)) return;
    const name = safeName();
    heading.innerHTML = `${greeting()}, <span>${name ? name : 'que bom ter você aqui'}.</span> 👋`;
    if (paragraph) paragraph.textContent = 'Seu espaço está pronto. O que a gente vai destravar hoje?';
  }

  function welcomeCard() {
    if (!(typeof authUser!=='undefined'?authUser:null) || typeof window.home !== 'function') return;
    const page = document.querySelector('#page');
    if (!page || page.querySelector('.vendeai-welcome')) return;

    const name = safeName();
    const firstToday = !localStorage.getItem(welcomeKey());
    localStorage.setItem(welcomeKey(), '1');

    const card = document.createElement('section');
    card.className = 'vendeai-welcome';
    card.innerHTML = `
      <div class="welcome-mark">✦</div>
      <div class="welcome-copy">
        <small>${firstToday ? 'BEM-VINDO DE VOLTA À VENDEAI' : 'SEU ESPAÇO VENDEAI'}</small>
        <h2>${name ? name + ', ' : ''}${firstToday ? 'bom ter você por aqui.' : 'vamos continuar de onde você parou.'}</h2>
        <p>${firstToday
          ? 'Você não precisa saber a resposta perfeita. Me conte a situação e a VendeAI te ajuda a encontrar o próximo passo, uma conversa de cada vez.'
          : 'Escolha uma situação abaixo e continue. A ideia é simples: menos dúvida na hora de responder e mais clareza no próximo passo.'}</p>
        <div class="welcome-actions">
          <button class="primary" type="button" data-welcome-page="generator">Criar uma mensagem</button>
          <button class="ghost" type="button" data-welcome-page="approach">Montar uma abordagem</button>
        </div>
      </div>
      <span class="welcome-plan">${String((typeof userPlan!=='undefined'?userPlan:'FREE') || 'FREE').toUpperCase()}</span>
    `;

    page.prepend(card);
    card.querySelectorAll('[data-welcome-page]').forEach(btn => {
      btn.addEventListener('click', () => window.render?.(btn.dataset.welcomePage));
    });
  }

  function refreshWelcome() {
    setTimeout(() => {
      personalizeHeader();
      if ((typeof current!=='undefined'?current:'home') === 'home' || document.querySelector('#page .ask')) welcomeCard();
    }, 0);
  }

  // Wrap the app navigation without changing existing authentication logic.
  const originalShowApp = window.showApp;
  if (typeof originalShowApp === 'function') {
    window.showApp = function(...args) {
      const value = originalShowApp.apply(this, args);
      refreshWelcome();
      return value;
    };
  }

  const originalRender = window.render;
  if (typeof originalRender === 'function') {
    window.render = function(page, ...args) {
      const value = originalRender.call(this, page, ...args);
      if (page === 'home') refreshWelcome();
      else setTimeout(personalizeHeader, 0);
      return value;
    };
  }

  document.addEventListener('DOMContentLoaded', refreshWelcome);
  setTimeout(refreshWelcome, 300);
})();
