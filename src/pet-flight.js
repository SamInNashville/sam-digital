import { addFlightDepth } from './pet-depth.js';
// Continuous, time-sampled parabolic flights with a gentle elastic settle.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function planPetFlight(from,to,{width,height,trip=0}={}){
 const bounds={left:10,right:Math.max(10,width-92),top:12,bottom:Math.max(12,height-110)};
 const bound=p=>({x:clamp(p.x,bounds.left,bounds.right),y:clamp(p.y,bounds.top,bounds.bottom)});
 const start=bound(from),end=bound(to),dx=end.x-start.x,dy=end.y-start.y,distance=Math.hypot(dx,dy);
 if(distance<12)return addFlightDepth({kind:'settle',points:[{...start,offset:0},{...end,offset:1}],duration:600},{width,trip,distance:0});
 const nx=-dy/distance,ny=dx/distance;
 let bend=Math.min(76,distance*.2)*(trip%2?1:-1),spring=.9,points;
 for(let attempt=0;attempt<10;attempt++){
  if(attempt===9){bend=0;spring=0;}
  points=Array.from({length:97},(_,i)=>{
   const t=i/96,u=(1-Math.cos(Math.PI*t))/2;
   const progress=1+(spring+1)*(u-1)**3+spring*(u-1)**2;
   const arc=4*bend*progress*(1-progress);
   return {x:start.x+dx*progress+nx*arc,y:start.y+dy*progress+ny*arc,offset:t};
  });
  if(points.every(p=>p.x>=bounds.left-1e-6&&p.x<=bounds.right+1e-6&&p.y>=bounds.top-1e-6&&p.y<=bounds.bottom+1e-6))break;
  // Reduce the arc and rebound rather than clipping individual samples into corners.
  bend*=.65;spring*=.5;
 }
 points[0]={...start,offset:0};points[96]={...end,offset:1};
 return addFlightDepth({kind:'parabola',points,duration:Math.min(4200,2300+distance*1.5)},{width,trip,distance});
}
