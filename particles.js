// Canvas particle background — deferred to after content paint
function _initCanvasParticles(){
(function canvasParticles(){
  const canvas = document.getElementById('bg-canvas');
  const gradContainer = document.getElementById('gradients');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  // Resize handling
  function resize(){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Particle system parameters
  const palette = [ '#66d1ff', '#4bd3c7', '#a48dff', '#8fb0ff', '#ffc765' ]; // blues, teal, purple, warm accent
  const bgColor = '#0a0a1a';
  const numParticles = Math.max(80, Math.round((window.innerWidth * window.innerHeight) / 4500)); // scale with area
  const particles = [];
  const depths = [0.35, 0.6, 0.9, 1.2]; // different layers speeds

  // create particles
  function initParticles(){
    particles.length = 0;
    for(let i=0;i<numParticles;i++){
      const depth = depths[Math.floor(Math.random()*depths.length)];
      const size = Math.random()*3 + 1; // 1-4 px
      const x = Math.random()*window.innerWidth;
      const y = Math.random()*window.innerHeight;
      const vx = (Math.random()*0.4 - 0.2) * (1/depth); // slower for deeper
      const vy = (Math.random()*0.2 - 0.1) * (1/depth);
      const color = palette[Math.floor(Math.random()*palette.length)];
      const opacity = 0.2 + Math.random()*0.8; // vary opacity
      const star = Math.random() < 0.06; // some brighter stars
      particles.push({x,y,vx,vy,size,depth,color,opacity,star});
    }
  }
  initParticles();

  // Interaction state
  let pointer = {x:-9999,y:-9999,down:false};
  function updatePointer(e){
    const rect = canvas.getBoundingClientRect();
    pointer.x = (e.touches ? e.touches[0].clientX : e.clientX) || pointer.x;
    pointer.y = (e.touches ? e.touches[0].clientY : e.clientY) || pointer.y;
  }
  window.addEventListener('pointermove', updatePointer, {passive:true});
  window.addEventListener('touchmove', updatePointer, {passive:true});
  window.addEventListener('pointerleave', ()=>{ pointer.x=-9999; pointer.y=-9999; }, {passive:true});
  // also track pointer through the scroller overlay
  var scrollerForPointer = document.getElementById('scroller');
  if(scrollerForPointer){
    scrollerForPointer.addEventListener('pointermove', updatePointer, {passive:true});
    scrollerForPointer.addEventListener('touchmove', updatePointer, {passive:true});
  }

  // Click pulse — radial disruption matching comet intensity + visual burst
  var scrollerEl = document.getElementById('scroller');
  var clickBursts = [];
  (scrollerEl || window).addEventListener('click', function(e){
    const px = e.clientX;
    const py = e.clientY;
    const pulseRadius = 140;
    const r2 = pulseRadius * pulseRadius;
    for(var i = 0; i < particles.length; i++){
      var p = particles[i];
      var dx = p.x - px;
      var dy = p.y - py;
      var d2 = dx*dx + dy*dy;
      if(d2 < r2 && d2 > 1){
        var d = Math.sqrt(d2);
        var force = (1 - d / pulseRadius);
        if(p.homeX === undefined){ p.homeX = p.x; p.homeY = p.y; p.origVx = p.vx; p.origVy = p.vy; p.settleDelay = 0; }
        var pushX = (dx / d) * force;
        var pushY = (dy / d) * force;
        p.x += pushX * 2;
        p.y += pushY * 2;
        p.vx += pushX * 1.25;
        p.vy += pushY * 1.25;
        p.settleDelay = 0;
      }
    }
    // spawn visual burst
    clickBursts.push({x: px, y: py, age: 0, maxAge: 0.6});
  }, {passive:true});

  // draw click bursts — expanding ring + flash
  function drawClickBursts(dt){
    var s = dt / 1000;
    for(var i = clickBursts.length - 1; i >= 0; i--){
      var b = clickBursts[i];
      b.age += s;
      if(b.age > b.maxAge){ clickBursts.splice(i, 1); continue; }
      var t = b.age / b.maxAge; // 0→1
      var alpha = (1 - t) * 0.35;
      var radius = 8 + t * 80;
      // expanding ring
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(180,215,255,' + alpha + ')';
      ctx.lineWidth = 1.5 * (1 - t);
      ctx.arc(b.x, b.y, radius, 0, Math.PI*2);
      ctx.stroke();
      // inner flash
      if(t < 0.3){
        var flashAlpha = (1 - t / 0.3) * 0.25;
        var fg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 20 * (1 - t));
        fg.addColorStop(0, 'rgba(220,240,255,' + flashAlpha + ')');
        fg.addColorStop(1, 'rgba(200,220,255,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 20 * (1 - t), 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // Parallax offsets based on horizontal scroll
  let parallaxOffset = 0; // 0..1 based on scroller
  const scroller = document.getElementById('scroller');
  var mobileParallax = window.matchMedia('(max-width:720px)');
  function updateParallax(){
    if(!scroller) return;
    if(mobileParallax.matches){
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      parallaxOffset = window.scrollY / maxScroll;
    } else {
      const maxScroll = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
      parallaxOffset = scroller.scrollLeft / maxScroll;
    }
  }
  if(scroller){
    scroller.addEventListener('scroll', ()=>{ requestAnimationFrame(updateParallax); });
    window.addEventListener('scroll', ()=>{ requestAnimationFrame(updateParallax); }, {passive:true});
    updateParallax();
  }

  // Animation loop
  let last = performance.now();
  function tick(now){
    const dt = Math.min(40, now - last);
    last = now;
    // clear
    ctx.fillStyle = bgColor;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw connecting lines subtly
    ctx.lineWidth = 0.6;
    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      // update position — skip normal movement for comet-disrupted particles
      const parallaxX = (parallaxOffset - 0.5) * (30 * (1/p.depth));
      if(p.homeX === undefined){
        p.x += p.vx * (dt/16);
        p.y += p.vy * (dt/16);
        // gentle noise movement
        p.x += Math.sin((now/4000 + i) * 0.7) * 0.02;
        p.y += Math.cos((now/3000 + i) * 0.5) * 0.01;
      } else {
        // disrupted: spring-back controls movement via vx/vy
        p.x += p.vx * (dt/16);
        p.y += p.vy * (dt/16);
      }
      // wrap around edges (skip disrupted particles — let spring handle them)
      if(p.homeX === undefined){
        if(p.x < -20) p.x = window.innerWidth + 20;
        if(p.x > window.innerWidth + 20) p.x = -20;
        if(p.y < -20) p.y = window.innerHeight + 20;
        if(p.y > window.innerHeight + 20) p.y = -20;
      }
    }

    // Mouse wake — disrupt particles like a comet as mouse moves
    const wakeRadius = 80;
    const wakeR2 = wakeRadius * wakeRadius;
    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      if(p.homeX !== undefined) continue;
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d2 = dx*dx + dy*dy;
      if(d2 < wakeR2 && d2 > 1){
        const d = Math.sqrt(d2);
        const force = (1 - d / wakeRadius);
        p.homeX = p.x; p.homeY = p.y; p.origVx = p.vx; p.origVy = p.vy; p.settleDelay = 0;
        const pushX = (dx / d) * force;
        const pushY = (dy / d) * force;
        p.x += pushX * 2;
        p.y += pushY * 2;
        p.vx += pushX * 1.25;
        p.vy += pushY * 1.25;
      }
    }

    // draw connections
    for(let i=0;i<particles.length;i++){
      const a = particles[i];
      for(let j=i+1;j<particles.length;j++){
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        if(d2 < 16000){ // within ~126px
          const alpha = Math.max(0, 0.12 - d2 / 16000 * 0.12) * (1/( (a.depth+b.depth)/2 ));
          ctx.strokeStyle = 'rgba(140,170,255,'+ (alpha*0.9) +')';
          ctx.beginPath();
          ctx.moveTo(a.x + (parallaxOffset-0.5) * (10*(1/a.depth)), a.y);
          ctx.lineTo(b.x + (parallaxOffset-0.5) * (10*(1/b.depth)), b.y);
          ctx.stroke();
        }
      }
    }

    // Update & draw comet + click bursts
    updateComet(dt);
    springBack(dt);
    drawComet();
    drawClickBursts(dt);

    // draw particles on top of lines
    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      const px = p.x + parallaxXFor(p.depth);
      // glow
      if(p.star){
        ctx.beginPath();
        const grd = ctx.createRadialGradient(px, p.y, 0, px, p.y, p.size*6);
        grd.addColorStop(0, rgba(p.color, p.opacity * 1.0));
        grd.addColorStop(0.6, rgba(p.color, p.opacity * 0.18));
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(px - p.size*6, p.y - p.size*6, p.size*12, p.size*12);
      }
      // core
      ctx.beginPath();
      ctx.fillStyle = rgba(p.color, p.opacity);
      ctx.arc(px, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  function parallaxXFor(depth){
    return (parallaxOffset - 0.5) * (40 * (1/depth));
  }

  function rgba(hex, a){
    const c = hex.replace('#','');
    const r = parseInt(c.substring(0,2),16);
    const g = parseInt(c.substring(2,4),16);
    const b = parseInt(c.substring(4,6),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }

  // --- Comet system ---
  // Sporadic comet every 30-60s that disrupts nearby particles
  let comet = null;

  function spawnComet(){
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Pick a random edge to enter from: 0=left, 1=right, 2=top, 3=bottom
    const edge = Math.floor(Math.random() * 4);
    let startX, startY;
    if(edge === 0){      startX = -40;        startY = Math.random() * h; }
    else if(edge === 1){ startX = w + 40;     startY = Math.random() * h; }
    else if(edge === 2){ startX = Math.random() * w; startY = -40; }
    else {               startX = Math.random() * w; startY = h + 40; }
    // Exit toward a random point on the opposite-ish side
    const exitEdge = (edge + 2 + Math.floor(Math.random() * 2 - 0.5)) % 4;
    let endX, endY;
    if(exitEdge === 0){      endX = -40;        endY = Math.random() * h; }
    else if(exitEdge === 1){ endX = w + 40;     endY = Math.random() * h; }
    else if(exitEdge === 2){ endX = Math.random() * w; endY = -40; }
    else {                   endX = Math.random() * w; endY = h + 40; }
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const speed = Math.max(w, h) / (1.2 + Math.random() * 0.6); // cross in ~1.2-1.8s
    comet = {
      x: startX, y: startY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      life: 0,
      maxLife: dist / speed,
      trail: [],
      radius: 140 // disruption radius
    };
  }

  function scheduleComet(){
    const delay = (30 + Math.random() * 30) * 1000;
    setTimeout(()=>{ spawnComet(); scheduleComet(); }, delay);
  }
  // first comet after 8-15s so it's a surprise
  setTimeout(()=>{ spawnComet(); scheduleComet(); }, 8000 + Math.random() * 7000);

  function updateComet(dt){
    if(!comet) return;
    const s = dt / 1000;
    comet.x += comet.vx * s;
    comet.y += comet.vy * s;
    comet.life += s;
    // store trail point
    comet.trail.push({x: comet.x, y: comet.y, age: 0});
    // age trail points
    for(let i = comet.trail.length - 1; i >= 0; i--){
      comet.trail[i].age += s;
      if(comet.trail[i].age > 0.6) comet.trail.splice(i, 1);
    }
    // disrupt nearby particles — push them away with immediate displacement
    const r2 = comet.radius * comet.radius;
    for(let i = 0; i < particles.length; i++){
      const p = particles[i];
      const dx = p.x - comet.x;
      const dy = p.y - comet.y;
      const d2 = dx*dx + dy*dy;
      if(d2 < r2 && d2 > 1){
        const d = Math.sqrt(d2);
        const force = (1 - d / comet.radius);
        // store home position and original velocity for spring-back
        if(p.homeX === undefined){ p.homeX = p.x; p.homeY = p.y; p.origVx = p.vx; p.origVy = p.vy; p.settleDelay = 0; }
        // subtle position displacement + gentle velocity kick
        const pushX = (dx / d) * force;
        const pushY = (dy / d) * force;
        p.x += pushX * 2;
        p.y += pushY * 2;
        p.vx += pushX * 1.25;
        p.vy += pushY * 1.25;
        p.settleDelay = 0; // reset settle delay — comet is still nearby
      }
    }
    // expire
    if(comet.life > comet.maxLife + 0.3) comet = null;
  }

  function drawComet(){
    if(!comet) return;
    // draw trail
    for(let i = 0; i < comet.trail.length; i++){
      const t = comet.trail[i];
      const alpha = Math.max(0, 1 - t.age / 0.6);
      const size = 2.5 * alpha;
      ctx.beginPath();
      ctx.fillStyle = rgba('#ffeedd', alpha * 0.7);
      ctx.arc(t.x, t.y, size, 0, Math.PI*2);
      ctx.fill();
    }
    // draw head with glow + lens flare
    if(comet.life <= comet.maxLife){
      const cx = comet.x;
      const cy = comet.y;
      // outer glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
      grd.addColorStop(0, 'rgba(255,240,220,0.9)');
      grd.addColorStop(0.3, 'rgba(255,200,140,0.4)');
      grd.addColorStop(1, 'rgba(255,200,140,0)');
      ctx.beginPath();
      ctx.fillStyle = grd;
      ctx.arc(cx, cy, 18, 0, Math.PI*2);
      ctx.fill();

      // lens flare — oriented along comet's travel direction
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const angle = Math.atan2(comet.vy, comet.vx);
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // main streak along travel axis
      const streak1 = ctx.createLinearGradient(-80, 0, 80, 0);
      streak1.addColorStop(0, 'rgba(255,220,180,0)');
      streak1.addColorStop(0.35, 'rgba(255,235,210,0.25)');
      streak1.addColorStop(0.5, 'rgba(255,250,240,0.5)');
      streak1.addColorStop(0.65, 'rgba(255,235,210,0.25)');
      streak1.addColorStop(1, 'rgba(255,220,180,0)');
      ctx.fillStyle = streak1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 80, 3, 0, 0, Math.PI*2);
      ctx.fill();

      // cross streak perpendicular
      const streak2 = ctx.createLinearGradient(0, -45, 0, 45);
      streak2.addColorStop(0, 'rgba(200,220,255,0)');
      streak2.addColorStop(0.35, 'rgba(220,235,255,0.12)');
      streak2.addColorStop(0.5, 'rgba(240,248,255,0.28)');
      streak2.addColorStop(0.65, 'rgba(220,235,255,0.12)');
      streak2.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = streak2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 2, 45, 0, 0, Math.PI*2);
      ctx.fill();

      // wide soft bloom around the head
      const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
      bloom.addColorStop(0, 'rgba(255,245,230,0.2)');
      bloom.addColorStop(0.4, 'rgba(255,230,200,0.08)');
      bloom.addColorStop(1, 'rgba(255,220,180,0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI*2);
      ctx.fill();

      // ghost orbs trailing behind along the flare axis
      var ghosts = [{d: -35, r: 6, a: 0.1}, {d: -55, r: 9, a: 0.06}, {d: -75, r: 4, a: 0.08}];
      ghosts.forEach(function(g){
        var gg = ctx.createRadialGradient(g.d, 0, 0, g.d, 0, g.r);
        gg.addColorStop(0, 'rgba(180,215,255,' + g.a + ')');
        gg.addColorStop(0.5, 'rgba(160,200,255,' + (g.a * 0.3) + ')');
        gg.addColorStop(1, 'rgba(160,200,255,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(g.d, 0, g.r, 0, Math.PI*2);
        ctx.fill();
      });

      ctx.restore();

      // bright core
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,252,245,0.95)';
      ctx.arc(cx, cy, 2.5, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // Spring-back: wait for comet to pass, then gently return particles home
  function springBack(dt){
    const s = dt / 1000;
    for(let i = 0; i < particles.length; i++){
      const p = particles[i];
      if(p.homeX !== undefined){
        // let particles drift freely for 1s after last comet contact, then settle over ~4s
        p.settleDelay = (p.settleDelay || 0) + s;
        if(p.settleDelay < 1.0){
          // gentle natural damping while drifting
          p.vx *= Math.max(0, 1 - 0.3 * s);
          p.vy *= Math.max(0, 1 - 0.3 * s);
          continue;
        }
        // ease-in the spring strength over 4 seconds (settleDelay 1.0 → 5.0)
        const settleT = Math.min(1, (p.settleDelay - 1.0) / 4.0); // 0→1 over 4s
        const springStr = 0.3 + settleT * 1.2; // ramps from 0.3 to 1.5
        const dampStr = 0.8 + settleT * 1.5; // ramps from 0.8 to 2.3
        const dx = p.homeX - p.x;
        const dy = p.homeY - p.y;
        const d2 = dx*dx + dy*dy;
        if(d2 < 4 && p.settleDelay > 3.0){
          // close enough — snap home and restore normal behavior
          p.x = p.homeX; p.y = p.homeY;
          p.vx = p.origVx; p.vy = p.origVy;
          delete p.homeX; delete p.homeY;
          delete p.origVx; delete p.origVy;
          delete p.settleDelay;
        } else {
          p.vx += dx * springStr * s;
          p.vy += dy * springStr * s;
          // extra damping when close to prevent oscillation
          const closeDamp = d2 < 25 ? 2.0 : 0;
          p.vx *= Math.max(0, 1 - (dampStr + closeDamp) * s);
          p.vy *= Math.max(0, 1 - (dampStr + closeDamp) * s);
        }
      }
    }
  }

  // kick off
  requestAnimationFrame(tick);

  // Re-init on orientation change / resize
  window.addEventListener('orientationchange', ()=>{ setTimeout(()=>{ initParticles(); resize(); },300); });

  // Fade in the background layer
  document.querySelector('.parallax-layer').classList.add('loaded');

})();
}
// Defer particle system until after first content paint
if('requestIdleCallback' in window){ requestIdleCallback(_initCanvasParticles, {timeout:1500}); }
else { setTimeout(_initCanvasParticles, 100); }
