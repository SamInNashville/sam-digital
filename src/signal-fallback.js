// Animated, interactive non-WebGPU path. The SVG is only the no-JS fallback.
export function createFallbackRenderer(host) {
 const canvas=document.createElement('canvas');canvas.className='signal-canvas2d';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
 const ctx=canvas.getContext('2d');
 let edge=0;
 const resize=()=>{const size=Math.min(640,Math.round(host.clientWidth*Math.min(devicePixelRatio,1.25)));if(size!==edge){edge=size;canvas.width=size;canvas.height=size;}};
 resize();
 const rotate=(x,y,a)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
 const geometry=(a,b,p)=>{
  const t=p.time;
  const r=.80+.17*Math.sin(a*3+t*.5)*(.55+.45*Math.sin(t*.4))+.065*Math.sin(a*2-t*.38);
  const h=.18*Math.sin(a*2+t*.5)+.10*Math.cos(a*3-t*.35);
  const thick=.25+.045*Math.sin(a*3-t*.75);
  const cross=rotate(Math.cos(b)*thick,Math.sin(b)*(.65+.15*Math.cos(a*2+t*.4))*thick,a+Math.sin(t*.35));
  let x=(r+cross[0])*Math.cos(a),y=(r+cross[0])*Math.sin(a),z=h+cross[1];
  [y,z]=rotate(y,z,-.75-Math.sin(t*.3)*.28+p.pointer[1]*.5+p.rotation[1]);
  [x,z]=rotate(x,z,p.rotation[0]+t*.22);
  [x,y]=rotate(x,y,.35+Math.sin(t*.19)*.3-p.pointer[0]*.42);
  const dx=p.pointer[0]*1.35-x,dy=p.pointer[1]*1.35-y,d=Math.hypot(dx,dy),influence=Math.exp(-d*d*1.2)*p.presence;
  x+=dx*.30*influence;y+=dy*.30*influence;z+=.18*influence;
  const ripple=Math.sin(d*13-t*6)*Math.exp(-d*.7)*(p.energy*.045+p.pulse*.1);
  const n=Math.hypot(x,y,z+.1);x+=x/n*ripple;y+=y/n*ripple;z+=(z+.1)/n*ripple;
  return {x:edge*(.5+x*1.325/(4.4-z)),y:edge*(.5-y*1.325/(4.4-z)),z};
 };
 return {resize,render(p){
  if(!ctx)return;
  ctx.clearRect(0,0,edge,edge);
  const glow=ctx.createRadialGradient(edge*.5,edge*.5,0,edge*.5,edge*.5,edge*.48);glow.addColorStop(0,'#9c5c2528');glow.addColorStop(1,'#14161300');ctx.fillStyle=glow;ctx.fillRect(0,0,edge,edge);
  const rings=[];
  for(let i=0;i<80;i++){const points=[];for(let j=0;j<=32;j++)points.push(geometry(i*Math.PI*2/80,j*Math.PI*2/32,p));rings.push({points,z:points.reduce((s,v)=>s+v.z,0)/points.length});}
  rings.sort((a,b)=>a.z-b.z);
  for(const ring of rings){const light=Math.max(0,Math.min(1,(ring.z+1.2)/2.4));ctx.strokeStyle=`rgba(${Math.round(170+80*light)},${Math.round(92+100*light)},${Math.round(40+86*light)},${.2+light*.72})`;ctx.lineWidth=(.5+light*.8)*edge/640;ctx.beginPath();ring.points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.stroke();}
  for(let i=0;i<100;i++){const a=i*2.39996+p.time*(.35+(i%13)*.03),r=(.29+.06*Math.sin(i*7.1));const x=edge*(.5+Math.cos(a)*r),y=edge*(.5+Math.sin(a)*r*.62);ctx.fillStyle=`rgba(230,174,98,${.18+(i%7)*.065})`;ctx.beginPath();ctx.arc(x,y,edge*(.0008+(i%5)*.00035)*(1+p.energy*.5),0,Math.PI*2);ctx.fill();}
  if(p.pulse>.015){ctx.strokeStyle=`rgba(227,168,90,${p.pulse*.6})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(edge*(.5+p.pointer[0]*.2),edge*(.5-p.pointer[1]*.2),edge*(.06+(1-p.pulse)*.52),0,Math.PI*2);ctx.stroke();}
 }};
}
