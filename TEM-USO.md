# Tem Uso

Transição do site para uma curadoria de produtos para casa, organização e rotina, solicitada pelo proprietário em 17/09/2026.

## Identidade

- Nome público: **Tem Uso | Casa & rotina**.
- Nome de usuário sugerido: **@temuso.br**, sujeito à disponibilidade no Instagram; o perfil existente continua em @vendavelonline até a troca efetiva.
- Cores: branco quente `#f8f7f3`, preto `#20201f`, azul `#294fcb`.
- Tom: direto, prático, sem urgência artificial, avaliações inventadas ou promessas de economia não verificadas.
- Foto de ambiente: Conor Sexton, [Unsplash](https://unsplash.com/photos/FytRPOMijMA), usada como inspiração editorial, não como fotografia de produto anunciado.

## Catálogo e comissões

O arquivo `catalogo.json` contém seis guias de categorias, não seis anúncios de produtos específicos. Os botões atuais abrem pesquisas na Shopee. **Não geram comissão de afiliado.**

Para ativar indicações comissionadas:

1. Entrar na conta aprovada no [Programa de Afiliados Shopee](https://affiliate.shopee.com.br/).
2. Selecionar um anúncio, conferir vendedor, avaliações, variação e disponibilidade.
3. Gerar o link rastreável nessa conta e preencher `affiliateUrl` com o link completo, sem inventar identificadores.
4. Atualizar nome, descrição e critérios do item para corresponderem ao anúncio escolhido. Usar somente fotografias autorizadas do produto real.
5. Atualizar o texto da página sobre links atuais caso a seleção passe a incluir links comissionados.
6. Verificar o destino final no celular. A comissão depende de venda válida e das regras vigentes da Shopee; cliques não garantem receita.

O código identifica indicações com link de afiliado no guia e usa `rel="sponsored"`. Aceita somente destinos HTTPS da Shopee.

## Instagram

Bio preparada:

TEM USO
Casa, organização e coisas que facilitam a rotina.
Uma seleção para comprar com critério na Shopee.
Explore: vendeai.dev.br

No app, trocar o campo Nome para **Tem Uso | Casa & rotina** e o link externo para `https://www.vendeai.dev.br/`. A interface web consultada informa que links só podem ser alterados pelo celular. Não trocar o nome de usuário antes de conferir disponibilidade e atualizar as referências do site.

## Clientes existentes

- A plataforma anterior foi preservada em `/vendeai.html` e o catálogo de e-books continua acessível.
- `acesso-clientes.js` encaminha callbacks de autenticação que chegam à raiz para a plataforma anterior, mantendo query e fragmento no mesmo domínio.
- Não houve mudança em banco de dados, permissões, pagamentos ou planos existentes.

## Conteúdo inicial

- Apresentação: por que o perfil passou a selecionar objetos úteis.
- Mesa: como comparar organizadores de cabos pela espessura e fixação.
- Gaveta: três medidas para conferir antes de comprar divisórias.
- Cozinha: drenagem e limpeza de um organizador de pia.

Demonstrar produtos com material próprio ou autorizado. Não afirmar que um produto foi testado sem teste real. Identificar links comissionados.
