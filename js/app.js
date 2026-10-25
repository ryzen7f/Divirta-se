/* ÓRBITA — interações, animações e minijogos sem dependências. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let toastTimer;

  function toast(message) {
    const element = $('#toast');
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 2300);
  }

  // Canvas com partículas: escala pelo dispositivo e reduz trabalho em telas menores.
  const canvas = $('#particleCanvas');
  const context = canvas?.getContext('2d', { alpha: true });
  let particles = [];
  let frameId = 0;
  let width = 0;
  let height = 0;
  const pointer = { x: -1000, y: -1000 };

  function resizeCanvas() {
    if (!canvas || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.7);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const amount = Math.min(width < 600 ? 34 : 75, Math.floor(width / 14));
    particles = Array.from({ length: amount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + .35,
      alpha: Math.random() * .7 + .2,
      speed: Math.random() * .22 + .04,
      drift: (Math.random() - .5) * .12
    }));
  }

  function drawParticles() {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.y -= reducedMotion ? 0 : particle.speed;
      particle.x += particle.drift;
      if (particle.y < -3) { particle.y = height + 3; particle.x = Math.random() * width; }
      if (particle.x < -3) particle.x = width + 3;
      if (particle.x > width + 3) particle.x = -3;
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 110 && distance > 0 && !reducedMotion) {
        particle.x += (dx / distance) * .45;
        particle.y += (dy / distance) * .45;
      }
      context.globalAlpha = particle.alpha;
      context.fillStyle = '#d9e5ff';
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    frameId = requestAnimationFrame(drawParticles);
  }

  if (canvas && context) {
    resizeCanvas();
    drawParticles();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(frameId);
      else if (!reducedMotion) drawParticles();
    });
  }

  // Cursor luminoso e pontos magnéticos só em dispositivos com mouse.
  const glow = $('.cursor-glow');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (finePointer && !reducedMotion) {
    document.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (glow) {
        glow.style.left = `${event.clientX}px`;
        glow.style.top = `${event.clientY}px`;
      }
      $$('.magnetic-demo').forEach((demo) => {
        const rect = demo.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom;
        $$('.magnet-dot', demo).forEach((dot, index) => {
          if (!inside) { dot.style.transform = ''; return; }
          const dotRect = dot.getBoundingClientRect();
          const dx = dotRect.left + dotRect.width / 2 - event.clientX;
          const dy = dotRect.top + dotRect.height / 2 - event.clientY;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const strength = Math.max(0, 1 - distance / 150) * 17;
          dot.style.transform = `translate(${dx / distance * strength}px, ${dy / distance * strength}px)`;
        });
      });
    }, { passive: true });
  }

  // Menu acessível para celular.
  const menuButton = $('#menuButton');
  const mobileNav = $('#mobileNav');
  menuButton?.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    menuButton.textContent = isOpen ? '×' : '☰';
  });
  $$('#mobileNav a').forEach((link) => link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) { menuButton.textContent = '☰'; menuButton.setAttribute('aria-label', 'Abrir menu'); }
  }));

  // Barra de progresso de rolagem.
  const progress = $('#scrollProgress');
  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      if (progress) progress.style.width = `${percent}%`;
      scrollQueued = false;
    });
  }, { passive: true });

  // Revela seções quando entram no campo de visão.
  const revealElements = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  // Inclinação delicada dos cartões com mouse; desativada em telas de toque.
  if (finePointer && !reducedMotion) {
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 4}deg) rotateY(${(x - 0.5) * 4}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Troca de paletas preservando a leitura e o contraste geral.
  const palettes = ['violet', 'ocean', 'pink', 'lime'];
  let paletteIndex = 0;
  $('#themeButton')?.addEventListener('click', () => {
    paletteIndex = (paletteIndex + 1) % palettes.length;
    document.documentElement.dataset.palette = palettes[paletteIndex];
    toast(`Dimensão alterada: ${palettes[paletteIndex]}`);
  });
  $$('[data-palette]').forEach((button) => button.addEventListener('click', () => {
    document.documentElement.dataset.palette = button.dataset.palette;
    paletteIndex = Math.max(0, palettes.indexOf(button.dataset.palette));
    toast(`Nova atmosfera: ${button.dataset.palette}`);
  }));

  // Bolhas visuais em elementos específicos.
  function spawnBubble(container, count = 1) {
    if (!container) return;
    container.classList.add('has-bubbles');
    for (let i = 0; i < count; i += 1) {
      const bubble = document.createElement('span');
      const size = 12 + Math.random() * 32;
      bubble.className = 'live-bubble';
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 94}%`;
      bubble.style.setProperty('--duration', `${3.5 + Math.random() * 3.5}s`);
      bubble.style.setProperty('--drift', `${(Math.random() - .5) * 90}px`);
      container.appendChild(bubble);
      setTimeout(() => bubble.remove(), 7500);
    }
  }
  $$('[data-bubbles]').forEach((button) => button.addEventListener('click', () => {
    spawnBubble($('#bubbleSpace'), 9);
    toast('Bolhas liberadas. A ciência não sabe por quê.');
  }));
  const bubbleSpace = $('#bubbleSpace');
  let bubbleCount = 0;
  function countBubbles(count) {
    bubbleCount += count;
    const output = $('#bubbleCount');
    if (output) output.textContent = String(bubbleCount);
  }
  function createCountedBubbles(count) {
    spawnBubble(bubbleSpace, count);
    countBubbles(count);
  }
  bubbleSpace?.addEventListener('click', (event) => {
    const rect = bubbleSpace.getBoundingClientRect();
    const bubble = document.createElement('span');
    const size = 15 + Math.random() * 35;
    bubble.className = 'live-bubble';
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.max(0, Math.min(95, ((event.clientX - rect.left) / rect.width) * 100))}%`;
    bubble.style.setProperty('--duration', `${3.5 + Math.random() * 3.5}s`);
    bubble.style.setProperty('--drift', `${(Math.random() - .5) * 90}px`);
    bubbleSpace.appendChild(bubble);
    bubbleSpace.classList.add('has-bubbles');
    countBubbles(1);
    setTimeout(() => bubble.remove(), 7500);
  });
  $('#bubbleWave')?.addEventListener('click', () => {
    createCountedBubbles(18);
    toast('Uma onda de bolhas está a caminho!');
  });

  // Velocidade orbital.
  let orbitFast = false;
  $('#orbitToggle')?.addEventListener('click', () => {
    orbitFast = !orbitFast;
    $$('.orbit-preview span').forEach((orbit, index) => {
      orbit.style.animationDuration = orbitFast ? `${1.2 + index * .35}s` : `${7 + index * 3}s`;
    });
    toast(orbitFast ? 'Órbita em velocidade absurda!' : 'Planeta em passeio tranquilo.');
  });

  // Botões sem objetivo, mas com resposta.
  const mysteryMessages = [
    'Parabéns. Você clicou em um botão e o universo continua.',
    'Segredo desbloqueado: este botão não tinha segredo.',
    'Processando… curiosidade encontrada. Nenhuma ação necessária.',
    'O botão agradece a atenção. Ele é meio carente.',
    'Você acaba de perder 0,4 segundos. Excelente investimento.'
  ];
  $('#mysteryButton')?.addEventListener('click', () => {
    toast(mysteryMessages[Math.floor(Math.random() * mysteryMessages.length)]);
  });
  const adventures = [
    'Missão: encontre um objeto azul perto de você.',
    'Alerta cósmico: relaxar por dez segundos é permitido.',
    'Faça um alongamento rápido. Seu corpo enviou uma notificação.',
    'Invente um nome para uma estrela imaginária.',
    'Observe algo ao redor como se fosse um artefato alienígena.',
    'Tome um gole de água e volte para a exploração.',
    'Pense num animal. Agora imagine-o pilotando uma nave.'
  ];
  $('#randomAdventure')?.addEventListener('click', () => {
    toast(adventures[Math.floor(Math.random() * adventures.length)]);
    spawnBubble($('#bubbleSpace'), 6);
  });

  // Contador com efeito de onda e reinício.
  let clicks = 0;
  const clickCount = $('#clickCount');
  const bigClick = $('#bigClick');
  function renderClicks() {
    if (clickCount) clickCount.textContent = String(clicks).padStart(4, '0');
  }
  bigClick?.addEventListener('click', () => {
    clicks += 1;
    renderClicks();
    bigClick.classList.remove('popped');
    void bigClick.offsetWidth;
    bigClick.classList.add('popped');
    if (clicks % 25 === 0) toast(`${clicks} cliques. A persistência é admirável.`);
  });
  $('#resetClicks')?.addEventListener('click', () => {
    clicks = 0;
    renderClicks();
    toast('Contador zerado. A história recomeça.');
  });

  // Mensagens aleatórias, com texto seguro e sem HTML dinâmico.
  const quotes = [
    'O universo é enorme. Sua lista de tarefas pode esperar mais um minuto.',
    'Você não precisa descobrir tudo hoje. Nem tudo precisa ser descoberto.',
    'A curiosidade é uma porta que nunca fica sem maçaneta.',
    'Pequenas pausas também fazem parte da jornada.',
    'Em algum lugar, uma estrela está fazendo exatamente o que você: brilhando sem motivo.',
    'Se a vida fosse um jogo, explorar sem mapa também seria uma estratégia.'
  ];
  $('#newQuote')?.addEventListener('click', () => {
    const quote = $('#quoteText');
    if (quote) quote.textContent = `“${quotes[Math.floor(Math.random() * quotes.length)]}”`;
  });
  const missions = [
    'Encontre algo que tenha uma textura interessante.',
    'Dê um nome para a nuvem mais próxima que conseguir ver.',
    'Faça uma pausa de 5 segundos e respire com calma.',
    'Pense em uma invenção completamente desnecessária.',
    'Escolha uma cor e encontre três coisas dessa cor.',
    'Imagine um planeta onde a chuva é feita de pipoca.',
    'Invente uma saudação para extraterrestres.'
  ];
  $('#newMission')?.addEventListener('click', () => {
    const result = $('#missionResult');
    if (result) {
      result.textContent = missions[Math.floor(Math.random() * missions.length)];
      const cursor = document.createElement('span');
      cursor.textContent = '_';
      result.appendChild(cursor);
    }
  });

  // Jogo de reflexos: duração limitada, área responsiva e recorde local.
  const targetField = $('#targetField');
  const targetButton = $('#targetButton');
  const startGameButton = $('#startGame');
  const scoreOutput = $('#gameScore');
  const timeOutput = $('#gameTime');
  const statusOutput = $('#gameStatus');
  const titleOutput = $('#gameTitle');
  const descriptionOutput = $('#gameDescription');
  const bestOutput = $('#gameBest');
  let gameActive = false;
  let gameScore = 0;
  let timeLeft = 15;
  let gameInterval = null;
  let bestScore = 0;
  try { bestScore = Number(localStorage.getItem('orbita-best') || 0); } catch { /* armazenamento pode estar bloqueado */ }
  if (bestOutput) bestOutput.textContent = String(bestScore).padStart(2, '0');

  function moveTarget() {
    if (!targetField || !targetButton) return;
    const maxX = Math.max(0, targetField.clientWidth - targetButton.offsetWidth - 12);
    const maxY = Math.max(0, targetField.clientHeight - targetButton.offsetHeight - 12);
    targetButton.style.left = `${6 + Math.random() * maxX}px`;
    targetButton.style.top = `${6 + Math.random() * maxY}px`;
  }
  function finishGame() {
    gameActive = false;
    clearInterval(gameInterval);
    if (targetButton) targetButton.style.display = 'none';
    targetField?.classList.remove('running');
    if (startGameButton) { startGameButton.disabled = false; startGameButton.innerHTML = 'Jogar novamente <span>↻</span>'; }
    if (titleOutput) titleOutput.textContent = 'Rodada concluída.';
    if (descriptionOutput) descriptionOutput.textContent = `Você acertou ${gameScore} ${gameScore === 1 ? 'vez' : 'vezes'}. Mais uma rodada?`;
    if (statusOutput) statusOutput.textContent = 'Tempo encerrado. Boa tentativa!';
    if (gameScore > bestScore) {
      bestScore = gameScore;
      if (bestOutput) bestOutput.textContent = String(bestScore).padStart(2, '0');
      try { localStorage.setItem('orbita-best', String(bestScore)); } catch { /* jogo continua mesmo sem armazenamento */ }
      toast('Novo recorde pessoal! 🏆');
    } else {
      toast(`Fim de jogo: ${gameScore} pontos.`);
    }
  }
  startGameButton?.addEventListener('click', () => {
    clearInterval(gameInterval);
    gameActive = true;
    gameScore = 0;
    timeLeft = 15;
    if (scoreOutput) scoreOutput.textContent = '00';
    if (timeOutput) timeOutput.textContent = `${timeLeft}s`;
    if (statusOutput) statusOutput.textContent = 'Alvo detectado. Vai!';
    if (titleOutput) titleOutput.textContent = 'Agora, pegue o pontinho.';
    if (descriptionOutput) descriptionOutput.textContent = 'O alvo muda de lugar a cada acerto.';
    if (startGameButton) { startGameButton.disabled = true; startGameButton.textContent = 'Em andamento…'; }
    targetField?.classList.add('running');
    if (targetButton) targetButton.style.display = 'block';
    moveTarget();
    gameInterval = setInterval(() => {
      timeLeft -= 1;
      if (timeOutput) timeOutput.textContent = `${timeLeft}s`;
      if (timeLeft <= 0) finishGame();
    }, 1000);
  });
  targetButton?.addEventListener('click', () => {
    if (!gameActive) return;
    gameScore += 1;
    if (scoreOutput) scoreOutput.textContent = String(gameScore).padStart(2, '0');
    moveTarget();
  });
  window.addEventListener('resize', () => { if (gameActive) moveTarget(); }, { passive: true });

  // Acessibilidade: evita rolagem automática agressiva e informa ano atual.
  const year = $('#footerYear');
  if (year) year.textContent = String(new Date().getFullYear());
})();

/* Expansão interativa: cosmos, sintetizador, brinquedos e portais */
(() => {
  const $x = (selector, root = document) => root.querySelector(selector);
  const $$x = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = $x('#cosmosCanvas');
  const frame = $x('#cosmosWindow');
  if (canvas && frame) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, particles = [], pointer = { x: -1000, y: -1000 }, gravity = 0.5, burst = 0;
    const colors = ['#a99bff', '#73e9f5', '#ff8bc8', '#d9f8a0', '#ffffff'];
    const makeParticle = (x, y, burstMode = false) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = burstMode ? Math.random() * 8 + 2 : Math.random() * 1.1 + .15;
      return { x: x ?? Math.random() * w, y: y ?? Math.random() * h, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: burstMode ? Math.random() * 3 + 1 : Math.random() * 1.8 + .4, color: colors[Math.floor(Math.random() * colors.length)], life: burstMode ? 70 + Math.random() * 55 : Infinity, twinkle: Math.random() * 6 };
    };
    const resize = () => {
      const rect = frame.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      w = rect.width; h = rect.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(190, Math.max(75, Math.floor(w * h / 3300)));
      if (particles.length < count) while (particles.length < count) particles.push(makeParticle());
      if (particles.length > count + 80) particles.length = count + 80;
      const readout = $x('#particleReadout'); if (readout) readout.textContent = `PARTÍCULAS: ${particles.length}`;
    };
    const explode = (x = w / 2, y = h / 2) => {
      for (let i = 0; i < 75; i++) particles.push(makeParticle(x, y, true));
      burst++;
      if (particles.length > 340) particles.splice(0, particles.length - 340);
      const readout = $x('#particleReadout'); if (readout) readout.textContent = `PARTÍCULAS: ${particles.length} / EVENTO ${String(burst).padStart(2, '0')}`;
      frame.classList.remove('supernova-flash'); void frame.offsetWidth; frame.classList.add('supernova-flash');
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * .5, cy = h * .48;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .65);
      glow.addColorStop(0, 'rgba(115,105,255,.13)'); glow.addColorStop(1, 'rgba(8,10,24,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const dx = pointer.x - p.x, dy = pointer.y - p.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 145) { const force = (1 - dist / 145) * gravity * .13; p.vx += dx / dist * force; p.vy += dy / dist * force; }
        p.vx *= .994; p.vy *= .994;
        p.x += p.vx; p.y += p.vy; p.twinkle += .04;
        if (p.life !== Infinity) p.life--;
        if (p.x < -15) p.x = w + 15; if (p.x > w + 15) p.x = -15;
        if (p.y < -15) p.y = h + 15; if (p.y > h + 15) p.y = -15;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const alpha = p.life === Infinity ? .48 + Math.sin(p.twinkle) * .3 : Math.min(1, p.life / 25);
        ctx.globalAlpha = alpha; ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = p.r * 5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      // Linhas sutis entre estrelas próximas.
      for (let i = 0; i < particles.length; i += 2) {
        const a = particles[i]; if (a.life !== Infinity) continue;
        for (let j = i + 2; j < Math.min(i + 13, particles.length); j += 2) {
          const b = particles[j]; if (b.life !== Infinity) continue;
          const dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < 4100) { ctx.strokeStyle = `rgba(156,161,255,${(1 - d / 4100) * .14})`; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      if (!reducedMotion) requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener('resize', resize, { passive: true });
    if (!reducedMotion) { /* draw() owns the animation loop */ } else { setInterval(() => { if (frame.getBoundingClientRect().height) { particles.forEach(p => { if (p.life === Infinity) p.twinkle += .2; }); draw(); } }, 140); }
    frame.addEventListener('pointermove', e => { const r = frame.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; }, { passive: true });
    frame.addEventListener('pointerleave', () => { pointer = { x: -1000, y: -1000 }; }, { passive: true });
    frame.addEventListener('pointerdown', e => { if (e.target === canvas) { const r = frame.getBoundingClientRect(); for (let i = 0; i < 12; i++) particles.push(makeParticle(e.clientX - r.left, e.clientY - r.top, true)); } });
    $x('#supernovaButton')?.addEventListener('click', () => explode());
    $x('#cosmosClear')?.addEventListener('click', () => { particles = particles.filter(p => p.life === Infinity); burst = 0; resize(); });
    $x('#gravityRange')?.addEventListener('input', e => { gravity = Number(e.target.value) / 100; const out = $x('#gravityValue'); if (out) out.textContent = `${e.target.value}%`; });
  }

  const moods = [ ['◕‿◕', 'Tudo está estranhamente sob controle.'], ['ಠ_ಠ', 'Alguém mexeu nas configurações do universo.'], ['ง •̀_•́ง', 'Energia de quem abriu o site só para clicar.'], ['(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', 'Hoje até o vazio parece interessante.'], ['¬‿¬', 'Você definitivamente não deveria clicar ali.'], ['⊙﹏⊙', 'A realidade está carregando. Aguarde…'], ['ᕕ( ᐛ )ᕗ', 'Nenhum pensamento. Só movimento.'] ];
  $x('#moodButton')?.addEventListener('click', () => { const mood = moods[Math.floor(Math.random() * moods.length)]; $x('#moodFace').textContent = mood[0]; $x('#moodText').textContent = mood[1]; });
  const fortunes = [ ['✧', 'Em algum momento, você vai abrir outra aba e esquecer por quê.'], ['☄', 'Um objeto próximo vai cair. A gravidade segue invicta.'], ['⌁', 'Você encontrará uma palavra estranha e vai querer pesquisar.'], ['✦', 'Seu próximo clique terá consequências absolutamente moderadas.'], ['◌', 'Uma notificação imaginária está orgulhosa de você.'], ['☼', 'Há 73% de chance de você pensar em comida nos próximos minutos.'], ['∞', 'Você acabou de desbloquear mais uma previsão inútil.'] ];
  $x('#fortuneButton')?.addEventListener('click', () => { const f = fortunes[Math.floor(Math.random() * fortunes.length)]; $x('#fortuneSymbol').textContent = f[0]; $x('#fortuneText').textContent = f[1]; });

  // Arraste objetos dentro do campo, com pointer events para mouse e toque.
  $$x('.drag-emoji').forEach(item => {
    let active = false, startX = 0, startY = 0, baseX = 0, baseY = 0;
    item.addEventListener('pointerdown', e => {
      active = true; item.setPointerCapture(e.pointerId); const zone = item.parentElement.getBoundingClientRect(); const r = item.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY; baseX = r.left + r.width / 2 - zone.left; baseY = r.top + r.height / 2 - zone.top;
      item.style.left = `${baseX}px`; item.style.top = `${baseY}px`; item.style.setProperty('--x', `${baseX}px`); item.style.setProperty('--y', `${baseY}px`); item.style.transform = 'translate(-50%,-50%) scale(1.12)'; item.style.zIndex = '5';
    });
    item.addEventListener('pointermove', e => { if (!active) return; const zone = item.parentElement.getBoundingClientRect(); const x = Math.max(24, Math.min(zone.width - 24, baseX + e.clientX - startX)); const y = Math.max(24, Math.min(zone.height - 24, baseY + e.clientY - startY)); item.style.left = `${x}px`; item.style.top = `${y}px`; });
    const stop = () => { active = false; item.style.transform = 'translate(-50%,-50%)'; item.style.zIndex = '1'; };
    item.addEventListener('pointerup', stop); item.addEventListener('pointercancel', stop);
  });

  let audioContext = null, ambientTimer = null, ambientOn = false;
  const playTone = (frequency, button) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) { const s = $x('#soundStatus'); if (s) s.textContent = 'ÁUDIO NÃO SUPORTADO'; return; }
      audioContext ||= new AudioCtx();
      if (audioContext.state === 'suspended') audioContext.resume();
      const osc = audioContext.createOscillator(), gain = audioContext.createGain(), filter = audioContext.createBiquadFilter();
      osc.type = 'sine'; osc.frequency.setValueAtTime(Number(frequency), audioContext.currentTime);
      filter.type = 'lowpass'; filter.frequency.value = 1800;
      gain.gain.setValueAtTime(.0001, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.18, audioContext.currentTime + .015); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .48);
      osc.connect(filter); filter.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + .5);
      const status = $x('#soundStatus'); if (status) status.textContent = `NOTA ${Math.round(Number(frequency))} HZ`;
      if (button) { button.classList.add('playing'); setTimeout(() => button.classList.remove('playing'), 140); }
    } catch { const status = $x('#soundStatus'); if (status) status.textContent = 'ÁUDIO INDISPONÍVEL'; }
  };
  $$x('#soundKeys button').forEach(button => button.addEventListener('click', () => playTone(button.dataset.note, button)));
  $x('#ambientButton')?.addEventListener('click', e => {
    ambientOn = !ambientOn; const button = e.currentTarget;
    button.textContent = `♪ MODO ALEATÓRIO: ${ambientOn ? 'ON' : 'OFF'}`;
    if (ambientOn) { playTone([261.63,329.63,392,440,523.25][Math.floor(Math.random()*5)]); ambientTimer = setInterval(() => { if (ambientOn) playTone([261.63,293.66,329.63,392,440,523.25][Math.floor(Math.random()*6)]); }, 470); }
    else { clearInterval(ambientTimer); const status = $x('#soundStatus'); if (status) status.textContent = 'ÁUDIO PRONTO'; }
  });

  const worldMessages = { aurora: 'AURORA ATIVADA — CORES DANÇANDO NA BORDA DA REALIDADE', abyss: 'ABISMO ATIVADO — TUDO FICOU MAIS PROFUNDO', sunset: 'PÔR DO SOL ATIVADO — O FIM DA TARDE É SEU' };
  $$x('[data-world]').forEach(button => button.addEventListener('click', () => {
    document.body.classList.remove('world-aurora', 'world-abyss', 'world-sunset');
    document.body.classList.add(`world-${button.dataset.world}`);
    const msg = $x('#worldMessage'); if (msg) msg.textContent = worldMessages[button.dataset.world] || 'NOVA REALIDADE ATIVADA';
    const canvasFrame = $x('#cosmosWindow'); if (canvasFrame) { canvasFrame.classList.remove('supernova-flash'); void canvasFrame.offsetWidth; canvasFrame.classList.add('supernova-flash'); }
  }));
})();
