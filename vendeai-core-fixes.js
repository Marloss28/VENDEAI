/* =========================================================
   VendeAI — correções finais de frontend
   Carregar DEPOIS do script principal do index.html.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);

  const escFinal = (v) => {
    if (typeof window.vendeaiEscape === 'function') return window.vendeaiEscape(v);
    if (typeof window.esc === 'function') return window.esc(v);

    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  };

  /* =========================================================
     1. NÃO JOGAR O USUÁRIO PARA HOME SEM NECESSIDADE
     ========================================================= */

  window.showApp = function showAppFinal() {
    document.querySelector('#landing')?.classList.add('hidden');
    document.querySelector('#app')?.classList.remove('hidden');

    try {
      syncPlanUI();
    } catch (_) {}

    const target =
      typeof current === 'string' && current
        ? current
        : 'home';

    try {
      render(target);
    } catch (error) {
      console.error('VendeAI: falha ao renderizar página atual', error);
    }

    window.scrollTo(0, 0);
  };


  /* =========================================================
     2. RESTAURAÇÃO DE SESSÃO
     Voltar para a aba não manda mais para Home.
     ========================================================= */

  try {
    document.removeEventListener(
      'DOMContentLoaded',
      vendeaiRestoreSession
    );

    window.removeEventListener(
      'pageshow',
      vendeaiRestoreSession
    );
  } catch (_) {}

  window.vendeaiRestoreSession =
    async function vendeaiRestoreSessionFinal() {

      if (window.__vendeaiRestoringFinal) return;

      window.__vendeaiRestoringFinal = true;

      try {

        const { data, error } =
          await sb.auth.getSession();

        if (error) {
          console.error(
            'Erro ao restaurar sessão:',
            error
          );
          return;
        }

        const session = data?.session;

        if (!session?.user) return;

        authUser = session.user;

        const app =
          document.querySelector('#app');

        const landing =
          document.querySelector('#landing');

        const appWasHidden =
          !!app?.classList.contains('hidden');

        await loadProfile();

        landing?.classList.add('hidden');
        app?.classList.remove('hidden');

        if (appWasHidden) {
          document
            .querySelector('#modal')
            ?.classList.add('hidden');
        }

        try {
          syncPlanUI();
        } catch (_) {}

        /*
          NÃO existe render('home') aqui.
          Mantém a ferramenta que o usuário estava usando.
        */

        if (
          appWasHidden &&
          typeof current === 'string' &&
          current
        ) {
          render(current);
          window.scrollTo(0, 0);
        }

      } catch (error) {

        console.error(
          'Não foi possível restaurar a conta:',
          error
        );

      } finally {

        window.__vendeaiRestoringFinal = false;

      }
    };

  document.addEventListener(
    'DOMContentLoaded',
    window.vendeaiRestoreSession
  );

  window.addEventListener(
    'pageshow',
    window.vendeaiRestoreSession
  );


  /* =========================================================
     3. NAVEGAÇÃO
     Evita execução dupla dos handlers antigos.
     ========================================================= */

  document.addEventListener(
    'click',

    (event) => {

      const pageButton =
        event.target.closest?.('[data-page]');

      if (!pageButton) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (!authUser) {
        openLogin();
        return;
      }

      document
        .querySelector('#landing')
        ?.classList.add('hidden');

      document
        .querySelector('#app')
        ?.classList.remove('hidden');

      try {
        syncPlanUI();
      } catch (_) {}

      render(pageButton.dataset.page);

      document
        .querySelector('aside')
        ?.classList.remove('open');

    },

    true
  );


  /* =========================================================
     4. DEMONSTRAÇÃO DA LANDING
     Não simula mais uma análise real da IA.
     ========================================================= */

  const demoButton =
    document.querySelector('#analyze');

  const demoResult =
    document.querySelector('#analysisResult');

  if (demoButton && demoResult) {

    demoButton.textContent =
      '✦ Ver exemplo de análise';

    const label =
      demoResult.querySelector('small');

    if (label) {
      label.textContent =
        'EXEMPLO ILUSTRATIVO DA VENDEAI';
    }

    demoButton.onclick = () => {

      demoResult.classList.remove('hidden');

      demoButton.textContent =
        '✓ Exemplo exibido';

    };
  }


  /* =========================================================
     5. IDENTIFICA O TIPO CORRETO DE FERRAMENTA PRO
     ========================================================= */

  function inferProMode(prompt) {

    const text =
      String(prompt || '').toLowerCase();

    if (
      text.includes(
        'assistente de vendas da vendeai'
      ) ||
      text.includes(
        'ajude o vendedor a decidir o melhor próximo passo'
      )
    ) {
      return 'assistant';
    }

    if (
      text.includes(
        'analise cuidadosamente a conversa'
      ) ||
      text.includes(
        'nível de interesse'
      )
    ) {
      return 'conversation_analysis';
    }

    if (
      text.includes(
        'tratamento ético de objeções'
      ) ||
      text.includes(
        'objeção exata do cliente'
      )
    ) {
      return 'objection';
    }

    if (
      text.includes(
        'especialista em follow-up'
      ) ||
      text.includes(
        'tempo desde o último contato'
      )
    ) {
      return 'followup';
    }

    if (
      text.includes(
        'estrategista de conteúdo'
      ) ||
      text.includes(
        'conteúdo completo'
      )
    ) {
      return 'content';
    }

    return 'sales_message';
  }


  /* =========================================================
     6. CHAMADA REAL DA IA PRO
     ========================================================= */

  window.vendeaiCallProAI =
    async function vendeaiCallProAIFinal(
      prompt,
      mode
    ) {

      if (!authUser) {

        openLogin();

        throw new Error(
          'login_required'
        );
      }

      const selectedMode =
        mode || inferProMode(prompt);

      const { data, error } =
        await sb.functions.invoke(
          'vendeai-ai',
          {
            body: {
              input: prompt,
              mode: selectedMode
            }
          }
        );

      if (error) {

        throw new Error(
          error.message ||
          'Não foi possível conectar à IA.'
        );
      }

      if (!data?.text) {

        const message =
          data?.error === 'no_credits'
            ? 'Seus créditos de IA acabaram por hoje.'
            : data?.error ||
              'A IA não retornou uma resposta.';

        throw new Error(message);
      }

      try {
        await loadProfile();
      } catch (_) {}

      return data.text;
    };


  /* =========================================================
     7. NOMES DAS FERRAMENTAS NO HISTÓRICO
     ========================================================= */

  function featureName(feature) {

    const names = {

      sales_message:
        'Mensagem de vendas',

      assistant:
        'Assistente de Vendas',

      conversation_analysis:
        'Análise de conversa',

      objection:
        'Objeções',

      followup:
        'Follow-up',

      content:
        'Conteúdo',

      generator:
        'Gerador'

    };

    return (
      names[
        String(feature || '')
          .toLowerCase()
      ] ||
      String(
        feature ||
        'Geração IA'
      )
    );
  }


  function formatHistoryDate(value) {

    try {

      return new Intl.DateTimeFormat(
        'pt-BR',
        {
          dateStyle: 'short',
          timeStyle: 'short'
        }
      ).format(
        new Date(value)
      );

    } catch (_) {

      return '';

    }
  }


  /* =========================================================
     8. HISTÓRICO REAL DO SUPABASE
     ========================================================= */

  window.vendeaiRenderHistory =
    async function vendeaiRenderHistory() {

      const pageEl =
        document.querySelector('#page');

      if (!pageEl) return;

      if (!authUser) {

        openLogin();

        return;
      }

      pageEl.innerHTML = `
        <div class="pageTitle">

          <h2>Histórico</h2>

          <p>
            Suas mensagens e análises
            geradas pela VendeAI.
          </p>

        </div>

        <div class="toolbox">

          <small
            style="color:var(--accent)"
          >
            ✦ Carregando histórico...
          </small>

        </div>
      `;


      const { data, error } =
        await sb
          .from('generation_history')
          .select(
            'id,feature,input,output,credits_used,created_at'
          )
          .eq(
            'user_id',
            authUser.id
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          )
          .limit(50);


      if (error) {

        console.error(
          'Erro ao carregar histórico:',
          error
        );

        try {
          logClientError(
            error,
            'history'
          );
        } catch (_) {}

        pageEl.innerHTML = `
          <div class="pageTitle">

            <h2>Histórico</h2>

            <p>
              Suas mensagens e análises
              geradas pela VendeAI.
            </p>

          </div>

          <div class="toolbox">

            Não foi possível carregar
            o histórico agora.

            <br><br>

            <button
              class="primary"
              onclick="vendeaiRenderHistory()"
            >
              Tentar novamente
            </button>

          </div>
        `;

        return;
      }


      const rows =
        Array.isArray(data)
          ? data
          : [];


      if (!rows.length) {

        pageEl.innerHTML = `
          <div class="pageTitle">

            <h2>Histórico</h2>

            <p>
              Suas mensagens e análises
              geradas pela VendeAI.
            </p>

          </div>

          <div class="toolbox">

            Você ainda não possui
            gerações salvas.

            <br><br>

            <button
              class="primary"
              onclick="render('generator')"
            >
              Criar minha primeira mensagem
            </button>

          </div>
        `;

        return;
      }


      const cards =
        rows.map(row => {

          const output =
            typeof row.output === 'string'
              ? row.output
              : JSON.stringify(
                  row.output ?? '',
                  null,
                  2
                );

          const input =
            typeof row.input === 'string'
              ? row.input
              : JSON.stringify(
                  row.input ?? '',
                  null,
                  2
                );


          return `
            <div
              class="generated"
              style="margin-top:12px"
            >

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  gap:12px;
                  flex-wrap:wrap
                "
              >

                <small
                  style="
                    color:var(--accent);
                    font-weight:900
                  "
                >
                  ${escFinal(
                    featureName(
                      row.feature
                    )
                  )}
                </small>

                <small
                  style="
                    color:var(--muted)
                  "
                >

                  ${escFinal(
                    formatHistoryDate(
                      row.created_at
                    )
                  )}

                  ${
                    row.credits_used
                      ? ` • ${Number(
                          row.credits_used
                        )} crédito`
                      : ''
                  }

                </small>

              </div>


              ${
                input
                  ? `
                    <details
                      style="
                        margin-top:12px
                      "
                    >

                      <summary
                        style="
                          cursor:pointer;
                          color:var(--muted)
                        "
                      >
                        Ver contexto enviado
                      </summary>

                      <div
                        class="answer"
                        style="
                          white-space:pre-wrap
                        "
                      >
                        ${escFinal(input)}
                      </div>

                    </details>
                  `
                  : ''
              }


              <div
                class="resultMessage"
                style="
                  white-space:pre-wrap;
                  margin-top:12px
                "
              >
                ${escFinal(output)}
              </div>


              <div
                class="generatedActions"
              >

                <button
                  class="ghost"
                  data-history-copy
                  data-history-id="${escFinal(
                    row.id
                  )}"
                >
                  Copiar resultado
                </button>

              </div>

            </div>
          `;

        }).join('');


      pageEl.innerHTML = `
        <div class="pageTitle">

          <h2>Histórico</h2>

          <p>
            Últimas ${rows.length}
            gerações feitas na sua conta.
          </p>

        </div>

        <div
          style="max-width:900px"
        >
          ${cards}
        </div>
      `;


      pageEl
        .querySelectorAll(
          '[data-history-copy]'
        )
        .forEach(
          (button, index) => {

            button.onclick =
              async () => {

                const row =
                  rows[index];

                const text =
                  typeof row.output === 'string'
                    ? row.output
                    : JSON.stringify(
                        row.output ?? '',
                        null,
                        2
                      );

                try {

                  await navigator.clipboard
                    .writeText(text);

                  toast(
                    'Resultado copiado ✓'
                  );

                } catch (_) {

                  toast(
                    'Não foi possível copiar'
                  );

                }

              };

          }
        );
    };


  /* =========================================================
     9. INTERCEPTA SOMENTE A PÁGINA DE HISTÓRICO
     Mantém o Admin Guard já existente.
     ========================================================= */

  const previousRender =
    window.render;

  window.render =
    function renderFinal(page) {

      if (page === 'history') {

        try {
          setActive('history');
        } catch (_) {}

        window
          .vendeaiRenderHistory();

        return;
      }

      return previousRender(page);
    };


  /* =========================================================
     10. LIMPA ESTADO APÓS LOGOUT
     ========================================================= */

  if (
    typeof window.logout ===
    'function'
  ) {

    const oldLogout =
      window.logout;

    window.logout =
      async function logoutFinal() {

        try {

          await oldLogout();

        } finally {

          try {
            current = 'home';
          } catch (_) {}

        }
      };
  }


  console.log(
    '%cVendeAI — correções finais carregadas',
    'color:#72f59d;font-weight:bold'
  );

})();
/* =========================================================
   VendeAI — Hotfix Gerador + Histórico
   ========================================================= */
(() => {
  'use strict';

  const htmlEscape = (value) =>
    String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  /* =========================
     GERADOR
     ========================= */

  window.generateMessage = async function () {
    const goal = document.querySelector('#goal')?.value || '';
    const channel = document.querySelector('#channel')?.value || '';
    const tone = document.querySelector('#tone')?.value || '';
    const situation =
      document.querySelector('#situation')?.value.trim() || '';

    if (!situation) {
      toast('Conte a situação antes de gerar');
      document.querySelector('#situation')?.focus();
      return;
    }

    if (!authUser) {
      openLogin();
      return;
    }

    let out = document.querySelector('#generated');

    if (!out) return;

    out.innerHTML = `
      <div class="generated">
        <small>✦ VendeAI está escrevendo...</small>
      </div>
    `;

    const input =
      `Objetivo: ${goal}\n` +
      `Canal: ${channel}\n` +
      `Tom: ${tone}\n` +
      `Contexto: ${situation}`;

    try {
      const { data, error } =
        await sb.functions.invoke('vendeai-ai', {
          body: {
            input,
            mode: 'sales_message'
          }
        });

      if (error || !data?.text) {
        out = document.querySelector('#generated');

        if (out) {
          out.innerHTML = `
            <div class="generated">
              <b>Não consegui gerar agora.</b>
              <p>
                ${htmlEscape(
                  data?.error ||
                  error?.message ||
                  'Tente novamente.'
                )}
              </p>
            </div>
          `;
        }

        return;
      }

      /*
        Atualiza os créditos SEM renderizar novamente
        a página do Gerador.
      */
      if (
        data.credits_remaining !== undefined &&
        data.credits_remaining !== null
      ) {
        try {
          aiCredits = Number(data.credits_remaining);
          syncPlanUI();
        } catch (_) {}
      }

      /*
        Procura novamente o elemento atual.
        Assim nunca escreve em um elemento antigo.
      */
      out = document.querySelector('#generated');

      if (!out) return;

      out.innerHTML = `
        <div class="generated resultReady">

          <small>
            ANÁLISE + MENSAGEM PRONTA
          </small>

          <div class="resultMeta">
            <span>🔥 Próximo passo identificado</span>
            <span>${htmlEscape(channel)}</span>
            <span>${htmlEscape(tone)}</span>
          </div>

          <div class="contextHint">
            <span>◎</span>

            <div>
              <b>O que fazer agora</b><br>
              ${htmlEscape(goal)}
              sem perder o contexto da conversa.
              Revise a mensagem abaixo e envie
              quando fizer sentido.
            </div>
          </div>

          <div
            class="resultMessage"
            id="mainGenerated"
            style="white-space:pre-wrap"
          >${htmlEscape(data.text)}</div>

          <div class="generatedActions">

            <button
              class="ghost"
              onclick="copyGenerated()"
            >
              Copiar mensagem
            </button>

            <button
              class="ghost"
              onclick="makeShorter()"
            >
              Mais curta
            </button>

            <button
              class="ghost"
              onclick="makeNatural()"
            >
              Mais natural
            </button>

            <button
              class="ghost"
              onclick="generateAnother()"
            >
              ↻ Gerar outra
            </button>

          </div>

        </div>
      `;

    } catch (error) {
      out = document.querySelector('#generated');

      if (out) {
        out.innerHTML = `
          <div class="generated">
            <b>Não consegui gerar agora.</b>
            <p>
              ${htmlEscape(
                error?.message ||
                'Tente novamente.'
              )}
            </p>
          </div>
        `;
      }
    }
  };


  /* =========================
     HISTÓRICO
     ========================= */

  window.vendeaiRenderHistory = async function () {
    const pageEl =
      document.querySelector('#page');

    if (!pageEl) return;

    if (!authUser) {
      openLogin();
      return;
    }

    pageEl.innerHTML = `
      <div class="pageTitle">
        <h2>Histórico</h2>
        <p>
          Suas mensagens e análises
          geradas pela VendeAI.
        </p>
      </div>

      <div class="toolbox">
        <small style="color:var(--accent)">
          ✦ Carregando histórico...
        </small>
      </div>
    `;

    const { data, error } =
      await sb
        .from('generation_history')
        .select(
          'id,feature,input_text,output_text,credits_used,created_at'
        )
        .eq('user_id', authUser.id)
        .order('created_at', {
          ascending: false
        })
        .limit(50);

    if (error) {
      console.error(
        'Erro ao carregar histórico:',
        error
      );

      pageEl.innerHTML = `
        <div class="pageTitle">
          <h2>Histórico</h2>
        </div>

        <div class="toolbox">
          Não foi possível carregar
          o histórico agora.

          <br><br>

          <button
            class="primary"
            onclick="vendeaiRenderHistory()"
          >
            Tentar novamente
          </button>
        </div>
      `;

      return;
    }

    const rows =
      Array.isArray(data) ? data : [];

    if (!rows.length) {
      pageEl.innerHTML = `
        <div class="pageTitle">
          <h2>Histórico</h2>

          <p>
            Suas mensagens e análises
            aparecerão aqui.
          </p>
        </div>

        <div class="toolbox">
          Você ainda não possui
          gerações salvas.
        </div>
      `;

      return;
    }

    const cards =
      rows.map(row => {
        const date =
          row.created_at
            ? new Date(
                row.created_at
              ).toLocaleString('pt-BR')
            : '';

        return `
          <div
            class="generated resultReady"
            style="margin-bottom:14px"
          >

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:10px;
                flex-wrap:wrap
              "
            >
              <small
                style="
                  color:var(--accent);
                  font-weight:900
                "
              >
                ${htmlEscape(
                  row.feature ||
                  'Geração IA'
                )}
              </small>

              <small
                style="color:var(--muted)"
              >
                ${htmlEscape(date)}
                •
                ${Number(
                  row.credits_used || 1
                )}
                crédito
              </small>
            </div>

            ${
              row.input_text
                ? `
                  <details
                    style="margin-top:12px"
                  >
                    <summary
                      style="
                        cursor:pointer;
                        color:var(--muted)
                      "
                    >
                      Ver contexto enviado
                    </summary>

                    <div
                      style="
                        white-space:pre-wrap;
                        margin-top:10px
                      "
                    >
                      ${htmlEscape(
                        row.input_text
                      )}
                    </div>
                  </details>
                `
                : ''
            }

            <div
              class="resultMessage"
              style="
                white-space:pre-wrap;
                margin-top:15px
              "
            >
              ${htmlEscape(
                row.output_text || ''
              )}
            </div>

            <div
              class="generatedActions"
              style="margin-top:12px"
            >

              <button
                class="ghost"
                data-copy-history="${row.id}"
              >
                Copiar resultado
              </button>

            </div>

          </div>
        `;
      }).join('');

    pageEl.innerHTML = `
      <div class="pageTitle">
        <h2>Histórico</h2>

        <p>
          Últimas ${rows.length}
          gerações feitas na sua conta.
        </p>
      </div>

      <div style="max-width:900px">
        ${cards}
      </div>
    `;

    rows.forEach(row => {
      const button =
        pageEl.querySelector(
          `[data-copy-history="${row.id}"]`
        );

      if (!button) return;

      button.onclick = async () => {
        try {
          await navigator.clipboard.writeText(
            row.output_text || ''
          );

          toast('Resultado copiado ✓');
        } catch (_) {
          toast(
            'Não foi possível copiar'
          );
        }
      };
    });
  };

  console.log(
    'VendeAI — Gerador e Histórico corrigidos'
  );
})();
/* =========================================================
   VendeAI — Oferta PRO + E-book
   ========================================================= */
(() => {
  'use strict';

  const VENDEAI_COMBO_CHECKOUT =
    'https://pay.cakto.com.br/dxdncoc_1098833';

  window.goToCheckout = function () {
    try {
      trackEvent('checkout_click');
    } catch (_) {}

    window.open(
      VENDEAI_COMBO_CHECKOUT,
      '_blank',
      'noopener,noreferrer'
    );
  };

  window.upgrade = function () {
    openModal(`
      <div style="text-align:center">

        <small
          style="
            color:var(--accent);
            font-weight:900;
            letter-spacing:1.5px
          "
        >
          OFERTA ESPECIAL
        </small>

        <h2 style="margin-top:10px">
          VendeAI PRO + E-book
        </h2>

        <p>
          Desbloqueie todo o potencial da VendeAI
          e leve também o e-book
          <b>Primeira Venda do Zero com IA</b>.
        </p>

        <div
          class="pricecard"
          style="
            padding:20px;
            margin:20px 0;
            text-align:center
          "
        >

          <small
            style="
              display:block;
              color:var(--muted);
              margin-bottom:4px
            "
          >
            De
            <span
              style="
                text-decoration:line-through;
                font-size:16px
              "
            >
              R$ 59,90
            </span>
          </small>

          <div
            style="
              font-size:13px;
              color:var(--muted)
            "
          >
            por apenas
          </div>

          <b
            style="
              display:block;
              font-size:38px;
              margin:2px 0;
              color:var(--accent)
            "
          >
            R$ 39,89
          </b>

          <small
            style="
              display:block;
              color:var(--muted)
            "
          >
            pagamento único
          </small>

        </div>

        <div
          style="
            text-align:left;
            line-height:2;
            margin:18px 0;
            color:#dbe1dd
          "
        >
          ✓ VendeAI PRO completo<br>
          ✓ 50 créditos de IA renovados diariamente<br>
          ✓ Assistente de vendas com IA<br>
          ✓ Análise de conversas<br>
          ✓ Objeções e follow-ups<br>
          ✓ Biblioteca PRO completa<br>
          ✓ Histórico de gerações<br>
          ✓ E-book <b>Primeira Venda do Zero com IA</b>
        </div>

        <div
          class="contextHint"
          style="
            text-align:left;
            margin:18px 0
          "
        >
          <span>✦</span>

          <div>
            <b>Importante</b><br>
            Use na Cakto o
            <b>mesmo e-mail da sua conta VendeAI</b>.
            É através dele que o PRO será
            liberado automaticamente.
          </div>
        </div>

        <button
          class="primary"
          onclick="goToCheckout()"
          style="
            width:100%;
            font-size:15px;
            padding:14px
          "
        >
          Quero o PRO + E-book por R$ 39,89 →
        </button>

        <small
          style="
            display:block;
            color:var(--muted);
            margin-top:12px
          "
        >
          Checkout seguro pela Cakto
        </small>

      </div>
    `);
  };

  /*
    Garante que todos os botões PRO existentes
    utilizem a nova oferta.
  */
  document
    .querySelectorAll('[data-pro]')
    .forEach(button => {
      button.onclick = window.upgrade;
    });

  console.log(
    'VendeAI — oferta PRO + E-book carregada'
  );
})();
/* =========================================================
   VendeAI — Contador de reserva da oferta PRO
   ========================================================= */
(() => {
  'use strict';

  let vendeaiOfferTimer = null;

  function startVendeAIOfferTimer(seconds = 15 * 60) {
    clearInterval(vendeaiOfferTimer);

    let remaining = seconds;

    const renderTimer = () => {
      const timer = document.querySelector('#vendeaiOfferTimer');
      const label = document.querySelector('#vendeaiOfferTimerLabel');

      if (!timer) {
        clearInterval(vendeaiOfferTimer);
        return;
      }

      const minutes = Math.floor(remaining / 60);
      const secs = remaining % 60;

      timer.textContent =
        `${String(minutes).padStart(2, '0')}:` +
        `${String(secs).padStart(2, '0')}`;

      if (remaining <= 0) {
        clearInterval(vendeaiOfferTimer);

        timer.textContent = '00:00';

        if (label) {
          label.textContent =
            'Tempo da reserva encerrado';
        }

        return;
      }

      remaining--;
    };

    renderTimer();

    vendeaiOfferTimer =
      setInterval(renderTimer, 1000);
  }

  const oldUpgrade =
    window.upgrade;

  window.upgrade = function () {
    oldUpgrade();

    const modalBox =
      document.querySelector('#modalContent');

    if (!modalBox) return;

    const timerBox =
      document.createElement('div');

    timerBox.innerHTML = `
      <div
        style="
          margin:16px 0;
          padding:12px 14px;
          border:1px solid #3a473d;
          background:#111612;
          border-radius:10px;
          text-align:center
        "
      >
        <small
          id="vendeaiOfferTimerLabel"
          style="
            display:block;
            color:var(--muted);
            margin-bottom:4px
          "
        >
          Sua oferta está reservada por
        </small>

        <b
          id="vendeaiOfferTimer"
          style="
            display:block;
            color:var(--accent);
            font-size:24px;
            letter-spacing:1px
          "
        >
          15:00
        </b>
      </div>
    `;

    const priceCard =
      modalBox.querySelector('.pricecard');

    if (priceCard) {
      priceCard.insertAdjacentElement(
        'afterend',
        timerBox.firstElementChild
      );
    }

    startVendeAIOfferTimer();
  };

  document
    .querySelectorAll('[data-pro]')
    .forEach(button => {
      button.onclick = window.upgrade;
    });

  console.log(
    'VendeAI — contador da oferta carregado'
  );
})();
