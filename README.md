# ÓRBITA — projeto web interativo

Uma experiência responsiva com animações, partículas, cartões interativos e minijogos.

## Tecnologias
- **HTML5:** estrutura e conteúdo semântico.
- **CSS3:** design responsivo, animações, layouts, temas e efeitos visuais.
- **JavaScript moderno (ES6+):** partículas em canvas, eventos, menu móvel, temas, bolhas e minijogo.
- **Google Fonts:** tipografia Manrope e DM Mono (requer internet para carregar; há fontes alternativas).

HTML, CSS e JavaScript são suficientes para esta experiência front-end. Não foi adicionada uma linguagem de servidor porque o site não precisa de contas, banco de dados ou API para funcionar.

## Como executar
1. Extraia o ZIP mantendo a estrutura de pastas.
2. Abra `index.html` em um navegador moderno.
3. Para desenvolvimento, você também pode abrir a pasta no VS Code e iniciar um servidor local, por exemplo com a extensão Live Server.

## Estrutura
- `index.html` — conteúdo e estrutura.
- `css/style.css` — aparência, responsividade e animações.
- `js/app.js` — interações e lógica dos jogos.

## Recursos
- Partículas de fundo em Canvas, com densidade adaptada à tela.
- Barra de progresso da rolagem.
- Menu móvel acessível.
- Temas de cores.
- Cartões com inclinação em dispositivos com mouse.
- Efeitos de bolhas, mensagens aleatórias e contador de cliques.
- Jogo de reflexos com recorde local.
- Suporte à preferência `prefers-reduced-motion`.
- Sem bibliotecas de JavaScript externas ou etapa de compilação.

## Expansão interativa
A versão ampliada inclui campo cósmico em Canvas 2D, partículas com interação pelo cursor, explosões de supernova, controle de gravidade, sintetizador de notas usando Web Audio API, objetos arrastáveis com mouse/toque, máquina de humor, oráculo aleatório e três portais de temas visuais. Não exige instalação de dependências.
