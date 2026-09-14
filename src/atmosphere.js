import {init,surface,effect,frame,draw as createDraw} from 'vgpu';
import source from './atmosphere.wgsl?raw';
import atomSource from './thought-atoms.wgsl?raw';
export async function startAtmosphere(host,control){
 if(!navigator.gpu||navigator.connection?.saveData)return;
 let gpu,output,shader,raf=0,time=0,previous=0,activity=0,failed=false,typingUntil=0,burstAt=-1e9;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduce.matches;
 const fail=(e)=>{if(failed)return;failed=true;cancelAnimationFrame(raf);host.dataset.renderer='fallback';host.dataset.error=String(e?.message||'GPU unavailable');control.hidden=true;gpu?.dispose();};
 try{
  gpu=await init({powerPreference:'low-power'});gpu.onError(fail);gpu.gpu.lost.then(fail);
  output=surface(gpu,host.querySelector('canvas'),{size:[960,540],autoResize:false,dpr:1});
  shader=effect(gpu,source,{set:{params:{resolution:output.size,time:0,activity:0}}});
  await shader.compile({colors:[navigator.gpu.getPreferredCanvasFormat()]});
  const atoms=createDraw(gpu,{shader:atomSource,vertices:6,instances:100000,blend:'additive',cull:'none',set:{params:{resolution:output.size,time:0,age:10,strength:0}}});
  await atoms.compile({colors:[navigator.gpu.getPreferredCanvasFormat()]});
  host.dataset.atomCount='100000';
  const resize=()=>{const scale=Math.min(1,960/innerWidth,960/innerHeight);output.resize([Math.max(1,Math.round(innerWidth*scale)),Math.max(1,Math.round(innerHeight*scale))]);};
  const draw=()=>{shader.set({params:{resolution:output.size,time,activity}});const age=(performance.now()-burstAt)/1000;atoms.set({params:{resolution:output.size,time,age,strength:activity}});host.dataset.burstAge=age.toFixed(3);frame(gpu,f=>f.pass(output,p=>{p.draw(shader);if(activity>.001&&age<6)p.draw(atoms);}));host.dataset.frames=String(Number(host.dataset.frames||0)+1);};
  const tick=(now)=>{raf=0;if(failed||paused||document.hidden)return;const responding=host.dataset.state==='researching';const typing=now<typingUntil;host.dataset.thinking=responding?'responding':typing?'typing':'idle';const interval=responding||typing?50:83.333;if(!previous||now-previous>=interval){const dt=previous?Math.min((now-previous)/1000,.2):1/12;previous=now;time+=dt;const age=(now-burstAt)/1000;const goal=age<6?(responding?1:typing?.7:.5):0;activity+=(goal-activity)*(1-Math.exp(-dt*8));host.dataset.activity=activity.toFixed(4);draw();}raf=requestAnimationFrame(tick);};
  const sync=()=>{cancelAnimationFrame(raf);previous=0;control.textContent=paused?'Resume background':'Pause background';control.setAttribute('aria-pressed',String(paused));if(failed||document.hidden)return;if(paused){activity=0;host.dataset.activity='0';draw();}else raf=requestAnimationFrame(tick);};
  document.querySelector('#prompt')?.addEventListener('input',()=>{const now=performance.now();if(now>typingUntil)burstAt=now;typingUntil=now+1200;});
  resize();draw();await gpu.settled();await gpu.gpu.queue.onSubmittedWorkDone();if(failed)return;host.dataset.renderer='webgpu';control.hidden=false;
  control.addEventListener('click',()=>{paused=!paused;sync();});reduce.addEventListener('change',()=>{paused=reduce.matches;sync();});document.addEventListener('visibilitychange',sync);addEventListener('resize',()=>{resize();if(paused)draw();},{passive:true});addEventListener('pagehide',()=>cancelAnimationFrame(raf));addEventListener('pageshow',sync);new MutationObserver(()=>{if(host.dataset.state==='researching')burstAt=performance.now();if(host.dataset.state!=='idle')typingUntil=0;if(paused&&!failed)sync();}).observe(host,{attributes:true,attributeFilter:['data-state']});sync();
 }catch(error){fail(error);}
}
