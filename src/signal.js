import { init, effect, surface, frame } from 'vgpu';
import source from './signal.wgsl?raw';

export async function startSignal() {
  const host = document.querySelector('#signal');
  const canvas = document.querySelector('#signal-canvas');
  const button = document.querySelector('#motion-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let gpu, output, shader, raf = 0, timer = 0, previous = 0;
  let visible = true, paused = motion.matches, dead = false;
  let pointer = [0, 0], smoothed = [0, 0];
  const stop = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; };
  const fallback = (error) => {
    if (dead) return;
    host.dataset.error = error?.message || 'GPU device unavailable or lost';
    dead = true; stop(); host.dataset.renderer = 'fallback'; button.hidden = true;
    gpu?.dispose();
  };
  const size = () => {
    if (!output || dead) return;
    // Fixed pixel ceiling and 30 fps. Decorative work gets a budget.
    const edge = Math.min(720, Math.round(host.clientWidth * Math.min(devicePixelRatio, 1.25)));
    output.resize([edge, edge]);
  };
  const draw = () => {
    if (dead) return;
    try {
      shader.set({ params: { resolution: output.size, pointer: smoothed, time: timer } });
      frame(gpu, (f) => f.pass(output, shader));
      host.dataset.frames = String(Number(host.dataset.frames || 0) + 1);
    } catch (error) { fallback(error); }
  };
  const tick = (now) => {
    raf = 0;
    if (dead || paused || !visible || document.hidden) return;
    if (!previous || now - previous >= 1000 / 30) {
      timer += previous ? Math.min((now - previous) / 1000, .1) : 0;
      previous = now;
      smoothed = smoothed.map((v, i) => v + (pointer[i] - v) * .055);
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
  try {
    gpu = await init({ powerPreference: 'low-power' });
    gpu.onError(fallback);
    gpu.gpu.lost.then(fallback);
    output = surface(gpu, canvas, { size: [600, 600], autoResize: false, dpr: 1 });
    shader = effect(gpu, source, { label: 'Sam Digital / The Signal', set: { params: { resolution: output.size, pointer: [0,0], time: 0 } } });
    size(); await shader.compile({ colors: [navigator.gpu.getPreferredCanvasFormat()] }); draw(); await gpu.settled(); await gpu.gpu.queue.onSubmittedWorkDone();
    if (dead) return;
    host.dataset.renderer = 'webgpu'; button.hidden = false;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0 }).observe(host);
    const resize = new ResizeObserver(() => { size(); if (paused && visible) draw(); });
    resize.observe(host);
    host.addEventListener('pointermove', (event) => {
      if (paused || event.pointerType === 'touch') return;
      const rect = host.getBoundingClientRect();
      pointer = [(event.clientX - rect.left) / rect.width - .5, (event.clientY - rect.top) / rect.height - .5];
    });
    host.addEventListener('pointerleave', () => { pointer = [0,0]; });
    button.addEventListener('click', () => { paused = !paused; sync(); });
    motion.addEventListener('change', () => { paused = motion.matches; sync(); if (paused) draw(); });
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', sync);
    sync();
  } catch (error) { fallback(error); }
}
