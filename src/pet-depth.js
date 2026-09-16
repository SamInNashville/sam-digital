// A deliberately expressive 2.5D SVG character; controls remain pointer-transparent.
export const PET_PERSPECTIVE=640;
export const depthScale=(z=0)=>PET_PERSPECTIVE/(PET_PERSPECTIVE-z);
export const flightTransform=({x,y,z=0})=>`translate3d(${x}px,${y}px,0) perspective(${PET_PERSPECTIVE}px) translateZ(${z}px)`;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function addFlightDepth(journey,{width,height=1000,trip=0,distance=0,quiet=false}={}){
 const near=trip%2===1,reach=quiet||distance<=0?0:1;
 const amplitude=(near?(width<680?320:400):(width<680?-400:-560))*reach;
 const maxScale=Math.max(1,Math.min(2.8,1+(width/2-51)/53,1+(height/2-61)/60));
 const points=journey.points.map((p,i)=>{
  if(i===0||i===journey.points.length-1)return {...p,z:0};
  let z=amplitude*Math.sin(Math.PI*p.offset)**2;
  z=Math.min(z,PET_PERSPECTIVE*(1-1/maxScale));
  const scale=depthScale(z),extra=Math.max(0,scale-1),hx=41+53*extra,hy=49+60*extra;
  // Move large close-ups inward instead of letting the projected body clip offscreen.
  return {...p,x:clamp(p.x+41,hx+10,width-hx-10)-41,y:clamp(p.y+49,hy+12,height-hy-12)-49,z};
 });
 return {...journey,points,depthKind:amplitude?(near?'near':'far'):'rest'};
}
export function planPetFlyby(from,{width,height,trip=0}={}){
 const direction=trip%2?1:-1;
 const points=Array.from({length:97},(_,i)=>{const t=i/96,w=Math.sin(Math.PI*t)**2;return {
  x:from.x+(width*.5-41-from.x)*w+Math.sin(2*Math.PI*t)*width*.24*w*direction,
  y:from.y+(height*.32-49-from.y)*w-Math.sin(2*Math.PI*t)*height*.10*w,
  offset:t};});
 points[0]={...from,offset:0};points[96]={...from,offset:1};
 return addFlightDepth({kind:'flyby',duration:3000,points},{width,height,trip:1,distance:500});
}
