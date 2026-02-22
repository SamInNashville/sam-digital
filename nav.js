/**
 * nav.js — Navigation: anchor links, active tracking, keyboard nav
 * Zero dependencies. No DOM beyond nav + scroller.
 * Load order: 1st (defer)
 */
(function(){
  var isMobile = window.matchMedia('(max-width:720px)');
  var scroller = document.getElementById('scroller');
  var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  var sectionIds = ['home','services','process','about','contact'];

  // --- Anchor link clicks ---
  navLinks.forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if(!el) return;
      e.preventDefault();
      if(isMobile.matches){
        el.scrollIntoView({behavior:'smooth',block:'start'});
      } else if(scroller){
        scroller.scrollTo({left: el.offsetLeft, behavior:'smooth'});
      }
    });
  });

  // --- Active nav highlight ---
  function updateActive(){
    var closest = null;
    var closestDist = Infinity;
    for(var i=0; i<sectionIds.length; i++){
      var el = document.getElementById(sectionIds[i]);
      if(!el) continue;
      var mid, center;
      if(isMobile.matches){
        center = window.scrollY + (window.innerHeight / 2);
        mid = el.offsetTop + el.offsetHeight / 2;
      } else {
        center = (scroller ? scroller.scrollLeft : 0) + (window.innerWidth / 2);
        mid = el.offsetLeft + el.clientWidth / 2;
      }
      var d = Math.abs(mid - center);
      if(d < closestDist){ closestDist = d; closest = sectionIds[i]; }
    }
    navLinks.forEach(function(a){
      var href = a.getAttribute('href').slice(1);
      if(href === closest) a.classList.add('active');
      else a.classList.remove('active');
    });
  }

  var ticking = false;
  function onScroll(){
    if(!ticking){ requestAnimationFrame(function(){ updateActive(); ticking=false; }); ticking=true; }
  }
  if(scroller) scroller.addEventListener('scroll', onScroll);
  window.addEventListener('scroll', onScroll, {passive:true});
  updateActive();

  // --- Keyboard nav (desktop) ---
  if(scroller){
    scroller.addEventListener('keydown', function(e){
      if(isMobile.matches) return;
      if(e.key==='ArrowRight'){ e.preventDefault(); scroller.scrollBy({left:scroller.clientWidth,behavior:'smooth'}); }
      if(e.key==='ArrowLeft'){ e.preventDefault(); scroller.scrollBy({left:-scroller.clientWidth,behavior:'smooth'}); }
      if(e.key==='Home'){ e.preventDefault(); scroller.scrollTo({left:0,behavior:'smooth'}); }
      if(e.key==='End'){ e.preventDefault(); scroller.scrollTo({left:scroller.scrollWidth,behavior:'smooth'}); }
    });
  }
})();
