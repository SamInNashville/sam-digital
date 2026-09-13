import { init, surface } from 'vgpu';
import { createSignalRenderer } from './signal-renderer.js';

export async function startSignal() {
  const host = document.querySelector('#signal');
  const hero = document.querySelector('#home');
  const canvas = document.querySelector('#signal-canvas');
  const button = document.querySelector('#motion-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let gpu, output, renderer, raf = 0, timer = 0, previous = 0, lastDraw = 0;
  let visible = true, paused = motion.matches, dead = false;
  let pointer = [0, 0], smoothed = [0, 0], velocity = [0, 0];
  let hover = 0, presence = 0, energy = 0, pulse = 0, lastMove = 0;
  let dragging = false, dragPoint = [0,0], rotation = [0,0], spin = [0,0];
  const stop = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; lastDraw = 0; };
  const fallback = (error) => {
    if (dead) return;
    host.dataset.error = error?.message || 'GPU device unavailable or lost';
    dead = true; stop(); host.dataset.renderer = 'fallback'; button.hidden = true;
    gpu?.dispose();
  };
  const size = () => {
    if (!output || dead) return;
    // Decorative GPU work gets a fixed resolution budget and 30 fps ceiling.
    const edge = Math.min(640, Math.round(host.clientWidth * Math.min(devicePixelRatio, 1.25)));
    if (output.size[0] !== edge) { output.resize([edge, edge]); renderer?.resize(); }
  };
  const params = () => ({ resolution: output.size, pointer: smoothed, time: timer, energy, presence, pulse, rotation });
  const draw = () => {
    if (dead) return;
    try {
      renderer.render(params());
      host.dataset.frames = String(Number(host.dataset.frames || 0) + 1);
    } catch (error) { fallback(error); }
  };
  const tick = (now) => {
    raf = 0;
    if (dead || paused || !visible || document.hidden) return;
    if (!previous || now - previous >= 1000 / 30) {
      const dt = lastDraw ? Math.min((now - lastDraw) / 1000, .08) : 1 / 30;
      previous = previous ? now - ((now - previous) % (1000 / 30)) : now;
      lastDraw = now; timer += dt;
      // Damped spring: fast input has weight, but release settles without jitter.
      for (let i = 0; i < 2; i++) {
        velocity[i] += ((pointer[i] - smoothed[i]) * 42 - velocity[i] * 11) * dt;
        smoothed[i] = Math.max(-1, Math.min(1, smoothed[i] + velocity[i] * dt));
      }
      if (!dragging) {
        rotation = rotation.map((v,i) => v + spin[i] * dt);
        spin = spin.map(v => v * Math.exp(-dt * 3));
      }
      presence += (hover - presence) * (1 - Math.exp(-dt * 5));
      energy *= Math.exp(-dt * 1.8);
      pulse *= Math.exp(-dt * 1.6);
      draw();
    }
    if (!dead) raf = requestAnimationFrame(tick);
  };
  const sync = () => {
    stop();
    button.setAttribute('aria-pressed', String(paused));
    button.innerHTML = paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    if (!dead && visible && !document.hidden) {
      if (paused) draw();
      else raf = requestAnimationFrame(tick);
    }
  };
  const release = () => { pointer = [0, 0]; hover = 0; lastMove = 0; dragging = false; };
  const point = (event) => {
    const rect = host.getBoundingClientRect();
    return [Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2)), Math.max(-1, Math.min(1, (.5 - (event.clientY - rect.top) / rect.height) * 2))];
  };
  try {
    gpu = await init({ powerPreference: 'low-power' });
    gpu.onError(fallback); gpu.gpu.lost.then(fallback);
    output = surface(gpu, canvas, { size: [600, 600], autoResize: false, dpr: 1 });
    size(); renderer = await createSignalRenderer(gpu, output);
    draw(); await gpu.settled(); await gpu.gpu.queue.onSubmittedWorkDone();
    if (dead) return;
    host.dataset.renderer = 'webgpu'; button.hidden = false;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0 }).observe(host);
    new ResizeObserver(() => { size(); if (paused && visible) draw(); }).observe(host);
    // Track across the hero, so interaction isn't hidden in a tiny hit target.
    hero.addEventListener('pointermove', (event) => {
      if (paused || event.pointerType === 'touch' || event.target.closest('button')) return;
      const next = point(event);
      if (dragging) {
        const dx = (event.clientX - dragPoint[0]) / host.clientWidth;
        const dy = (event.clientY - dragPoint[1]) / host.clientHeight;
        rotation[0] += dx * 4; rotation[1] += dy * 4;
        spin = [Math.max(-2,Math.min(2,dx * 80)),Math.max(-2,Math.min(2,dy * 80))];
        dragPoint = [event.clientX,event.clientY];
      }
      const elapsed = lastMove ? Math.max(16, event.timeStamp - lastMove) : 16;
      const speed = Math.hypot(next[0] - pointer[0], next[1] - pointer[1]) * 1000 / elapsed;
      energy = Math.min(1, energy + Math.min(speed, 6) * .06);
      pointer = next; hover = host.contains(event.target) ? 1 : .25; lastMove = event.timeStamp;
    }, { passive: true });
    hero.addEventListener('pointerleave', release);
    host.addEventListener('pointerdown', (event) => {
      if (paused || event.target.closest('button') || event.button !== 0) return;
      pointer = point(event); hover = 1; pulse = 1; energy = 1;
      if (event.pointerType !== 'touch') { dragging = true; dragPoint = [event.clientX,event.clientY]; host.setPointerCapture(event.pointerId); }
    }, { passive: true });
    hero.addEventListener('pointerup', (event) => { dragging = false; if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId); if (event.pointerType === 'touch') release(); }, { passive: true });
    host.addEventListener('keydown', (event) => {
      if (paused || event.target !== host) return;
      const actions = {ArrowLeft:[-.18,0],ArrowRight:[.18,0],ArrowUp:[0,-.18],ArrowDown:[0,.18]};
      if (actions[event.key]) { event.preventDefault(); rotation=rotation.map((v,i)=>v+actions[event.key][i]); energy=.7; }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pulse=1; energy=1; }
      if (event.key === 'Escape') { rotation=[0,0]; spin=[0,0]; release(); }
    });
    hero.addEventListener('pointercancel', release, { passive: true });
    button.addEventListener('click', () => { paused = !paused; release(); sync(); });
    motion.addEventListener('change', () => { paused = motion.matches; release(); sync(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) release(); sync(); });
    window.addEventListener('pagehide', stop); window.addEventListener('pageshow', sync);
    sync();
  } catch (error) { fallback(error); }
}
