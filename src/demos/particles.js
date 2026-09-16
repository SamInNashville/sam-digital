import './particles.css';

const TAU = Math.PI * 2;
const PRESETS = ['sphere', 'torus', 'helix'];

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function presetPoint(shape, index, count, time) {
  const u = (index + 0.5) / count;
  const a = index * 2.3999632297 + time * 0.08;
  if (shape === 'torus') {
    const tube = 0.28 + 0.12 * Math.sin(index * 7.1);
    const ring = TAU * u * 5.2;
    return { x: (0.72 + tube * Math.cos(a * 2)) * Math.cos(ring), y: (0.72 + tube * Math.cos(a * 2)) * Math.sin(ring), z: tube * Math.sin(a * 2) };
  }
  if (shape === 'helix') {
    const angle = TAU * u * 3.2 + time * 0.22;
    return { x: 0.66 * Math.cos(angle), y: (u - 0.5) * 2.1, z: 0.66 * Math.sin(angle) };
  }
  const y = 1 - 2 * u;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  return { x: radius * Math.cos(a), y, z: radius * Math.sin(a) };
}

export function mount(host) {
  if (!(host instanceof HTMLElement)) throw new TypeError('particles.mount(host) expects an HTMLElement');
  const root = document.createElement('section');
  root.className = 'particles-demo';
  root.setAttribute('aria-labelledby', 'particles-demo-title');
  root.innerHTML = `
    <header class="particles-demo__header"><div><p class="particles-demo__eyebrow">Luminous field / 03D</p><h2 id="particles-demo-title">Matter, in motion</h2><p>Orbit a living point cloud. The sculpture is projected from a bounded 3D simulation rather than a video loop.</p></div><span class="particles-demo__readout" data-particle-readout role="status" aria-live="polite">900 nodes · sphere</span></header>
    <div class="particles-demo__stage"><canvas data-particle-canvas tabindex="0" aria-label="Interactive 3D particle sculpture. Move your pointer to orbit and attract the field."></canvas><div class="particles-demo__crosshair" aria-hidden="true"></div></div>
    <div class="particles-demo__controls" aria-label="Particle field controls">
      <fieldset><legend>Form</legend>${PRESETS.map((name, i) => `<button type="button" data-preset="${name}" aria-pressed="${i === 0}">${name}</button>`).join('')}</fieldset>
      <label>Density <input data-density type="range" min="0.35" max="1" step="0.05" value="0.7"><output data-density-output>700</output></label>
      <label>Energy <input data-energy type="range" min="0" max="1.6" step="0.05" value="0.85"><output data-energy-output>0.85</output></label>
      <button type="button" data-particle-pause>Pause</button><button type="button" data-particle-reset>Reset</button>
    </div>
    <p class="particles-demo__hint">Pointer / touch: orbit · hold to pull · Shift to repel · keyboard arrows rotate</p>`;
  host.replaceChildren(root);
  const canvas = root.querySelector('[data-particle-canvas]');
  const ctx = canvas.getContext('2d');
  const readout = root.querySelector('[data-particle-readout]');
  const density = root.querySelector('[data-density]');
  const energy = root.querySelector('[data-energy]');
  const densityOutput = root.querySelector('[data-density-output]');
  const energyOutput = root.querySelector('[data-energy-output]');
  const state = { shape: 'sphere', density: 0.7, energy: 0.85, paused: false, frame: 0, last: 0, width: 1, height: 1, dpr: 1, yaw: 0, pitch: 0, pointer: { x: 0, y: 0, active: false, repel: false }, points: [] };
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)');let disposed=false,visible=true,frames=0;state.paused=prefersReduced.matches;root.querySelector('[data-particle-pause]').textContent=state.paused?'Play':'Pause';const diagnostics=()=>{root.dataset.frames=String(frames);root.dataset.shape=state.shape;root.dataset.count=String(state.points.length);root.dataset.paused=String(state.paused);};
  const makePoints = () => {
    const count = Math.round(220 + state.density * 780);
    state.points = Array.from({ length: count }, (_, index) => ({ ...presetPoint(state.shape,index,count,0),vx:0,vy:0,vz:0,seed:index*.73 }));
    densityOutput.value = String(count); densityOutput.textContent = String(count);
    readout.textContent = `${count} nodes · ${state.shape}`;diagnostics();
  };
  const resize = () => { const rect = canvas.getBoundingClientRect(); state.width = Math.max(1, rect.width); state.height = Math.max(1, rect.height); state.dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(state.width * state.dpr); canvas.height = Math.round(state.height * state.dpr); };
  const reset = () => { state.yaw = 0; state.pitch = 0; state.points.forEach((point,index)=>{Object.assign(point,presetPoint(state.shape,index,state.points.length,0),{vx:0,vy:0,vz:0});});diagnostics();draw(0); };
  const rotate = (point) => { const cy = Math.cos(state.yaw), sy = Math.sin(state.yaw); const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch); const x = point.x * cy - point.z * sy; const z = point.x * sy + point.z * cy; return { x, y: point.y * cp - z * sp, z: point.y * sp + z * cp }; };
  const draw = (time) => { const scale = Math.min(state.width, state.height) * 0.46; ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0); ctx.clearRect(0, 0, state.width, state.height); const glow = ctx.createRadialGradient(state.width / 2, state.height / 2, 0, state.width / 2, state.height / 2, scale * 1.8); glow.addColorStop(0, 'rgba(83, 159, 161, .13)'); glow.addColorStop(1, 'rgba(8, 13, 27, 0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, state.width, state.height); const projected = state.points.map((point, index) => { const p = rotate(point); const depth = 2.4 / (3.2 - p.z); return { x: state.width / 2 + p.x * scale * depth, y: state.height / 2 + p.y * scale * depth, z: p.z, size: clamp((1.1 + depth * 1.8), 1, 5), hue: 162 + ((index * 13) % 78) }; }).sort((a, b) => a.z - b.z); projected.forEach((p) => { ctx.beginPath(); ctx.fillStyle = `hsla(${p.hue}, 74%, ${p.z > 0 ? 78 : 67}%, ${0.35 + p.size / 8})`; ctx.shadowBlur = p.size * 4; ctx.shadowColor = p.hue < 205 ? '#8ce5d4' : '#b5a8f2'; ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); }); ctx.shadowBlur = 0; };
  const update = (now) => { state.frame = 0; if (disposed||!visible||state.paused || document.hidden || !root.isConnected) return;frames++;diagnostics(); const dt = Math.min(0.035, (now - (state.last || now)) / 1000); state.last = now; const morphTime = now * 0.001; state.points.forEach((point, index) => { const target = presetPoint(state.shape, index, state.points.length, morphTime); const pull = state.pointer.active ? 0.42 : 0; const dx = state.pointer.x - point.x; const dy = state.pointer.y - point.y; point.vx += (target.x - point.x) * 2.5 * dt + dx * pull * dt * (state.pointer.repel ? -1 : 1); point.vy += (target.y - point.y) * 2.5 * dt + dy * pull * dt * (state.pointer.repel ? -1 : 1); point.vz += (target.z - point.z) * 2.5 * dt; point.vx *= 0.91; point.vy *= 0.91; point.vz *= 0.91; point.x += point.vx * dt * (1 + state.energy * 2); point.y += point.vy * dt * (1 + state.energy * 2); point.z += point.vz * dt * (1 + state.energy * 2); }); state.yaw += dt * (prefersReduced.matches ? 0.03 : 0.14) * state.energy; draw(now); state.frame = requestAnimationFrame(update); };
  const start = () => { if (!disposed&&visible&&root.isConnected&&!state.frame && !state.paused && !document.hidden) state.frame = requestAnimationFrame(update); };
  const onPointer = (event) => { const rect = canvas.getBoundingClientRect(); state.pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2; state.pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2; state.pointer.active = Boolean(event.buttons);state.pointer.repel=event.shiftKey;state.yaw=state.pointer.x*.9;state.pitch=state.pointer.y*.45;if(event.type==='pointerdown')canvas.setPointerCapture?.(event.pointerId);if(state.paused)draw(performance.now()); };
  const onPointerUp = () => { state.pointer.active = false; };
  const onKey = (event) => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return; event.preventDefault(); state.yaw += event.key === 'ArrowLeft' ? -0.12 : event.key === 'ArrowRight' ? 0.12 : 0; state.pitch = clamp(state.pitch + (event.key === 'ArrowUp' ? 0.12 : event.key === 'ArrowDown' ? -0.12 : 0), -0.9, 0.9); draw(performance.now()); };
  const onVisibility = () => { if (document.hidden && state.frame) { cancelAnimationFrame(state.frame); state.frame = 0; } else start(); };
  canvas.addEventListener('pointermove', onPointer); canvas.addEventListener('pointerdown', onPointer); canvas.addEventListener('pointerup', onPointerUp); canvas.addEventListener('pointerleave', onPointerUp);canvas.addEventListener('pointercancel',onPointerUp); canvas.addEventListener('keydown', onKey); window.addEventListener('resize', resize); document.addEventListener('visibilitychange', onVisibility);
  root.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => { state.shape = button.dataset.preset; root.querySelectorAll('[data-preset]').forEach((item) => { const active = item === button; item.setAttribute('aria-pressed', String(active)); item.classList.toggle('is-active', active); }); readout.textContent = `${state.points.length} nodes · ${state.shape}`;if(state.paused)reset();diagnostics(); }));
  density.addEventListener('input', () => { state.density = Number(density.value); makePoints(); reset(); }); energy.addEventListener('input', () => { state.energy = Number(energy.value); energyOutput.value = state.energy.toFixed(2); energyOutput.textContent = state.energy.toFixed(2); });
  root.querySelector('[data-particle-pause]').addEventListener('click', (event) => { state.paused = !state.paused;diagnostics();state.last=performance.now(); event.currentTarget.textContent = state.paused ? 'Resume' : 'Pause'; if (state.paused && state.frame) { cancelAnimationFrame(state.frame); state.frame = 0; } else start(); }); root.querySelector('[data-particle-reset]').addEventListener('click', reset);
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([entry]) => { visible=entry.isIntersecting;if (!entry.isIntersecting && state.frame) { cancelAnimationFrame(state.frame); state.frame = 0; } else start(); }, { threshold: 0.05 }) : null; observer?.observe(root);
  resize(); makePoints(); reset(); start();
  return () => { disposed=true;root.dataset.disposed='true';if (state.frame) cancelAnimationFrame(state.frame); observer?.disconnect(); canvas.removeEventListener('pointermove', onPointer); canvas.removeEventListener('pointerdown', onPointer); canvas.removeEventListener('pointerup', onPointerUp); canvas.removeEventListener('pointerleave', onPointerUp);canvas.removeEventListener('pointercancel',onPointerUp); canvas.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVisibility); root.remove(); };
}
