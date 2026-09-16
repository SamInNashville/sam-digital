import {roamPet} from './pet-roam.js';
import './experience.css';
// A decorative AI character. No chat text is read, stored or sent here.
export function startCompanion(host){
 document.querySelector('a[href="#privacy-details"]')?.addEventListener('click',()=>{document.querySelector('#privacy-details').open=true;});
 const stage=document.querySelector('#companion-stage'),pet=document.querySelector('#companion');
 if(!stage||!pet)return;
 const label=document.querySelector('#companion-label'),toggle=document.querySelector('#companion-toggle'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let hidden=false,paused=reduce.matches||document.documentElement.dataset.motionPaused==='true',typingTimer,replyTimer;
 const stopped=()=>hidden||paused||document.hidden;
 const setState=value=>{stage.dataset.mood=value;label.textContent=value==='thinking'?'Dot is thinking locally':value==='listening'?'Dot is listening':value==='reply'?'Dot has a reply':'Dot · your browser AI';};
 const sync=()=>{stage.dataset.still=String(stopped());pet.style.setProperty('--look-x','0px');pet.style.setProperty('--look-y','0px');};
 new MutationObserver(()=>{clearTimeout(replyTimer);if(host.dataset.state==='researching')setState('thinking');else if(host.dataset.state==='engaged'){setState('reply');replyTimer=setTimeout(()=>setState('idle'),2000);}else setState('idle');}).observe(host,{attributes:true,attributeFilter:['data-state']});
 document.querySelector('#prompt')?.addEventListener('input',()=>{if(host.dataset.state==='researching')return;clearTimeout(typingTimer);setState('listening');typingTimer=setTimeout(()=>setState('idle'),1200);});
 document.addEventListener('pointermove',e=>{if(stopped()||e.pointerType==='touch')return;const r=pet.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;pet.style.setProperty('--look-x',`${Math.max(-3,Math.min(3,(e.clientX-r.left-r.width/2)/80))}px`);pet.style.setProperty('--look-y',`${Math.max(-2,Math.min(2,(e.clientY-r.top-r.height/2)/100))}px`);},{passive:true});
 toggle.addEventListener('click',()=>{hidden=!hidden;pet.hidden=hidden;toggle.textContent=hidden?'Show companion':'Hide companion';toggle.setAttribute('aria-expanded',String(!hidden));sync();});
 window.addEventListener('sam-motion',e=>{paused=e.detail.paused;sync();});reduce.addEventListener('change',()=>{paused=reduce.matches||document.documentElement.dataset.motionPaused==='true';sync();});document.addEventListener('visibilitychange',sync);
 addEventListener('pagehide',()=>{clearTimeout(typingTimer);clearTimeout(replyTimer);stage.dataset.still='true';});addEventListener('pageshow',sync);setState('idle');sync();roamPet(stage,pet);
}
export function startMotion(control){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let userPaused=false;
 const sync=()=>{const forced=reduced.matches||!!navigator.connection?.saveData,paused=userPaused||forced;document.documentElement.dataset.motionPaused=String(paused);document.documentElement.dataset.motionSource=userPaused?'user':forced?'preference':'active';control.hidden=false;control.disabled=forced;control.textContent=forced?'Reduced motion':paused?'Resume background':'Pause background';control.setAttribute('aria-label',forced?'Reduced motion enabled':paused?'Resume motion':'Pause motion');control.setAttribute('aria-pressed',String(paused));control.title='Controls cloud, neural effects, companion and demo animation';window.dispatchEvent(new CustomEvent('sam-motion',{detail:{paused,decorativeOnly:forced&&!userPaused}}));};
 control.addEventListener('click',()=>{userPaused=!userPaused;sync();});reduced.addEventListener('change',sync);sync();
}
