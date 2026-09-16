const NODE_COUNT = 40;
const EDGE_COUNT = 72;
const MAX_DPR = 1.5;
const FRAME_MS = 1000 / 30;

/**
 * Add a quiet, deterministic neural-firing layer above the GPU atmosphere.
 * The returned function removes the layer and all listeners.
 */
export function startNeural(host) {
  if (!host || host.nodeType !== 1) return () => {};

  const canvas = document.createElement('canvas');
  canvas.className = 'neural-overlay';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:absolute', 'inset:0', 'display:block', 'width:100%', 'height:100%',
    'pointer-events:none', 'opacity:1 !important', 'z-index:1'
  ].join(';');
  host.append(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) { canvas.remove(); return () => {}; }

  // A seeded generator keeps screenshots and visual regression tests stable.
  let seed = 0x5eed1234;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
    // Most neurons live at the margins; only a few bridge the content area.
    const side = i % 2 ? 1 : 0;
    const margin = 0.075 + (i % 7) * 0.027;
    const x = i < 6 ? 0.35 + random() * 0.3 : side ? 1 - margin : margin;
    return { x, y: 0.08 + random() * 0.84, phase: random() * Math.PI * 2 };
  });

  const pairs = [];
  for (let a = 0; a < NODE_COUNT; a += 1) {
    for (let b = a + 1; b < NODE_COUNT; b += 1) {
      const dx = nodes[a].x - nodes[b].x;
      const dy = nodes[a].y - nodes[b].y;
      pairs.push({ a, b, distance: Math.hypot(dx, dy) });
    }
  }
  pairs.sort((a, b) => a.distance - b.distance);
  const edges = [];
  const edgeKeys = new Set();
  const addEdge = (edge) => {
    const key = `${edge.a}:${edge.b}`;
    if (!edgeKeys.has(key)) { edgeKeys.add(key); edges.push(edge); }
  };
  // First make a connected backbone, then fill it with nearest-neighbor branches.
  const connected = new Set([0]);
  while (connected.size < NODE_COUNT) {
    const bridge = pairs.find((p) => connected.has(p.a) !== connected.has(p.b));
    if (!bridge) break;
    addEdge(bridge);
    connected.add(bridge.a).add(bridge.b);
  }
  for (const pair of pairs) {
    if (edges.length >= EDGE_COUNT) break;
    addEdge(pair);
  }
  host.dataset.neuralNodes = String(nodes.length);
  host.dataset.neuralEdges = String(edges.length);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let state = host.dataset.state || 'idle';
  let raf = 0;
  let lastFrame = 0;
  let lastResearching = state === 'researching' ? performance.now() : -Infinity;
  let responseAt = -Infinity;
  let disposed = false;
  let externalPaused = false;
  let paused = Boolean(reduce.matches || navigator.connection?.saveData || document.hidden);

  const motionPaused = () => Boolean(externalPaused || reduce.matches || navigator.connection?.saveData || document.hidden || document.querySelector('#motion')?.getAttribute('aria-pressed') === 'true');
  const stateGain = (now) => {
    if (state === 'researching') return 1;
    if (state === 'engaged') return Math.max(0, 1 - (now - responseAt) / 1500);
    return 0;
  };
  const syncState = () => {
    const next = host.dataset.state || 'idle';
    if (next !== state) {
      if (next === 'researching') lastResearching = performance.now();
      if (next === 'engaged') responseAt = performance.now();
      state = next;
    }
    host.dataset.neuralState = state;
    paused = motionPaused();
    if (paused) { cancelAnimationFrame(raf); raf = 0; }
    else if (stateGain(performance.now()) > 0) { if (!raf) raf = requestAnimationFrame(tick); }
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  const resize = () => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width || innerWidth));
    const height = Math.max(1, Math.ceil(rect.height || innerHeight));
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1, 1600 / Math.max(width, height));
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = (now) => {
    const rect = host.getBoundingClientRect();
    const width = rect.width || innerWidth;
    const height = rect.height || innerHeight;
    const gain = stateGain(now);
    ctx.clearRect(0, 0, width, height);
    if (gain <= 0) return;

    ctx.lineWidth = 0.7;
    for (let i = 0; i < edges.length; i += 1) {
      const edge = edges[i];
      const a = nodes[edge.a]; const b = nodes[edge.b];
      const ax = a.x * width; const ay = a.y * height;
      const bx = b.x * width; const by = b.y * height;
      const waveDelay = ((a.x + b.x) * 0.5) * 1700 + (i % 5) * 55;
      const waveAge = ((now - lastResearching) % 4800) - waveDelay;
      const wave = state === 'researching' && waveAge > 0 && waveAge < 1100;
      const lineAlpha = state === 'researching' ? (wave ? 0.16 : 0.045) : gain * 0.035;
      ctx.strokeStyle = `rgba(107, 154, 169, ${lineAlpha})`;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();

      if (state === 'researching' && waveAge > 0 && waveAge < 1400 && i % 2 === 0) {
        const t = Math.min(1, waveAge / 1100);
        const px = ax + (bx - ax) * t; const py = ay + (by - ay) * t;
        ctx.fillStyle = 'rgba(216, 185, 104, 0.72)';
        ctx.beginPath(); ctx.arc(px, py, 1.45, 0, Math.PI * 2); ctx.fill();
      }
    }
    const pulse = now / 1200;
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const active = state === 'researching' && ((pulse + i * 0.37) % 4.8 < 0.7);
      const alpha = active ? 0.65 : gain * 0.06;
      if (alpha <= 0) continue;
      ctx.fillStyle = active ? `rgba(226, 198, 121, ${alpha})` : `rgba(126, 181, 190, ${alpha})`;
      ctx.beginPath(); ctx.arc(node.x * width, node.y * height, active ? 1.8 : 0.9, 0, Math.PI * 2); ctx.fill();
    }
  };
  const tick = (now) => {
    raf = 0;
    if (disposed || paused || document.hidden) return;
    if (!lastFrame || now - lastFrame >= FRAME_MS) {
      lastFrame = now;
      draw(now);
      host.dataset.neuralFrames = String(Number(host.dataset.neuralFrames || 0) + 1);
    }
    if (stateGain(now) > 0) raf = requestAnimationFrame(tick);
  };
  const onMotion = (event) => { if (event.detail && typeof event.detail.paused === 'boolean') externalPaused = event.detail.paused; syncState(); };
  const observer = new MutationObserver(syncState);
  const onResize = () => resize();
  const onPageHide = () => { cancelAnimationFrame(raf); raf = 0; lastFrame = 0; };
  const cleanup = () => {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(raf); observer.disconnect(); canvas.remove();
    removeEventListener('resize', onResize); removeEventListener('pagehide', onPageHide);
    removeEventListener('pageshow', syncState); document.removeEventListener('visibilitychange', syncState);
    window.removeEventListener('sam-motion', onMotion); reduce.removeEventListener('change', syncState);
  };

  observer.observe(host, { attributes: true, attributeFilter: ['data-state'] });
  addEventListener('resize', onResize, { passive: true });
  addEventListener('pagehide', onPageHide);
  addEventListener('pageshow', syncState);
  document.addEventListener('visibilitychange', syncState);
  window.addEventListener('sam-motion', onMotion);
  reduce.addEventListener('change', syncState);
  resize();
  syncState();
  return cleanup;
}
