// Purposeful, viewport-fixed companion choreography. It observes geometry only.
import { createBubbleField } from './pet-bubbles.js';

const INTERACTIVE = 'button,a,input,textarea,select,summary,[role="button"],.showcase-card,.turn,.privacy';
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function roamPet(stage, pet) {
  const flight = document.createElement('div');
  flight.className = 'dot-flight'; flight.setAttribute('aria-hidden', 'true');
  const bubble = document.createElement('div');
  bubble.className = 'dot-bubble'; bubble.setAttribute('aria-hidden', 'true'); bubble.hidden = true;
  flight.append(pet); document.body.append(flight, bubble);
  const svg = pet.querySelector('svg');
  if (svg && !svg.querySelector('.dot-jetpack')) svg.insertAdjacentHTML('afterbegin', '<g class="dot-jetpack"><rect x="10" y="48" width="15" height="32" rx="6" fill="#55768f" stroke="#c4eee4"/><rect x="75" y="48" width="15" height="32" rx="6" fill="#55768f" stroke="#c4eee4"/></g>');
  if (svg && !svg.querySelector('.dot-point')) svg.insertAdjacentHTML('beforeend', '<g class="dot-point"><path d="M77 64L93 57M87 53L94 57 91 64" stroke="#d7fff2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>');

  let flightAnimation, disposed = false, moveTimer = 0, scrollTimer = 0, bubbleTimer = 0, lastMove = 0, lastActivity = performance.now(), lastBubble = -Infinity, idleHinted = false, activeTarget = null;
  let destination = null, emitter = { active: false, burst: false, x: 0, y: 0, vx: 0, vy: 0 };
  const input = document.querySelector('#prompt');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => stage.dataset.still === 'true' || reduced.matches || document.hidden || !!document.querySelector('dialog[open]');
  const usable = () => !disposed && !pet.hidden && !still();
  const rectVisible = r => r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  const home = () => { const r = stage.getBoundingClientRect(); return { x: clamp(r.left + 8, 8, innerWidth - 82), y: clamp(r.top - 2, 8, innerHeight - 104) }; };
  const edgePerch = target => {
    const narrow=innerWidth<500,w=narrow?68:82,h=narrow?84:98;
    const focusRect=target?.getBoundingClientRect?.();const targetRoot=target?.closest?.('#composer,.showcase-card,.turn')||target;const r=targetRoot?.getBoundingClientRect?.();
    const tx=r&&rectVisible(r)?r.left+r.width/2:innerWidth/2,ty=focusRect&&rectVisible(focusRect)?focusRect.top+focusRect.height/2:innerHeight*.34;
    const preferredX=r&&rectVisible(r)?(tx<innerWidth/2?r.left-w-16:r.right+16):innerWidth-w-12;
    const blocks=[...document.querySelectorAll('button,a,input,textarea,select,summary,h1,h2,h3,.lede,.ai-introduction>div:last-child,.breakout-canvas')].filter(e=>!e.closest('#companion-stage')).map(e=>({r:e.getBoundingClientRect(),weight:e.matches('button,a,input,textarea,select,summary')?30000:1800})).filter(b=>rectVisible(b.r));
    const points=[];const xs=[clamp(preferredX,10,innerWidth-w-10),12,innerWidth-w-12];for(const x of xs){points.push({x,y:clamp(ty-h/2,12,innerHeight-h-14)});for(let y=12;y<innerHeight-h-12;y+=28)points.push({x,y});}
    const cost=p=>Math.hypot(p.x-preferredX,p.y-(ty-h/2))+blocks.reduce((sum,b)=>sum+(p.x<b.r.right+5&&p.x+w>b.r.left-5&&p.y<b.r.bottom+5&&p.y+h>b.r.top-5?b.weight:0),0);
    const chosen=points.sort((a,b)=>cost(a)-cost(b))[0];return {...chosen,w,h};
  };

  const setDocked = dock => {
    if (dock) { flightAnimation?.cancel(); clearTimeout(moveTimer); hideBubble(); if (pet.parentNode !== stage) stage.prepend(pet); pet.style.removeProperty('width'); pet.style.removeProperty('height'); flight.hidden = true; bubble.hidden = true; emitter.active = false; }
    else { if (pet.parentNode !== flight) flight.prepend(pet); const narrow = innerWidth < 500; pet.style.width = `${narrow ? 62 : 74}px`; pet.style.height = `${narrow ? 68 : 80}px`; flight.hidden = false; }
  };
  const moveTo = (target, reason = 'focus', immediate = false) => {
    if (!usable()) { setDocked(true); return; }
    const p = edgePerch(target); destination = p; setDocked(false); clearTimeout(moveTimer);
    const intent = reason === 'reply' ? 'accompanying' : reason === 'idle' ? 'inviting' : reason === 'scroll' ? 'accompanying' : reason === 'chat' ? 'listening' : target?.closest?.('.breakout') ? 'observing-game' : target?.closest?.('.showcase-card') ? 'exploring-design' : 'listening';
    flight.dataset.reason = reason; flight.dataset.intent = intent; flight.dataset.targetKind = target?.closest?.('.breakout') ? 'breakout' : target?.closest?.('.showcase-card') ? 'showcase' : target?.closest?.('#composer') || target === input ? 'chat' : 'interactive';
    const current = flight.getBoundingClientRect(); const from = { x: current.left || p.x, y: current.top || p.y };
    const distance = Math.hypot(p.x - from.x, p.y - from.y); const duration = immediate ? 0 : clamp(distance * 2.2, 650, 1900);
    emitter = { active: !immediate && distance > 8, burst: reason === 'reply', x: from.x + 38, y: from.y + 82, vx: (p.x - from.x) / Math.max(duration / 1000, .1), vy: (p.y - from.y) / Math.max(duration / 1000, .1) };
    flight.dataset.flying = String(!immediate && distance > 8); flight.dataset.reason = reason; flight.dataset.mood = stage.dataset.mood || 'idle';
    flight.style.setProperty('--lean', p.x >= from.x ? '7deg' : '-7deg');
    flightAnimation?.cancel();
    if (duration) flightAnimation = flight.animate([{ transform: `translate3d(${from.x}px,${from.y}px,0)` }, { transform: `translate3d(${p.x}px,${p.y}px,0)` }], { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
    flight.style.transform = `translate3d(${p.x}px,${p.y}px,0)`; lastMove = performance.now();
    moveTimer = setTimeout(() => { const r=target?.getBoundingClientRect?.(); if(r){pet.style.setProperty('--look-x',`${clamp((r.left+r.width/2-p.x-35)/80,-3,3)}px`);pet.style.setProperty('--look-y',`${clamp((r.top+r.height/2-p.y-40)/100,-2,2)}px`);} flight.dataset.flying = 'false'; emitter.active = false; if (reason === 'idle') showInvite(); else if (reason === 'focus' && target?.closest?.('.breakout,.showcase-card')) showArrival(target); }, duration);
  };
  const hideBubble = () => { bubble.hidden = true; clearTimeout(bubbleTimer); flight.dataset.point = 'false'; input?.classList.remove('dot-invite'); };
  const placeSpeech=()=>{const r=pet.getBoundingClientRect();const left=r.left>innerWidth/2?r.left-196:r.right+12;bubble.style.left=`${clamp(left,8,innerWidth-192)}px`;bubble.style.top=`${clamp(innerWidth<500?r.top-62:r.top,8,innerHeight-72)}px`;};
  const showInvite = () => { if (!usable() || document.activeElement === input || !rectVisible(input?.getBoundingClientRect()) || performance.now() - lastActivity < 15000 || bubble.hidden === false) return; bubble.textContent = 'A thought worth exploring?'; placeSpeech(); bubble.hidden = false; flight.dataset.point = 'true';const r=input.getBoundingClientRect();flight.style.setProperty('--point-angle',`${Math.atan2(r.top+r.height/2-destination.y-50,r.left+r.width/2-destination.x-60)*180/Math.PI+23}deg`); input?.classList.add('dot-invite'); bubbleTimer = setTimeout(hideBubble, 4800); };
  const showArrival = target => { if (!usable() || document.activeElement === input || performance.now() - lastBubble < 20000) return; bubble.textContent = target.closest('.breakout') ? 'Let’s see that next shot.' : 'Trying a different look?'; placeSpeech(); bubble.hidden = false; lastBubble = performance.now(); flight.dataset.point = 'false'; bubbleTimer = setTimeout(hideBubble, 4200); };
  const noteActivity = () => { lastActivity = performance.now(); hideBubble(); };
  const focusOrHover = e => { const target = e.target.closest?.(INTERACTIVE); if (!target || target.closest('.dot-flight,.dot-bubble') || (target === activeTarget && performance.now() - lastMove < 1200)) return; activeTarget = target; clearTimeout(scrollTimer); noteActivity(); moveTo(target, target.closest('#composer') ? 'chat' : 'focus'); };
  const returnToChat = () => { noteActivity(); moveTo(input || document.querySelector('#composer'), 'reply'); };
  const sync = () => { flight.dataset.still = stage.dataset.still || 'false'; flight.dataset.mood = stage.dataset.mood || 'idle'; if (!usable()) setDocked(true); else if (pet.parentNode !== flight || flight.hidden) moveTo(input || stage, 'return', true); };
  const onScroll = () => { if (disposed) return; hideBubble();lastActivity=performance.now();clearTimeout(scrollTimer);if(!usable()){setDocked(true);return;}const focused=document.activeElement;const target=focused?.matches(INTERACTIVE)&&rectVisible(focused.getBoundingClientRect())?focused:document.elementFromPoint(innerWidth/2,innerHeight*.45)?.closest('.showcase-card,.turn,#composer');const reason=target===focused?(target===input?'chat':'focus'):'scroll';const r=pet.getBoundingClientRect();if(r.right>innerWidth||r.bottom>innerHeight||r.left<0||r.top<0)moveTo(target,reason,true);scrollTimer=setTimeout(()=>moveTo(target,reason),120); };

  const moodObserver = new MutationObserver(() => { sync(); if (usable() && (stage.dataset.mood === 'reply' || stage.dataset.mood === 'thinking')) returnToChat(); });
  moodObserver.observe(stage, { attributes: true, attributeFilter: ['data-mood', 'data-still'] });
  const hiddenObserver = new MutationObserver(sync); hiddenObserver.observe(pet, { attributes: true, attributeFilter: ['hidden'] });
  let emitterPrevious;const bubbleStop = createBubbleField(document.body, () => {const now=performance.now(),r=pet.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height*.78;if(emitterPrevious&&now>emitterPrevious.t){const dt=Math.max(.008,(now-emitterPrevious.t)/1000);emitter.vx=clamp((cx-emitterPrevious.x)/dt,-500,500);emitter.vy=clamp((cy-emitterPrevious.y)/dt,-500,500);}emitterPrevious={x:cx,y:cy,t:now};emitter.x=cx;emitter.y=cy;emitter.podOffset=r.width*.33;emitter.suspended=!usable();return emitter;});
  document.addEventListener('focusin', focusOrHover); document.addEventListener('pointerover', focusOrHover, { passive: true }); document.addEventListener('pointerdown', noteActivity, { passive: true }); document.addEventListener('keydown', noteActivity); document.addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll, { passive: true }); reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); document.addEventListener('toggle', sync, true); addEventListener('pagehide', () => { emitter.active = false; setDocked(true); }); addEventListener('pageshow', sync);
  sync();
  const idle = setInterval(() => { if (usable() && document.activeElement !== input && rectVisible(input?.getBoundingClientRect()) && stage.dataset.mood === 'idle' && !idleHinted && performance.now() - lastActivity > 15000) { idleHinted = true; moveTo(input || stage, 'idle'); } }, 2000);
  return () => { disposed = true; clearInterval(idle); clearTimeout(scrollTimer); clearTimeout(moveTimer); hideBubble(); flightAnimation?.cancel(); moodObserver.disconnect(); hiddenObserver.disconnect(); bubbleStop(); stage.prepend(pet); flight.remove(); bubble.remove(); document.removeEventListener('focusin', focusOrHover); document.removeEventListener('pointerover', focusOrHover); document.removeEventListener('pointerdown', noteActivity); document.removeEventListener('keydown', noteActivity); document.removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); reduced.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); document.removeEventListener('toggle', sync, true); removeEventListener('pageshow', sync); };
}
