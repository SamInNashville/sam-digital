import {init,surface,effect,frame} from 'vgpu';
import source from './atmosphere.wgsl?raw';
export async function startAtmosphere(host,control){
 if(!navigator.gpu||navigator.connection?.saveData)return;
 let gpu,output,shader,raf=0,time=0,previous=0,activity=0,failed=false;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduce.matches;
 const fail=(e)=>{if(failed)return;failed=true;cancelAnimationFrame(raf);host.dataset.renderer='fallback';host.dataset.error=String(e?.message||'GPU unavailable');control.hidden=true;gpu?.dispose();};
 try{
  gpu=await init({powerPreference:'low-power'});gpu.onError(fail);gpu.gpu.lost.then(fail);
  output=surface(gpu,host.querySelector('canvas'),{size:[560,320],autoResize:false,dpr:1});
  shader=effect(gpu,source,{set:{params:{resolution:output.size,time:0,activity:0}}});
  await shader.compile({colors:[navigator.gpu.getPreferredCanvasFormat()]});
  const resize=()=>{const scale=Math.min(1,560/innerWidth,560/innerHeight);output.resize([Math.max(1,Math.round(innerWidth*scale)),Math.max(1,Math.round(innerHeight*scale))]);};
  const draw=()=>{shader.set({params:{resolution:output.size,time,activity}});frame(gpu,f=>f.pass(output,shader));host.dataset.frames=String(Number(host.dataset.frames||0)+1);};
  const tick=(now)=>{raf=0;if(failed||paused||document.hidden)return;const interval=host.dataset.state==='researching'?125:83.333;if(!previous||now-previous>=interval){const dt=previous?Math.min((now-previous)/1000,.2):1/12;previous=now;time+=dt;const goal=host.dataset.state==='researching'?1:host.dataset.state==='engaged'?.3:0;activity+=(goal-activity)*(1-Math.exp(-dt*2.2));draw();}raf=requestAnimationFrame(tick);};
  const sync=()=>{cancelAnimationFrame(raf);previous=0;control.textContent=paused?'Resume background':'Pause background';control.setAttribute('aria-pressed',String(paused));if(failed||document.hidden)return;if(paused){activity=host.dataset.state==='idle'?0:.35;draw();}else raf=requestAnimationFrame(tick);};
  resize();draw();await gpu.settled();await gpu.gpu.queue.onSubmittedWorkDone();if(failed)return;host.dataset.renderer='webgpu';control.hidden=false;
  control.addEventListener('click',()=>{paused=!paused;sync();});reduce.addEventListener('change',()=>{paused=reduce.matches;sync();});document.addEventListener('visibilitychange',sync);addEventListener('resize',()=>{resize();if(paused)draw();},{passive:true});addEventListener('pagehide',()=>cancelAnimationFrame(raf));addEventListener('pageshow',sync);new MutationObserver(()=>{if(paused&&!failed)sync();}).observe(host,{attributes:true,attributeFilter:['data-state']});sync();
 }catch(error){fail(error);}
}
