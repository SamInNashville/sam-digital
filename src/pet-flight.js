// Short, bounded flight choreography. Destinations still come from page content.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function planPetFlight(from,to,{width,height,trip=0}={}){
 const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy),ux=distance?dx/distance:1,uy=distance?dy/distance:0;
 const bound=p=>({x:clamp(p.x,10,Math.max(10,width-92)),y:clamp(p.y,12,Math.max(12,height-110))});
 const start=bound(from),end=bound(to);if(distance<12)return {kind:'settle',points:[{...start,offset:0},{...end,offset:1}],duration:450};
 const bend=Math.min(70,distance*.23)*(trip%2?1:-1),nx=-uy,ny=ux;
 const center={x:(start.x+end.x)/2+nx*bend*.5,y:(start.y+end.y)/2+ny*bend*.5};
 const room=center.x>85&&center.x<width-175&&center.y>90&&center.y<height-190;
 const loop=distance>260&&trip%3===0&&room;const points=[{...start,offset:0}];
 // Cubic-bezier timing stays inside each segment; curved geometry is explicit.
 for(let i=1;i<=12;i++){
  const t=i/12,p={x:start.x+(end.x-start.x)*t+nx*Math.sin(Math.PI*t)*bend,y:start.y+(end.y-start.y)*t+ny*Math.sin(Math.PI*t)*bend};
  points.push({...bound(p),offset:t*.78});
  if(loop&&i===6){const radius=Math.min(30,distance*.07);for(let j=1;j<=12;j++){const angle=j/12*Math.PI*2;points.push({...bound({x:p.x+ux*Math.sin(angle)*radius+nx*(1-Math.cos(angle))*radius,y:p.y+uy*Math.sin(angle)*radius+ny*(1-Math.cos(angle))*radius}),offset:.39+j/12*.18});}}
 }
 if(loop){for(let i=0;i<points.length;i++){if(i>18)points[i].offset+=.18;}for(const p of points)p.offset*=.78/.96;}
 const overshoot=Math.min(24,distance*.09);
 points.push({...bound({x:end.x+ux*overshoot,y:end.y+uy*overshoot}),offset:.87});
 points.push({...bound({x:end.x-ux*4,y:end.y-uy*4}),offset:.95});
 points.push({...end,offset:1});
 return {kind:loop?'loop':'curve',points,duration:Math.min(3000,Math.max(1050,distance*2.5)+(loop?650:0))};
}
