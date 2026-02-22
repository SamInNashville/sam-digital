/**
 * particles.js — Canvas particle background + comet system
 * Fully self-contained. Manages its own DOM (.parallax-layer fade-in).
 * Load order: LAST (loaded dynamically after content paint)
 */
(function(){
  var layer = document.querySelector('.parallax-layer');
  var canvas = document.getElementById('bg-canvas');
  if(!canvas || !layer) return;

  // Show the layer (was hidden on mobile via CSS)
  layer.style.display = 'block';

  var ctx = canvas.getContext('2d');
  var isMobile = window.matchMedia('(max-width:720px)');

  // --- Resize ---
  function resize(){
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var w = window.innerWidth, h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Particles ---
  var palette = ['#66d1ff','#4bd3c7','#a48dff','#8fb0ff','#ffc765'];
  var bgColor = '#0a0a1a';
  var numParticles = isMobile.matches
    ? Math.max(40, Math.round((window.innerWidth * window.innerHeight) / 8000))
    : Math.max(80, Math.round((window.innerWidth * window.innerHeight) / 4500));
  var particles = [];
  var depths = [0.35, 0.6, 0.9, 1.2];

  function initParticles(){
    particles.length = 0;
    for(var i=0;i<numParticles;i++){
      var depth = depths[Math.floor(Math.random()*depths.length)];
      particles.push({
        x: Math.random()*window.innerWidth,
        y: Math.random()*window.innerHeight,
        vx: (Math.random()*0.4 - 0.2) * (1/depth),
        vy: (Math.random()*0.2 - 0.1) * (1/depth),
        size: Math.random()*3 + 1,
        depth: depth,
        color: palette[Math.floor(Math.random()*palette.length)],
        opacity: 0.2 + Math.random()*0.8,
        star: Math.random() < 0.06
      });
    }
  }
  initParticles();

  // --- Pointer tracking ---
  var pointer = {x:-9999, y:-9999};
  function updatePointer(e){
    pointer.x = (e.touches ? e.touches[0].clientX : e.clientX) || pointer.x;
    pointer.y = (e.touches ? e.touches[0].clientY : e.clientY) || pointer.y;
  }
  window.addEventListener('pointermove', updatePointer, {passive:true});
  window.addEventListener('touchmove', updatePointer, {passive:true});
  window.addEventListener('pointerleave', function(){ pointer.x=-9999; pointer.y=-9999; }, {passive:true});

  // --- Click bursts ---
  var clickBursts = [];
  window.addEventListener('click', function(e){
    var px=e.clientX, py=e.clientY, pulseRadius=140, r2=pulseRadius*pulseRadius;
    for(var i=0;i<particles.length;i++){
      var p=particles[i], dx=p.x-px, dy=p.y-py, d2=dx*dx+dy*dy;
      if(d2<r2 && d2>1){
        var d=Math.sqrt(d2), force=1-d/pulseRadius;
        if(p.homeX===undefined){p.homeX=p.x;p.homeY=p.y;p.origVx=p.vx;p.origVy=p.vy;p.settleDelay=0;}
        var pushX=(dx/d)*force, pushY=(dy/d)*force;
        p.x+=pushX*2; p.y+=pushY*2; p.vx+=pushX*1.25; p.vy+=pushY*1.25; p.settleDelay=0;
      }
    }
    clickBursts.push({x:px,y:py,age:0,maxAge:0.6});
  }, {passive:true});

  function drawClickBursts(dt){
    var s=dt/1000;
    for(var i=clickBursts.length-1;i>=0;i--){
      var b=clickBursts[i]; b.age+=s;
      if(b.age>b.maxAge){clickBursts.splice(i,1);continue;}
      var t=b.age/b.maxAge, alpha=(1-t)*0.35, radius=8+t*80;
      ctx.beginPath(); ctx.strokeStyle='rgba(180,215,255,'+alpha+')'; ctx.lineWidth=1.5*(1-t);
      ctx.arc(b.x,b.y,radius,0,Math.PI*2); ctx.stroke();
      if(t<0.3){
        var fa=(1-t/0.3)*0.25, fg=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,20*(1-t));
        fg.addColorStop(0,'rgba(220,240,255,'+fa+')'); fg.addColorStop(1,'rgba(200,220,255,0)');
        ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(b.x,b.y,20*(1-t),0,Math.PI*2); ctx.fill();
      }
    }
  }

  // --- Parallax offset ---
  var parallaxOffset = 0;
  var scroller = document.getElementById('scroller');
  function updateParallax(){
    if(!scroller) return;
    if(isMobile.matches){
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      parallaxOffset = window.scrollY / max;
    } else {
      var max = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
      parallaxOffset = scroller.scrollLeft / max;
    }
  }
  if(scroller) scroller.addEventListener('scroll', function(){ requestAnimationFrame(updateParallax); });
  window.addEventListener('scroll', function(){ requestAnimationFrame(updateParallax); }, {passive:true});
  updateParallax();

  // --- Helpers ---
  function rgba(hex, a){
    var c=hex.replace('#','');
    return 'rgba('+parseInt(c.substring(0,2),16)+','+parseInt(c.substring(2,4),16)+','+parseInt(c.substring(4,6),16)+','+a+')';
  }
  function parallaxXFor(depth){ return (parallaxOffset-0.5)*(40*(1/depth)); }

  // --- Comet ---
  var comet = null;
  function spawnComet(){
    var w=window.innerWidth, h=window.innerHeight;
    var edge=Math.floor(Math.random()*4); var sx,sy;
    if(edge===0){sx=-40;sy=Math.random()*h;}else if(edge===1){sx=w+40;sy=Math.random()*h;}
    else if(edge===2){sx=Math.random()*w;sy=-40;}else{sx=Math.random()*w;sy=h+40;}
    var exitEdge=(edge+2+Math.floor(Math.random()*2-0.5))%4; var ex,ey;
    if(exitEdge===0){ex=-40;ey=Math.random()*h;}else if(exitEdge===1){ex=w+40;ey=Math.random()*h;}
    else if(exitEdge===2){ex=Math.random()*w;ey=-40;}else{ex=Math.random()*w;ey=h+40;}
    var dx=ex-sx,dy=ey-sy,dist=Math.sqrt(dx*dx+dy*dy);
    var speed=Math.max(w,h)/(1.2+Math.random()*0.6);
    comet={x:sx,y:sy,vx:(dx/dist)*speed,vy:(dy/dist)*speed,life:0,maxLife:dist/speed,trail:[],radius:140};
  }
  function scheduleComet(){ setTimeout(function(){spawnComet();scheduleComet();}, (30+Math.random()*30)*1000); }
  setTimeout(function(){spawnComet();scheduleComet();}, 8000+Math.random()*7000);

  function updateComet(dt){
    if(!comet) return;
    var s=dt/1000;
    comet.x+=comet.vx*s; comet.y+=comet.vy*s; comet.life+=s;
    comet.trail.push({x:comet.x,y:comet.y,age:0});
    for(var i=comet.trail.length-1;i>=0;i--){ comet.trail[i].age+=s; if(comet.trail[i].age>0.6) comet.trail.splice(i,1); }
    var r2=comet.radius*comet.radius;
    for(var i=0;i<particles.length;i++){
      var p=particles[i],dx=p.x-comet.x,dy=p.y-comet.y,d2=dx*dx+dy*dy;
      if(d2<r2&&d2>1){
        var d=Math.sqrt(d2),force=1-d/comet.radius;
        if(p.homeX===undefined){p.homeX=p.x;p.homeY=p.y;p.origVx=p.vx;p.origVy=p.vy;p.settleDelay=0;}
        var pushX=(dx/d)*force,pushY=(dy/d)*force;
        p.x+=pushX*2;p.y+=pushY*2;p.vx+=pushX*1.25;p.vy+=pushY*1.25;p.settleDelay=0;
      }
    }
    if(comet.life>comet.maxLife+0.3) comet=null;
  }

  function drawComet(){
    if(!comet) return;
    for(var i=0;i<comet.trail.length;i++){
      var t=comet.trail[i],alpha=Math.max(0,1-t.age/0.6),size=2.5*alpha;
      ctx.beginPath();ctx.fillStyle=rgba('#ffeedd',alpha*0.7);ctx.arc(t.x,t.y,size,0,Math.PI*2);ctx.fill();
    }
    if(comet.life<=comet.maxLife){
      var cx=comet.x,cy=comet.y;
      var grd=ctx.createRadialGradient(cx,cy,0,cx,cy,18);
      grd.addColorStop(0,'rgba(255,240,220,0.9)');grd.addColorStop(0.3,'rgba(255,200,140,0.4)');grd.addColorStop(1,'rgba(255,200,140,0)');
      ctx.beginPath();ctx.fillStyle=grd;ctx.arc(cx,cy,18,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.globalCompositeOperation='lighter';
      var angle=Math.atan2(comet.vy,comet.vx);ctx.translate(cx,cy);ctx.rotate(angle);
      var s1=ctx.createLinearGradient(-80,0,80,0);
      s1.addColorStop(0,'rgba(255,220,180,0)');s1.addColorStop(0.35,'rgba(255,235,210,0.25)');s1.addColorStop(0.5,'rgba(255,250,240,0.5)');s1.addColorStop(0.65,'rgba(255,235,210,0.25)');s1.addColorStop(1,'rgba(255,220,180,0)');
      ctx.fillStyle=s1;ctx.beginPath();ctx.ellipse(0,0,80,3,0,0,Math.PI*2);ctx.fill();
      var s2=ctx.createLinearGradient(0,-45,0,45);
      s2.addColorStop(0,'rgba(200,220,255,0)');s2.addColorStop(0.35,'rgba(220,235,255,0.12)');s2.addColorStop(0.5,'rgba(240,248,255,0.28)');s2.addColorStop(0.65,'rgba(220,235,255,0.12)');s2.addColorStop(1,'rgba(200,220,255,0)');
      ctx.fillStyle=s2;ctx.beginPath();ctx.ellipse(0,0,2,45,0,0,Math.PI*2);ctx.fill();
      var bloom=ctx.createRadialGradient(0,0,0,0,0,40);
      bloom.addColorStop(0,'rgba(255,245,230,0.2)');bloom.addColorStop(0.4,'rgba(255,230,200,0.08)');bloom.addColorStop(1,'rgba(255,220,180,0)');
      ctx.fillStyle=bloom;ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.fill();
      [{d:-35,r:6,a:0.1},{d:-55,r:9,a:0.06},{d:-75,r:4,a:0.08}].forEach(function(g){
        var gg=ctx.createRadialGradient(g.d,0,0,g.d,0,g.r);
        gg.addColorStop(0,'rgba(180,215,255,'+g.a+')');gg.addColorStop(0.5,'rgba(160,200,255,'+(g.a*0.3)+')');gg.addColorStop(1,'rgba(160,200,255,0)');
        ctx.fillStyle=gg;ctx.beginPath();ctx.arc(g.d,0,g.r,0,Math.PI*2);ctx.fill();
      });
      ctx.restore();
      ctx.beginPath();ctx.fillStyle='rgba(255,252,245,0.95)';ctx.arc(cx,cy,2.5,0,Math.PI*2);ctx.fill();
    }
  }

  // --- Spring-back ---
  function springBack(dt){
    var s=dt/1000;
    for(var i=0;i<particles.length;i++){
      var p=particles[i];
      if(p.homeX===undefined) continue;
      p.settleDelay=(p.settleDelay||0)+s;
      if(p.settleDelay<1.0){p.vx*=Math.max(0,1-0.3*s);p.vy*=Math.max(0,1-0.3*s);continue;}
      var t=Math.min(1,(p.settleDelay-1.0)/4.0);
      var ss=0.3+t*1.2, ds=0.8+t*1.5;
      var dx=p.homeX-p.x, dy=p.homeY-p.y, d2=dx*dx+dy*dy;
      if(d2<4&&p.settleDelay>3.0){
        p.x=p.homeX;p.y=p.homeY;p.vx=p.origVx;p.vy=p.origVy;
        delete p.homeX;delete p.homeY;delete p.origVx;delete p.origVy;delete p.settleDelay;
      } else {
        p.vx+=dx*ss*s; p.vy+=dy*ss*s;
        var cd=d2<25?2.0:0;
        p.vx*=Math.max(0,1-(ds+cd)*s); p.vy*=Math.max(0,1-(ds+cd)*s);
      }
    }
  }

  // --- Mouse wake ---
  function mouseWake(){
    var wr=80,wr2=wr*wr;
    for(var i=0;i<particles.length;i++){
      var p=particles[i]; if(p.homeX!==undefined) continue;
      var dx=p.x-pointer.x,dy=p.y-pointer.y,d2=dx*dx+dy*dy;
      if(d2<wr2&&d2>1){
        var d=Math.sqrt(d2),force=1-d/wr;
        p.homeX=p.x;p.homeY=p.y;p.origVx=p.vx;p.origVy=p.vy;p.settleDelay=0;
        var px=(dx/d)*force,py=(dy/d)*force;
        p.x+=px*2;p.y+=py*2;p.vx+=px*1.25;p.vy+=py*1.25;
      }
    }
  }

  // --- Main loop ---
  var last = performance.now();
  function tick(now){
    var dt=Math.min(40,now-last); last=now;
    ctx.fillStyle=bgColor; ctx.fillRect(0,0,canvas.width,canvas.height);

    // Update positions
    for(var i=0;i<particles.length;i++){
      var p=particles[i];
      if(p.homeX===undefined){
        p.x+=p.vx*(dt/16); p.y+=p.vy*(dt/16);
        p.x+=Math.sin((now/4000+i)*0.7)*0.02; p.y+=Math.cos((now/3000+i)*0.5)*0.01;
        if(p.x<-20) p.x=window.innerWidth+20; if(p.x>window.innerWidth+20) p.x=-20;
        if(p.y<-20) p.y=window.innerHeight+20; if(p.y>window.innerHeight+20) p.y=-20;
      } else {
        p.x+=p.vx*(dt/16); p.y+=p.vy*(dt/16);
      }
    }

    mouseWake();

    // Draw connections
    ctx.lineWidth=0.6;
    for(var i=0;i<particles.length;i++){
      var a=particles[i];
      for(var j=i+1;j<particles.length;j++){
        var b=particles[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;
        if(d2<16000){
          var alpha=Math.max(0,0.12-d2/16000*0.12)*(1/((a.depth+b.depth)/2));
          ctx.strokeStyle='rgba(140,170,255,'+(alpha*0.9)+')';
          ctx.beginPath();
          ctx.moveTo(a.x+(parallaxOffset-0.5)*(10*(1/a.depth)),a.y);
          ctx.lineTo(b.x+(parallaxOffset-0.5)*(10*(1/b.depth)),b.y);
          ctx.stroke();
        }
      }
    }

    updateComet(dt); springBack(dt); drawComet(); drawClickBursts(dt);

    // Draw particles
    for(var i=0;i<particles.length;i++){
      var p=particles[i], px=p.x+parallaxXFor(p.depth);
      if(p.star){
        var grd=ctx.createRadialGradient(px,p.y,0,px,p.y,p.size*6);
        grd.addColorStop(0,rgba(p.color,p.opacity));grd.addColorStop(0.6,rgba(p.color,p.opacity*0.18));grd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=grd;ctx.fillRect(px-p.size*6,p.y-p.size*6,p.size*12,p.size*12);
      }
      ctx.beginPath();ctx.fillStyle=rgba(p.color,p.opacity);ctx.arc(px,p.y,p.size,0,Math.PI*2);ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  // Start rendering + fade in
  requestAnimationFrame(tick);
  // Let first frame render, then fade in the layer
  requestAnimationFrame(function(){ layer.classList.add('loaded'); });

  window.addEventListener('orientationchange', function(){ setTimeout(function(){ initParticles(); resize(); },300); });
})();
