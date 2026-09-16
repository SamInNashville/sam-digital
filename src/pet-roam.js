// Purposeful, viewport-fixed companion choreography. It observes geometry only.
import { createBubbleField } from './pet-bubbles.js';
import { createPetDialogue } from './pet-dialogue.js';
import { planPetFlight } from './pet-flight.js';

const INTERACTIVE = 'button,a,input,textarea,select,summary,[role="button"],.showcase-card,.turn,.privacy,#services,.welcome';
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

  let lastDodge=-Infinity, flightTrip=0, flightAnimation, disposed = false, moveTimer = 0, scrollTimer = 0, bubbleTimer = 0, lastMove = 0, lastActivity = performance.now(), lastEncouragement = -Infinity, lastTyping = -Infinity, lastBubble = -Infinity, idleHinted = false, activeTarget = null;
  let destination = null, emitter = { active: false, burst: false, x: 0, y: 0, vx: 0, vy: 0 };
  const input = document.querySelector('#prompt');
  const nextAside=createPetDialogue();
  const editing=()=>document.activeElement?.matches('textarea,input,[contenteditable=true]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => stage.dataset.still === 'true' || reduced.matches || document.hidden || !!document.querySelector('dialog[open]');
  const usable = () => !disposed && !pet.hidden && !still();
  const rectVisible = r => r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  const contentTarget = target => {
    if(target&&rectVisible(target.getBoundingClientRect())&&target.closest('main'))return target;
    return [...document.querySelectorAll('#companion-stage,#composer,.turn,.showcase-card,#services h2')].filter(e=>rectVisible(e.getBoundingClientRect())).sort((a,b)=>{const distance=e=>{const r=e.getBoundingClientRect();return Math.abs(clamp(r.top+r.height/2,0,innerHeight)-innerHeight*.45);};return distance(a)-distance(b);})[0]||stage;
  };
  const edgePerch = requested => {
    const target=contentTarget(requested),narrow=innerWidth<680,w=narrow?68:82,h=narrow?84:98;
    const focusRect=target.getBoundingClientRect(),root=target.closest('#composer,.showcase-card,.turn')||target,r=root.getBoundingClientRect();
    if(target===stage)return {x:clamp(r.left,10,innerWidth-w-10),y:clamp(r.top,12,innerHeight-h-14),w,h};
    const ty=clamp(focusRect.top+focusRect.height/2-h/2,12,innerHeight-h-14);
    const preferredX=clamp(r.left-w-12,10,innerWidth-w-10);
    const blocks=[...document.querySelectorAll('header,button,a,input,textarea,select,summary,h1,h2,h3,.lede,.breakout-canvas')].filter(e=>!e.closest('#companion-stage')).map(e=>({r:e.getBoundingClientRect(),weight:e.matches('button,a,input,textarea,select,summary')?30000:1800})).filter(b=>rectVisible(b.r));
    const points=[];const xs=[preferredX,clamp(r.right+12,10,innerWidth-w-10),clamp(r.left+16,10,innerWidth-w-10),clamp(r.right-w-16,10,innerWidth-w-10)];
    for(const x of xs){for(const y of [ty,r.top-h-12,r.bottom+12])points.push({x,y:clamp(y,12,innerHeight-h-14)});for(let y=Math.max(12,ty-140);y<Math.min(innerHeight-h-12,ty+140);y+=28)points.push({x,y});}
    const cost=p=>Math.hypot(p.x-preferredX,p.y-ty)+blocks.reduce((sum,b)=>sum+(p.x<b.r.right+5&&p.x+w>b.r.left-5&&p.y<b.r.bottom+5&&p.y+h>b.r.top-5?b.weight:0),0);
    return {...points.sort((a,b)=>cost(a)-cost(b))[0],w,h};
  };

  const setDocked = dock => {
    if (dock) { flightAnimation?.cancel(); clearTimeout(moveTimer); hideBubble(); if (pet.parentNode !== stage) stage.prepend(pet); pet.style.removeProperty('width'); pet.style.removeProperty('height'); flight.hidden = true; bubble.hidden = true; emitter.active = false; }
    else { if (pet.parentNode !== flight) flight.prepend(pet); const narrow = innerWidth < 680; pet.style.width = `${narrow ? 62 : 74}px`; pet.style.height = `${narrow ? 68 : 80}px`; flight.hidden = false; }
  };
  const moveTo = (target, reason = 'focus', immediate = false) => {
    if (!usable()) { setDocked(true); return; }
    target=contentTarget(target);const p = edgePerch(target); destination = p; setDocked(false); clearTimeout(moveTimer);
    const intent = reason === 'reply' ? 'accompanying' : reason === 'idle' ? 'inviting' : reason === 'scroll' ? 'accompanying' : reason === 'chat' ? 'listening' : target?.closest?.('#services') ? 'reading-services' : target?.closest?.('.breakout') ? 'observing-game' : target?.closest?.('.showcase-card') ? 'exploring-design' : 'listening';
    flight.dataset.reason = reason; flight.dataset.intent = intent; flight.dataset.targetKind = target?.closest?.('#services') ? 'services' : target?.closest?.('.breakout') ? 'breakout' : target?.closest?.('.showcase-card') ? 'showcase' : target?.closest?.('#composer') || target === input ? 'chat' : 'interactive';
    const current = flight.getBoundingClientRect(); const from = { x: current.left || p.x, y: current.top || p.y };
    const distance = Math.hypot(p.x - from.x, p.y - from.y);const journey=planPetFlight(from,p,{width:innerWidth,height:innerHeight,trip:flightTrip++});const duration=immediate?0:journey.duration;if(!immediate){p.x=journey.points.at(-1).x;p.y=journey.points.at(-1).y;}flight.dataset.path=immediate?'perch':journey.kind;
    emitter = { active: !immediate && distance > 8, burst: reason === 'reply', x: from.x + 38, y: from.y + 82, vx: (p.x - from.x) / Math.max(duration / 1000, .1), vy: (p.y - from.y) / Math.max(duration / 1000, .1) };
    flight.dataset.flying = String(!immediate && distance > 8); flight.dataset.reason = reason; flight.dataset.mood = stage.dataset.mood || 'idle';
    flight.style.setProperty('--lean', p.x >= from.x ? '7deg' : '-7deg');
    flightAnimation?.cancel();
    if (duration) flightAnimation = flight.animate(journey.points.map(point=>({transform:`translate3d(${point.x}px,${point.y}px,0)`,offset:point.offset})), { duration, easing: 'cubic-bezier(.35,0,.25,1)' });
    flight.style.transform = `translate3d(${p.x}px,${p.y}px,0)`; lastMove = performance.now();
    moveTimer = setTimeout(() => { const r=target?.getBoundingClientRect?.(); if(r){pet.style.setProperty('--look-x',`${clamp((r.left+r.width/2-p.x-35)/80,-3,3)}px`);pet.style.setProperty('--look-y',`${clamp((r.top+r.height/2-p.y-40)/100,-2,2)}px`);} flight.dataset.flying = 'false'; emitter.active = false; if (reason === 'idle') showInvite(); else if(reason==='chat')sayAside('chat',true);else if (reason === 'focus' && target?.closest?.('.breakout,.showcase-card,#services')) showArrival(target); }, duration);
  };
  const hideBubble = () => { bubble.hidden = true; clearTimeout(bubbleTimer); flight.dataset.point = 'false'; input?.classList.remove('dot-invite'); };
  const placeSpeech=()=>{
    const r=pet.getBoundingClientRect();bubble.hidden=false;bubble.style.left='8px';const measured=bubble.getBoundingClientRect(),w=measured.width,h=measured.height;
    const blocks=[r,...[...document.querySelectorAll('h1,h2,h3,p,button,a,input,textarea,select,summary')].filter(e=>!e.closest('#companion-stage')).map(e=>e.getBoundingClientRect()).filter(rectVisible)];
    const candidates=[];for(const x of [r.right+12,r.left-w-12,r.left+r.width/2-w/2])for(const y of [r.top,r.top-h-12,r.bottom+12,r.top-h-60,r.bottom+60])candidates.push({x:clamp(x,8,innerWidth-w-8),y:clamp(y,8,innerHeight-h-8)});
    const score=p=>Math.hypot(p.x+w/2-(r.left+r.width/2),p.y+h/2-(r.top+r.height/2))+blocks.reduce((sum,b)=>sum+(p.x<b.right+6&&p.x+w>b.left-6&&p.y<b.bottom+6&&p.y+h>b.top-6?100000:0),0);
    const place=candidates.sort((a,b)=>score(a)-score(b))[0];bubble.style.left=`${place.x}px`;bubble.style.top=`${place.y}px`;
  };

  const showInvite = () => { if (!usable() || document.activeElement === input || !rectVisible(input?.getBoundingClientRect()) || performance.now() - lastActivity < 15000 || bubble.hidden === false) return; bubble.textContent = nextAside('idle');bubble.dataset.context='idle';lastBubble=performance.now(); placeSpeech(); bubble.hidden = false; flight.dataset.point = 'true';const r=input.getBoundingClientRect();flight.style.setProperty('--point-angle',`${Math.atan2(r.top+r.height/2-destination.y-50,r.left+r.width/2-destination.x-60)*180/Math.PI+23}deg`); input?.classList.add('dot-invite'); bubbleTimer = setTimeout(hideBubble, 4800); };
  const sayAside = (context,onFocus=false) => {
    if(!usable()||(editing()&&!(context==='chat'&&onFocus&&lastTyping<lastMove))||!bubble.hidden||document.querySelector('#intro')||flight.dataset.flying==='true'||(onFocus?performance.now()-lastEncouragement<10000:performance.now()-lastBubble<14000))return;
    if(onFocus)lastEncouragement=performance.now();bubble.textContent=nextAside(context);bubble.dataset.context=context;placeSpeech();bubble.hidden=false;lastBubble=performance.now();flight.dataset.point='false';bubbleTimer=setTimeout(hideBubble,5200);
  };
  const showArrival = target => sayAside(target.closest('#services')?'services':target.closest('.breakout')?'game':'design');

  const noteActivity = () => { lastActivity = performance.now(); hideBubble(); };
  const onInput=()=>{lastTyping=performance.now();noteActivity();};
  const focusOrHover = e => { if(e.type==='pointerover'&&performance.now()-lastDodge<1400)return;const target = e.target.closest?.(INTERACTIVE); if (!target || target.closest('.dot-flight,.dot-bubble,header,.handoff')||!target.closest('main') || (target === activeTarget && performance.now() - lastMove < 1200)) return; activeTarget = target; clearTimeout(scrollTimer); noteActivity(); moveTo(target, target.closest('#composer') ? 'chat' : 'focus'); };
  const returnToChat = () => { noteActivity(); moveTo(input || document.querySelector('#composer'), 'reply'); };
  const sync = () => { flight.dataset.still = stage.dataset.still || 'false'; flight.dataset.mood = stage.dataset.mood || 'idle'; if (!usable()) setDocked(true); else if (pet.parentNode !== flight || flight.hidden) moveTo(stage, 'return', true); };
  const onScroll = () => { if (disposed) return; hideBubble();lastActivity=performance.now();clearTimeout(scrollTimer);if(!usable()){setDocked(true);return;}const focused=document.activeElement;const target=focused?.matches(INTERACTIVE)&&rectVisible(focused.getBoundingClientRect())?focused:document.elementFromPoint(innerWidth/2,innerHeight*.45)?.closest('.showcase-card,.turn,#composer');const reason=target===focused?(target===input?'chat':'focus'):'scroll';const r=pet.getBoundingClientRect();if(r.right>innerWidth||r.bottom>innerHeight||r.left<0||r.top<0)moveTo(target,reason,true);scrollTimer=setTimeout(()=>moveTo(target,reason),120); };

  const tickle = event => {
    if(event.pointerType!=='mouse'||!usable()||editing()||document.querySelector('#intro')||performance.now()-lastDodge<1200||flight.dataset.flying==='true')return;
    const r=pet.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=cx-event.clientX,dy=cy-event.clientY;if(Math.hypot(dx,dy)>58)return;
    const obstacles=[...document.querySelectorAll('button,a,input,textarea,select,summary,h1,h2,h3,p')].map(e=>e.getBoundingClientRect()).filter(rectVisible);
    const angle=Math.atan2(dy||-1,dx||1),candidates=[0,.8,-.8,1.6,-1.6,Math.PI].map(turn=>({x:clamp(r.left+Math.cos(angle+turn)*85,12,innerWidth-94),y:clamp(r.top+Math.sin(angle+turn)*65,14,innerHeight-112)}));
    const end=candidates.find(q=>Math.hypot(q.x-r.left,q.y-r.top)>35&&!obstacles.some(b=>q.x<b.right+4&&q.x+78>b.left-4&&q.y<b.bottom+4&&q.y+86>b.top-4));if(!end)return;
    lastDodge=performance.now();lastActivity=lastDodge;clearTimeout(scrollTimer);clearTimeout(moveTimer);hideBubble();flightAnimation?.cancel();
    const start=flight.getBoundingClientRect(),journey=planPetFlight({x:start.left,y:start.top},end,{width:innerWidth,height:innerHeight,trip:1});const landing=journey.points.at(-1);destination={...destination,x:landing.x,y:landing.y};
    flight.dataset.flying='true';flight.dataset.path='tickle';flight.dataset.dodges=String(Number(flight.dataset.dodges||0)+1);flight.style.setProperty('--lean',end.x>start.left?'12deg':'-12deg');
    flightAnimation=flight.animate(journey.points.map(p=>({transform:`translate3d(${p.x}px,${p.y}px,0)`,offset:p.offset})),{duration:700,easing:'cubic-bezier(.15,.7,.2,1)'});flight.style.transform=`translate3d(${landing.x}px,${landing.y}px,0)`;moveTimer=setTimeout(()=>{flight.dataset.flying='false';sayAside('tickle');},700);
  };

  const moodObserver = new MutationObserver(() => { sync(); if (usable() && (stage.dataset.mood === 'reply' || stage.dataset.mood === 'thinking')) returnToChat(); });
  moodObserver.observe(stage, { attributes: true, attributeFilter: ['data-mood', 'data-still'] });
  const hiddenObserver = new MutationObserver(sync); hiddenObserver.observe(pet, { attributes: true, attributeFilter: ['hidden'] });
  let emitterPrevious;const bubbleStop = createBubbleField(document.body, () => {const now=performance.now(),r=pet.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height*.78;if(emitterPrevious&&now>emitterPrevious.t){const dt=Math.max(.008,(now-emitterPrevious.t)/1000);emitter.vx=clamp((cx-emitterPrevious.x)/dt,-500,500);emitter.vy=clamp((cy-emitterPrevious.y)/dt,-500,500);}emitterPrevious={x:cx,y:cy,t:now};emitter.x=cx;emitter.y=cy;emitter.podOffset=r.width*.33;emitter.suspended=!usable()||!!document.querySelector('#intro');emitter.moving=flight.dataset.flying==='true';emitter.active=usable();return emitter;});
  document.addEventListener('focusin', focusOrHover); document.addEventListener('pointerover', focusOrHover, { passive: true });document.addEventListener('pointermove',tickle,{passive:true}); document.addEventListener('pointerdown', noteActivity, { passive: true }); document.addEventListener('keydown', noteActivity);document.addEventListener('input',onInput); document.addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll, { passive: true }); reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); document.addEventListener('toggle', sync, true); addEventListener('pagehide', () => { emitter.active = false; setDocked(true); }); addEventListener('pageshow', sync);
  sync();
  const helloTimer=setTimeout(()=>{if(!usable()||document.activeElement===input||!rectVisible(stage.getBoundingClientRect()))return;moveTo(stage,'welcome',true);bubble.textContent="I'm Sam! I'll guide you.";bubble.dataset.context='welcome';lastBubble=performance.now();placeSpeech();bubble.hidden=false;bubbleTimer=setTimeout(hideBubble,6500);},2300);
  const chatter=setInterval(()=>{if(performance.now()-lastActivity<3500)return;const mood=stage.dataset.mood;const kind=flight.dataset.targetKind;const context=mood==='thinking'?'thinking':mood==='reply'?'reply':kind==='services'?'services':kind==='breakout'?'game':kind==='showcase'?'design':kind==='chat'?'chat':document.querySelector('.turn.assistant')?'reply':'general';sayAside(context);},3000);
  const idle = setInterval(() => { if (usable() && document.activeElement !== input && rectVisible(input?.getBoundingClientRect()) && stage.dataset.mood === 'idle' && !idleHinted && performance.now() - lastActivity > 15000) { idleHinted = true; moveTo(input || stage, 'idle'); } }, 2000);
  return () => { disposed = true; clearTimeout(helloTimer); clearInterval(chatter); clearInterval(idle); clearTimeout(scrollTimer); clearTimeout(moveTimer); hideBubble(); flightAnimation?.cancel(); moodObserver.disconnect(); hiddenObserver.disconnect(); bubbleStop(); stage.prepend(pet); flight.remove(); bubble.remove(); document.removeEventListener('focusin', focusOrHover); document.removeEventListener('pointerover', focusOrHover);document.removeEventListener('pointermove',tickle); document.removeEventListener('pointerdown', noteActivity); document.removeEventListener('keydown', noteActivity);document.removeEventListener('input',onInput); document.removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); reduced.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); document.removeEventListener('toggle', sync, true); removeEventListener('pageshow', sync); };
}
