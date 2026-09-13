// Native scrolling, with independent depth planes. No scroll hijacking.
export function startParallax() {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const root=document.documentElement;
 const nodes=[...document.querySelectorAll('[data-parallax]')];
 let pending=0, enabled=!reduce.matches, pointer=[0,0];
 function update(){
  pending=0;
  root.style.setProperty('--scroll-depth',enabled?`${scrollY*.12}px`:'0px');
  root.style.setProperty('--scroll-progress',String(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
  root.dataset.motion=enabled?'running':'paused';
  root.style.setProperty('--cursor-x',enabled?`${pointer[0]}px`:'0px');
  root.style.setProperty('--cursor-y',enabled?`${pointer[1]}px`:'0px');
  for(const node of nodes){
   const rect=node.getBoundingClientRect();
   const prior=Number(node.dataset.offset||0);
   const naturalTop=rect.top-prior;
   const speed=Number(node.dataset.parallax);
   const max=Number(node.dataset.parallaxLimit||100);
   const offset=enabled?Math.max(-max,Math.min(max,(innerHeight*.5-naturalTop-rect.height*.5)*speed)):0;
   node.style.setProperty('--parallax-y',`${offset.toFixed(2)}px`);
   node.dataset.offset=String(offset);
  }
 }
 const request=()=>{if(!pending)pending=requestAnimationFrame(update);};
 addEventListener('scroll',request,{passive:true});
 addEventListener('resize',request,{passive:true});
 document.addEventListener('pointermove',event=>{if(!enabled||event.pointerType==='touch')return;pointer=[(event.clientX/innerWidth-.5)*22,(event.clientY/innerHeight-.5)*16];request();},{passive:true});
 document.addEventListener('pointerleave',()=>{pointer=[0,0];request();});
 reduce.addEventListener('change',()=>{enabled=!reduce.matches;request();});
 document.addEventListener('site-motion',event=>{enabled=!event.detail.paused;request();});
 document.fonts?.ready.then(request);
 update();
}
