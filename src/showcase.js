import './showcase.css';

const BRICK_ROWS = 4;
const BRICK_COLUMNS = 7;

function buildDesignStudy() {
  const card = document.createElement('article');
  card.className = 'showcase-card design-study';
  card.setAttribute('aria-labelledby', 'design-study-title');
  card.innerHTML = `
    <div class="showcase-card__intro">
      <p class="showcase-kicker">Design study</p>
      <h3 id="design-study-title">A calm place to begin</h3>
      <p class="showcase-card__copy">A small brand system for a thoughtful digital studio. Try the palette and layout controls to see the same idea adapt.</p>
    </div>
    <div class="study-preview" data-layout="editorial">
      <div class="study-preview__topline"><span class="study-mark">S&middot;D</span><span class="study-nav">Notes&nbsp;&nbsp;&nbsp;Practice</span></div>
      <div class="study-preview__body">
        <p class="study-label">SAM DIGITAL / STUDY 01</p>
        <h4>Make room<br><em>for better</em> questions.</h4>
        <p class="study-description">An editorial landing page with a gentle point of view.</p>
        <span class="study-action">Explore the thinking <b aria-hidden="true">↗</b></span>
      </div>
      <div class="study-preview__shape" aria-hidden="true"></div>
    </div>
    <div class="study-controls">
      <fieldset>
        <legend>Palette</legend>
        <button type="button" class="study-choice is-active" data-palette="mint" aria-pressed="true">Mint / ink</button>
        <button type="button" class="study-choice" data-palette="lavender" aria-pressed="false">Lavender / plum</button>
        <button type="button" class="study-choice" data-palette="warm" aria-pressed="false">Warm / moss</button>
      </fieldset>
      <fieldset>
        <legend>Layout</legend>
        <button type="button" class="study-choice is-active" data-layout-choice="editorial" aria-pressed="true">Editorial</button>
        <button type="button" class="study-choice" data-layout-choice="compact" aria-pressed="false">Compact</button>
      </fieldset>
    </div>
  `;
  const preview = card.querySelector('.study-preview');
  card.querySelectorAll('[data-palette]').forEach((button) => {
    button.addEventListener('click', () => {
      card.querySelectorAll('[data-palette]').forEach((choice) => {
        const active = choice === button;
        choice.classList.toggle('is-active', active);
        choice.setAttribute('aria-pressed', String(active));
      });
      preview.dataset.palette = button.dataset.palette;
    });
  });
  card.querySelectorAll('[data-layout-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      card.querySelectorAll('[data-layout-choice]').forEach((choice) => {
        const active = choice === button;
        choice.classList.toggle('is-active', active);
        choice.setAttribute('aria-pressed', String(active));
      });
      preview.dataset.layout = button.dataset.layoutChoice;
    });
  });
  return card;
}

function buildBreakout() {
  const card = document.createElement('article');
  card.className = 'showcase-card breakout';
  card.setAttribute('aria-labelledby', 'breakout-title');
  card.innerHTML = `
    <div class="showcase-card__intro">
      <p class="showcase-kicker">Playable experiment</p>
      <h3 id="breakout-title">Break the routine</h3>
      <p class="showcase-card__copy">A tiny arcade loop: move the paddle, clear the field, and keep your focus. Nothing starts until you ask it to.</p>
    </div>
    <div class="breakout-shell">
      <canvas class="breakout-canvas" width="560" height="330" tabindex="0" aria-label="Breakout game. Use left and right arrow keys, or drag and tap on the game field."></canvas>
      <p class="breakout-status" role="status" aria-live="polite">Ready when you are.</p>
    </div>
    <div class="breakout-controls">
      <button type="button" class="showcase-button breakout-start">Start</button>
      <button type="button" class="showcase-button breakout-pause" disabled>Pause</button>
      <button type="button" class="showcase-button breakout-restart">Restart</button>
      <span class="breakout-score" aria-label="Score and lives"><b>Score <span data-score>0</span></b><b>Lives <span data-lives>3</span></b></span>
    </div>
    <p class="breakout-hint">Arrow keys or touch the canvas to steer.</p>
  `;

  const canvas = card.querySelector('canvas');
  const context = canvas.getContext('2d');
  const status = card.querySelector('.breakout-status');
  const scoreElement = card.querySelector('[data-score]');
  const livesElement = card.querySelector('[data-lives]');
  const startButton = card.querySelector('.breakout-start');
  const pauseButton = card.querySelector('.breakout-pause');
  const restartButton = card.querySelector('.breakout-restart');
  const game = {
    running: false,
    pausedByMotion: false,
    pausedByVisibility: false,
    frame: 0,
    lastTime: 0,
    score: 0,
    lives: 3,
    paddleX: 230,
    ball: { x: 280, y: 275, dx: 3.1, dy: -3.1, radius: 7 },
    bricks: [],
  };
  const resetBricks = () => {
    game.bricks = [];
    for (let row = 0; row < BRICK_ROWS; row += 1) {
      for (let column = 0; column < BRICK_COLUMNS; column += 1) {
        game.bricks.push({ x: 35 + column * 72, y: 36 + row * 25, width: 60, height: 14, alive: true, color: row % 2 ? '#aca4e2' : '#a9dfd6' });
      }
    }
  };
  const resetBall = () => {
    game.ball = { x: 280, y: 275, dx: 3.1 * (Math.random() > 0.5 ? 1 : -1), dy: -3.1, radius: 7 };
    game.paddleX = 230;
  };
  const updateReadout = () => {
    scoreElement.textContent = String(game.score);
    livesElement.textContent = String(game.lives);
  };
  const setStatus = (text) => { status.textContent = text; };
  const resetGame = () => {
    stopLoop();
    game.score = 0; game.lives = 3; game.running = false; game.pausedByMotion = false; game.pausedByVisibility = false;
    resetBricks(); resetBall(); updateReadout(); pauseButton.disabled = true; startButton.disabled = false; setStatus('Ready when you are.'); draw();
  };
  const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111b2a'; context.fillRect(0, 0, canvas.width, canvas.height);
    game.bricks.forEach((brick) => { if (brick.alive) { context.fillStyle = brick.color; context.fillRect(brick.x, brick.y, brick.width, brick.height); } });
    context.fillStyle = '#eff1f4'; context.beginPath(); context.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#bde1d9'; context.beginPath(); context.roundRect(game.paddleX, 302, 100, 10, 5); context.fill();
  };
  const stopLoop = () => { if (game.frame) cancelAnimationFrame(game.frame); game.frame = 0; game.lastTime = 0; };
  const isBlocked = () => document.hidden || game.pausedByMotion || game.pausedByVisibility;
  const finish = (won) => { updateReadout(); game.running = false; stopLoop(); pauseButton.disabled = true; startButton.disabled = false; setStatus(won ? 'You cleared the field. Nice work.' : 'Game over. Restart for another round.'); draw(); };
  const update = (now = performance.now()) => {
    game.frame = 0;
    if (!game.running || isBlocked()) { game.frame = 0; return; }
    if (game.lastTime && now - game.lastTime < 1000 / 60 - 0.5) { game.frame = requestAnimationFrame(update); return; }
    game.lastTime = now;
    const ball = game.ball;
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) ball.dx *= -1;
    if (ball.y + ball.dy < ball.radius) ball.dy *= -1;
    if (ball.y + ball.dy > 294 && ball.y + ball.dy < 312 && ball.x > game.paddleX - ball.radius && ball.x < game.paddleX + 100 + ball.radius) {
      ball.dy = -Math.abs(ball.dy); ball.dx += (ball.x - (game.paddleX + 50)) * 0.025; ball.dx = Math.max(-5, Math.min(5, ball.dx));
    }
    game.bricks.forEach((brick) => {
      if (brick.alive && ball.x > brick.x && ball.x < brick.x + brick.width && ball.y - ball.radius < brick.y + brick.height && ball.y + ball.radius > brick.y) { brick.alive = false; ball.dy *= -1; game.score += 10; }
    });
    if (game.bricks.every((brick) => !brick.alive)) { finish(true); return; }
    if (ball.y - ball.radius > canvas.height) {
      game.lives -= 1; updateReadout();
      if (game.lives <= 0) { finish(false); return; }
      resetBall(); setStatus(`${game.lives} lives left. Keep going.`);
    }
    ball.x += ball.dx; ball.y += ball.dy; updateReadout(); draw(); game.frame = requestAnimationFrame(update);
  };
  const startLoop = () => { if (!game.frame && game.running && !isBlocked()) game.frame = requestAnimationFrame(update); };
  const start = () => { if (game.running) return; if (game.lives <= 0 || game.bricks.every((brick) => !brick.alive)) resetGame(); game.running = true; game.pausedByMotion = document.documentElement.dataset.motionPaused === 'true' && document.documentElement.dataset.motionSource !== 'preference'; game.pausedByVisibility = document.hidden; pauseButton.disabled = false; startButton.disabled = true; setStatus(game.pausedByMotion ? 'Paused by motion controls.' : 'In play.'); startLoop(); canvas.focus({ preventScroll: true }); };
  const pause = () => { if (!game.running) return; game.running = false; stopLoop(); pauseButton.disabled = true; startButton.disabled = false; setStatus('Paused.'); };
  const movePaddle = (clientX) => { const rect = canvas.getBoundingClientRect(); const scale = canvas.width / rect.width; game.paddleX = Math.max(0, Math.min(canvas.width - 100, (clientX - rect.left) * scale - 50)); draw(); };
  canvas.addEventListener('pointermove', (event) => { if (event.isPrimary) movePaddle(event.clientX); });
  canvas.addEventListener('pointerdown', (event) => { movePaddle(event.clientX); canvas.setPointerCapture?.(event.pointerId); });
  canvas.addEventListener('keydown', (event) => { if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return; event.preventDefault(); game.paddleX += event.key === 'ArrowLeft' ? -28 : 28; game.paddleX = Math.max(0, Math.min(canvas.width - 100, game.paddleX)); draw(); });
  startButton.addEventListener('click', start); pauseButton.addEventListener('click', pause); restartButton.addEventListener('click', resetGame);
  const onMotion = (event) => { const paused = Boolean(event.detail?.paused) && !event.detail?.decorativeOnly; game.pausedByMotion = paused; if (paused && game.running) { stopLoop(); setStatus('Paused by motion controls.'); } else if (!paused && game.running) { setStatus('In play.'); startLoop(); } };
  const onVisibility = () => { game.pausedByVisibility = document.hidden; if (document.hidden) stopLoop(); else if (game.running && !game.pausedByMotion) startLoop(); };
  window.addEventListener('sam-motion', onMotion); document.addEventListener('visibilitychange', onVisibility);
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([entry]) => { game.pausedByVisibility = !entry.isIntersecting; if (!entry.isIntersecting) stopLoop(); else if (game.running && !game.pausedByMotion && !document.hidden) startLoop(); }, { threshold: 0.05 }) : null;
  observer?.observe(card);
  resetGame();
  return card;
}

export function mountShowcase(host) {
  if (!(host instanceof HTMLElement)) throw new TypeError('mountShowcase(host) expects an HTMLElement');
  host.replaceChildren();
  host.classList.add('showcase');
  const heading = document.createElement('div');
  heading.className = 'showcase-heading';
  heading.innerHTML = '<p class="showcase-kicker">Interactive demos · not client work</p><h2>Small experiments, made tangible.</h2><p>Two low-stakes studies from the same design language: one to play, one to explore.</p>';
  const grid = document.createElement('div'); grid.className = 'showcase-grid'; grid.append(buildBreakout(), buildDesignStudy());
  host.append(heading, grid);
  return host;
}
