/* Only metadata is public; premium bodies are authorized by database RLS. */
(() => {
  const extra = [
  [
    "Diagnóstico do silêncio após o preço",
    "Follow-up",
    "Diferencie falta de prioridade, dúvida e recusa antes de retomar.",
    "PRO",
    "diagnostico-silencio"
  ],
  [
    "Cliente comparou com um concorrente mais barato",
    "Objeções",
    "Compare escopo e entrega sem desvalorizar concorrentes.",
    "PRO",
    "preco-comparacao"
  ],
  [
    "Qualificar antes de mandar o checkout",
    "Fechamento",
    "Descubra necessidade e compatibilidade sem interrogatório.",
    "PRO",
    "qualificacao"
  ],
  [
    "Reativação de lead com contexto novo",
    "Follow-up",
    "Retome contato com motivo real, não com cobrança.",
    "PRO",
    "reativacao"
  ],
  [
    "Reel que responde uma objeção real",
    "Conteúdo",
    "Roteiro com demonstração e CTA coerente com a oferta.",
    "PRO",
    "reel-objecao"
  ],
  [
    "Auditoria de oferta antes do tráfego pago",
    "Anúncios",
    "Encontre a falta de clareza entre anúncio, página e checkout.",
    "PRO",
    "oferta-auditoria"
  ],
  [
    "Apresentar produto sem depoimentos ainda",
    "Fechamento",
    "Use demonstração honesta no lugar de prova social inventada.",
    "PRO",
    "sem-prova"
  ],
  [
    "Abordagem por indicação sem intimidade falsa",
    "Abordagem",
    "Comece uma conversa com origem clara e permissão.",
    "PRO",
    "indicacao-contexto"
  ]
];
  prompts.push(...extra);
  let request = 0;
  window.openPrompt = async (i) => {
    const p = prompts[i];
    if (!p) return;
    const ticket = ++request;
    if (p[3] === 'PRO' && userPlan !== 'PRO') return upgrade();
    if (!p[4]) {
      const task = p[2];
      const text = 'Situação: ' + p[0] + '. Objetivo específico: ' + task +
        ' Dados: [PRODUTO, CANAL, FALA EXATA DO CLIENTE, PRÓXIMO PASSO DESEJADO]. ' +
        'Faça até duas perguntas se faltar contexto. Entregue uma mensagem de até 45 palavras para essa situação e uma alternativa de 20 palavras. Explique quando não enviar. Não invente resultados ou urgência e respeite uma recusa.';
      openModal('<h2>' + esc(p[0]) + '</h2><div class="answer">' + esc(text) + '</div><button class="primary copy">Copiar prompt</button>');
      return;
    }
    openModal('<h2>Carregando prompt Premium</h2><p>Verificando seu acesso...</p>');
    const { data, error } = await sb.from('premium_prompt_content').select('body').eq('slug', p[4]).maybeSingle();
    if (ticket !== request || document.querySelector('#modal').classList.contains('hidden')) return;
    if (error || !data) {
      openModal('<h2>Não foi possível abrir</h2><p>Este conteúdo exige uma conta PRO ativa. Atualize seu plano ou tente novamente.</p>');
      return;
    }
    openModal('<small>PREMIUM · ' + esc(p[1]) + '</small><h2>' + esc(p[0]) + '</h2><p>' + esc(p[2]) + '</p><div class="answer" style="white-space:pre-wrap">' + esc(data.body) + '</div><button class="primary copy">Copiar prompt</button>');
  };
})();

