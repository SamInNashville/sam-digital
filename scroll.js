/**
 * scroll.js — Desktop horizontal scroll: wheel capture + panel snapping
 * Only active on desktop (>720px). No-op on mobile.
 * Load order: 2nd (defer)
 */
(function(){
  var isMobile = window.matchMedia('(max-width:720px)');
  var scroller = document.getElementById('scroller');
  if(!scroller) return;

  // --- Capture vertical wheel → horizontal scroll (desktop only) ---
  document.addEventListener('wheel', function(e){
    if(isMobile.matches) return;
    e.preventDefault();
    scroller.scrollBy({left: e.deltaY || e.deltaX, behavior: 'auto'});
  }, {passive: false});

  // --- Snap to nearest panel after scroll ends ---
  var snapTimeout;
  function snapToNearest(){
    if(isMobile.matches) return;
    var panels = scroller.querySelectorAll('.panel');
    var center = scroller.scrollLeft + (scroller.clientWidth / 2);
    var nearest = panels[0];
    var dist = Infinity;
    for(var i=0; i<panels.length; i++){
      var c = panels[i].offsetLeft + panels[i].clientWidth / 2;
      var d = Math.abs(c - center);
      if(d < dist){ dist = d; nearest = panels[i]; }
    }
    if(nearest) scroller.scrollTo({left: nearest.offsetLeft, behavior:'smooth'});
  }

  ['wheel','touchend','pointerup'].forEach(function(ev){
    scroller.addEventListener(ev, function(){
      if(isMobile.matches) return;
      clearTimeout(snapTimeout);
      snapTimeout = setTimeout(snapToNearest, 120);
    });
  });
})();
