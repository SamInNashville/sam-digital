// Build repeated trees across the width for the SVG trees row (rounded canopies)
(function buildTrees(){
  const svgNS = 'http://www.w3.org/2000/svg';
  const group = document.getElementById('trees-repeat');
  if(!group) return;
  const width = 1600;
  // varying spacing for a more natural rhythm
  const baseSpacing = 70;
  for(let x=0;x<width;x+=baseSpacing + (Math.random()*40 - 10)){
    const g = document.createElementNS(svgNS,'g');
    const jitterY = Math.floor(Math.random()*18 - 6);
    g.setAttribute('transform',`translate(${Math.round(x)},${jitterY})`);

    // trunk
    const trunk = document.createElementNS(svgNS,'rect');
    trunk.setAttribute('x',-3); trunk.setAttribute('y',40); trunk.setAttribute('width',6); trunk.setAttribute('height',18);
    trunk.setAttribute('fill','#2b1b12'); trunk.setAttribute('opacity','0.95');

    // foliage: cluster of overlapping circles/ellipses to form organic canopy
    const canopy = document.createElementNS(svgNS,'g');
    const canopyColors = ['#2f7b49','#2a6b3a','#1f5530'];
    const cx = 0; const cy = 28;
    const sizes = [ {x:-18,y:0,rx:26,ry:20},{x:0,y:-6,rx:32,ry:22},{x:18,y:2,rx:24,ry:18},{x:-6,y:-12,rx:16,ry:12} ];
    sizes.forEach((s,i)=>{
      const c = document.createElementNS(svgNS,'ellipse');
      c.setAttribute('cx', cx + s.x);
      c.setAttribute('cy', cy + s.y);
      c.setAttribute('rx', s.rx);
      c.setAttribute('ry', s.ry);
      c.setAttribute('fill', canopyColors[i % canopyColors.length]);
      c.setAttribute('opacity', 0.98 - (i*0.03));
      canopy.appendChild(c);
    });

    // small highlight overlay to suggest sun on foliage (warm tint)
    const highlight = document.createElementNS(svgNS,'ellipse');
    highlight.setAttribute('cx', -4); highlight.setAttribute('cy', 20); highlight.setAttribute('rx', 14); highlight.setAttribute('ry', 8);
    highlight.setAttribute('fill', 'rgba(255,200,140,0.08)');

    g.appendChild(canopy);
    g.appendChild(highlight);
    g.appendChild(trunk);
    group.appendChild(g);
  }
})();

// Parallax logic: move layers horizontally at different speeds based on scroller scrollLeft
(function parallax(){
  const scroller = document.getElementById('scroller');
  const far = document.getElementById('mountains-far');
  const mid = document.getElementById('mountains-mid');
  const trees = document.getElementById('trees-mid');
  const fg = document.getElementById('foreground');
  if(scroller && far){
    // helper: set transform with translate3d for GPU
    function setX(el, x){ el.style.transform = `translate3d(${x}px,0,0)` }

    function onScroll(){
      const maxScroll = scroller.scrollWidth - scroller.clientWidth || 1;
      const t = scroller.scrollLeft / maxScroll; // 0..1
      const range = scroller.clientWidth; // rough viewport width
      setX(far, -t * range * 0.15);
      setX(mid, -t * range * 0.28);
      setX(trees, -t * range * 0.5);
      setX(fg, -t * range * 0.9);
    }

    let ticking = false;
    scroller.addEventListener('scroll',()=>{ if(!ticking){requestAnimationFrame(()=>{onScroll();ticking=false}); ticking=true;} });
    onScroll();
  }

  if(scroller){
    // keyboard arrows to navigate panels for accessibility
    scroller.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowRight'){ e.preventDefault(); scroller.scrollBy({left:scroller.clientWidth,behavior:'smooth'});} 
      if(e.key==='ArrowLeft'){ e.preventDefault(); scroller.scrollBy({left:-scroller.clientWidth,behavior:'smooth'});} 
      if(e.key==='Home'){ e.preventDefault(); scroller.scrollTo({left:0,behavior:'smooth'});} 
      if(e.key==='End'){ e.preventDefault(); scroller.scrollTo({left:scroller.scrollWidth,behavior:'smooth'});} 
    });
  }

  // anchor links: smooth scroll to panel (must always work)
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const targetId = a.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if(target){ e.preventDefault();
        if(window.matchMedia('(max-width:720px)').matches){
          target.scrollIntoView({behavior:'smooth',block:'start'});
        } else if(scroller){
          scroller.scrollTo({left: target.offsetLeft, behavior:'smooth'});
        }
      }
    });
  });

})();

// Active nav link: update as user scrolls between panels
(function activeNav(){
  var scroller = document.getElementById('scroller');
  var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  var sections = ['home','services','process','about','contact'];

  var mobileNav = window.matchMedia('(max-width:720px)');
  function update(){
    var closest = null;
    var closestDist = Infinity;
    if(mobileNav.matches){
      var center = window.scrollY + (window.innerHeight / 2);
      sections.forEach(function(id){
        var el = document.getElementById(id);
        if(!el) return;
        var mid = el.offsetTop + el.offsetHeight / 2;
        var d = Math.abs(mid - center);
        if(d < closestDist){ closestDist = d; closest = id; }
      });
    } else {
      var center = scroller.scrollLeft + (scroller.clientWidth / 2);
      sections.forEach(function(id){
        var el = document.getElementById(id);
        if(!el) return;
        var mid = el.offsetLeft + el.clientWidth / 2;
        var d = Math.abs(mid - center);
        if(d < closestDist){ closestDist = d; closest = id; }
      });
    }
    navLinks.forEach(function(a){
      var href = a.getAttribute('href').slice(1);
      if(href === closest){ a.classList.add('active'); }
      else { a.classList.remove('active'); }
    });
  }

  var ticking2 = false;
  function onScrollNav(){ if(!ticking2){ requestAnimationFrame(function(){ update(); ticking2 = false; }); ticking2 = true; } }
  scroller.addEventListener('scroll', onScrollNav);
  window.addEventListener('scroll', onScrollNav, {passive:true});
  update();
})();

// Translate vertical scroll/wheel into horizontal scrolling
(function verticalToHorizontal(){
  const scroller = document.getElementById('scroller');
  if(!scroller) return;
  var mobileQ = window.matchMedia('(max-width:720px)');
  document.addEventListener('wheel', function(e){
    if(mobileQ.matches) return;
    e.preventDefault();
    scroller.scrollBy({left: e.deltaY || e.deltaX, behavior: 'auto'});
  }, {passive: false});
})();

// Ensure scroller snaps to panels after wheel/scroll end
(function snapOnWheelEnd(){
  const scroller = document.getElementById('scroller');
  if(!scroller) return;
  let timeout;
  function snapToNearest(){
    if(window.matchMedia('(max-width:720px)').matches) return;
    const panels = Array.from(scroller.querySelectorAll('.panel'));
    const center = scroller.scrollLeft + (scroller.clientWidth/2);
    let nearest = panels[0]; let dist = Infinity;
    panels.forEach(p=>{
      const c = p.offsetLeft + p.clientWidth/2;
      const d = Math.abs(c-center);
      if(d<dist){dist=d;nearest=p}
    });
    scroller.scrollTo({left: nearest.offsetLeft, behavior:'smooth'});
  }
  var mobileSnap = window.matchMedia('(max-width:720px)');
  ['wheel','touchend','pointerup'].forEach(ev=>{
    scroller.addEventListener(ev, ()=>{
      if(mobileSnap.matches) return;
      clearTimeout(timeout);
      timeout = setTimeout(snapToNearest,120);
    });
  });
})();

