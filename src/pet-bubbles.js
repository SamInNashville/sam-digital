// Bounded, deterministic bubble physics for Sam's jetpack. No DOM or user data.
export const BUBBLE_LIMIT = 48;
export const BUBBLE_LIFETIME = 2.8;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function createBubble({ x = 0, y = 0, vx = 0, vy = 0, size = 4, life = BUBBLE_LIFETIME } = {}) {
  return { x, y, vx, vy, size, age: 0, life };
}

export function stepBubble(bubble, dt, bounds = { width: 320, height: 240 }) {
  const t = clamp(Number(dt) || 0, 0, 0.05);
  const drag = Math.pow(0.98, t * 60);
  bubble.vx *= drag;
  bubble.vy = bubble.vy * drag - 58 * t;
  bubble.x += bubble.vx * t; bubble.y += bubble.vy * t;
  const r = Math.max(1, bubble.size / 2);
  if (bubble.x < r) { bubble.x = r; bubble.vx = Math.abs(bubble.vx) * 0.55; }
  if (bubble.x > bounds.width - r) { bubble.x = bounds.width - r; bubble.vx = -Math.abs(bubble.vx) * 0.55; }
  if (bubble.y < r) { bubble.y = r; bubble.vy = Math.abs(bubble.vy) * 0.55; }
  if (bubble.y > bounds.height - r) { bubble.y = bounds.height - r; bubble.vy = -Math.abs(bubble.vy) * 0.45; }
  bubble.age += t; return bubble;
}

export function resolveBubbleCollisions(bubbles, strength = 0.16) {
  for (let i = 0; i < bubbles.length; i += 1) for (let j = i + 1; j < bubbles.length; j += 1) {
    const a = bubbles[i], b = bubbles[j], dx = b.x - a.x || (i % 2 ? -0.001 : 0.001), dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
    const min = (a.size + b.size) * 0.5; if (d >= min) continue;
    const nx = dx / d, ny = dy / d, push = (min - d) * strength;
    a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
    const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (relative < 0) { const impulse = relative * 0.25; a.vx += nx * impulse; a.vy += ny * impulse; b.vx -= nx * impulse; b.vy -= ny * impulse; }
  } return bubbles;
}
export function bubbleOpacity(bubble) { const p = bubble.age / bubble.life; return clamp(Math.min(p * 8, 1, (1 - p) * 5), 0, 1); }

export function createBubbleField(parent, getEmitter) {
  const canvas = document.createElement('canvas'); canvas.className = 'pet-bubbles'; canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '14' }); parent.append(canvas);
  const ctx = canvas.getContext('2d'), bubbles = []; canvas.dataset.limit = String(BUBBLE_LIMIT); let raf = 0, previous = performance.now(), disposed = false, emitCarry = 0, frames = 0, serial = 0, timer = 0;
  const resize = () => { const ratio = Math.min(2, devicePixelRatio || 1); canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; ctx?.setTransform(ratio, 0, 0, ratio, 0, 0); };
  const frame = now => {
    if (disposed) return; const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000)); previous = now; const e = getEmitter();
    if(e?.suspended||document.hidden){bubbles.length=0;ctx?.clearRect(0,0,innerWidth,innerHeight);canvas.dataset.count='0';}
    if (e?.suspended||document.hidden||(!e?.active && bubbles.length === 0)) { timer = setTimeout(() => { raf = requestAnimationFrame(frame); }, 200); return; }
    canvas.dataset.frames = String(++frames); canvas.dataset.count = String(bubbles.length);
    if (e?.active && bubbles.length < BUBBLE_LIMIT) { emitCarry += dt * (e.burst ? 22 : 12); const n = Math.floor(emitCarry); emitCarry -= n; for (let i = 0; i < n && bubbles.length < BUBBLE_LIMIT; i += 1) { const sample=serial++;const pod = sample % 2; bubbles.push(createBubble({ x: e.x + (pod ? 1 : -1)*(e.podOffset||20), y: e.y, vx: e.vx + (pod ? 16 : -16), vy: e.vy + 100, size: 9 + (sample % 4) * 3, life: 1.8 + (sample % 4) * 0.28 })); } }
    for (const b of bubbles) stepBubble(b, dt, { width: innerWidth, height: innerHeight }); resolveBubbleCollisions(bubbles);
    if (ctx) { ctx.clearRect(0, 0, innerWidth, innerHeight); for (const b of bubbles) { if (b.age >= b.life) continue; const alpha = bubbleOpacity(b); ctx.globalAlpha = alpha * 0.22; ctx.fillStyle = '#8cf5e0'; ctx.beginPath(); ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = alpha * 0.9; ctx.strokeStyle = '#c4f9f0'; ctx.lineWidth = 1.25; ctx.beginPath(); ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = alpha * 0.8; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x - b.size * .16, b.y - b.size * .18, Math.max(1, b.size * .1), 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
    for (let i = bubbles.length - 1; i >= 0; i -= 1) if (bubbles[i].age >= bubbles[i].life) bubbles.splice(i, 1); raf = requestAnimationFrame(frame);
  }; resize(); addEventListener('resize', resize, { passive: true }); raf = requestAnimationFrame(frame);
  return () => { disposed = true; cancelAnimationFrame(raf); clearTimeout(timer); removeEventListener('resize', resize); canvas.remove(); };
}
