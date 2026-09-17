'use strict';
(() => {
  const meals = [
    { id: 'omelete', name: 'Omelete, arroz e salada', note: 'Um clássico para a rotina', ingredients: ['Ovos', 'Arroz', 'Alface', 'Tomate', 'Cebola'] },
    { id: 'macarrao', name: 'Macarrão ao molho de tomate', note: 'Com abobrinha para acompanhar', ingredients: ['Macarrão', 'Molho de tomate', 'Abobrinha', 'Alho', 'Cebola'] },
    { id: 'frango', name: 'Frango, arroz e cenoura', note: 'Comida de casa em um prato', ingredients: ['Frango', 'Arroz', 'Cenoura', 'Alho', 'Cebola'] },
    { id: 'feijao', name: 'Arroz, feijão e couve', note: 'Com ovo para completar', ingredients: ['Arroz', 'Feijão', 'Couve', 'Ovos', 'Alho'] },
    { id: 'sanduiche', name: 'Sanduíche de frango e salada', note: 'Uma ideia para variar o jantar', ingredients: ['Pão', 'Frango', 'Alface', 'Tomate', 'Cenoura'] },
    { id: 'batata', name: 'Batata, ovos e salada', note: 'Ingredientes conhecidos, outra combinação', ingredients: ['Batata', 'Ovos', 'Alface', 'Tomate'] },
    { id: 'lentilha', name: 'Arroz com lentilha e legumes', note: 'Com cenoura e abobrinha', ingredients: ['Arroz', 'Lentilha', 'Cenoura', 'Abobrinha', 'Alho', 'Cebola'] }
  ];
  const selected = new Set(['omelete', 'macarrao', 'frango']);
  const pantry = new Set();
  const options = document.getElementById('meal-options');
  const list = document.getElementById('shopping-list');
  const summary = document.getElementById('selection-summary');
  const download = document.getElementById('download-list');
  const status = document.getElementById('list-status');
  function ingredients() {
    return [...new Set(meals.filter(meal => selected.has(meal.id)).flatMap(meal => meal.ingredients))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }
  function renderList() {
    const names = ingredients();
    summary.textContent = selected.size ? `${selected.size} ${selected.size === 1 ? 'ideia selecionada' : 'ideias selecionadas'} · ${names.length} ingredientes. Risque o que já tem.` : 'Selecione ao menos uma ideia para começar.';
    list.replaceChildren();
    if (!names.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Sua próxima lista começa com um jantar.'; list.append(empty);
    }
    names.forEach(name => {
      const label = document.createElement('label'); label.className = 'shopping-item';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = pantry.has(name); checkbox.setAttribute('aria-label', `Já tenho: ${name}`);
      checkbox.addEventListener('change', () => { if (checkbox.checked) pantry.add(name); else pantry.delete(name); status.textContent = ''; });
      const text = document.createElement('span'); text.textContent = name; label.append(checkbox, text); list.append(label);
    });
    download.disabled = selected.size === 0; status.textContent = '';
  }
  meals.forEach(meal => {
    const label = document.createElement('label'); label.className = 'meal-option';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.name = 'jantar'; checkbox.value = meal.id; checkbox.checked = selected.has(meal.id);
    checkbox.addEventListener('change', () => { if (checkbox.checked) selected.add(meal.id); else selected.delete(meal.id); renderList(); });
    const text = document.createElement('span'); const title = document.createElement('strong'); title.textContent = meal.name; const note = document.createElement('small'); note.textContent = meal.note;
    text.append(title, note); label.append(checkbox, text); options.append(label);
  });
  document.getElementById('clear-list').addEventListener('click', () => {
    selected.clear(); pantry.clear(); options.querySelectorAll('input').forEach(input => { input.checked = false; }); renderList();
  });
  download.addEventListener('click', () => {
    if (!selected.size) return;
    const toBuy = ingredients().filter(name => !pantry.has(name));
    const lines = ['JANTAR RESOLVIDO — MINHA LISTA BASE', '', 'IDEIAS PARA A SEMANA', ...meals.filter(meal => selected.has(meal.id)).map(meal => `• ${meal.name}`), '', 'COMPRAR', ...(toBuy.length ? toBuy.map(name => `☐ ${name}`) : ['Você já marcou todos os ingredientes como disponíveis em casa.']), '', 'Confira também sal, óleo e os temperos de sua preferência.', 'Ajuste as quantidades ao número de pessoas e ao seu consumo.', 'São ideias de combinação, não receitas completas.', '', 'https://www.vendeai.dev.br/'];
    const blob = new Blob(['\ufeff' + lines.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'minha-lista-jantar-resolvido.txt'; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000); status.textContent = 'Lista pronta! Confira o arquivo nos downloads do navegador.';
  });
  document.getElementById('planner-app').hidden = false; renderList();
})();
