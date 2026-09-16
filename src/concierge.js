import {startCompanion,startMotion} from './companion.js';
import {createLocalAssistant} from './local-assistant.js';
import {starterAnswer} from './starter-answers.js';
import {interpret,storyText,wantsPerson,EMAIL,PERSON} from './story-policy.js';
const $=s=>document.querySelector(s),input=$('#prompt'),send=$('#send'),transcript=$('#transcript'),followups=$('#follow-ups');
const atmosphere=document.createElement('div');atmosphere.id='atmosphere';atmosphere.dataset.state='idle';atmosphere.setAttribute('aria-hidden','true');atmosphere.innerHTML='<canvas aria-hidden="true"></canvas>';document.body.prepend(atmosphere);
const motion=document.createElement('button');motion.id='motion';motion.type='button';motion.textContent='Pause background';motion.hidden=true;document.body.append(motion);
// A fresh page is a fresh conversation. Remove records left by the previous version.
try{sessionStorage.removeItem('sam-digital-story-v1');}catch{}
const record={id:crypto.randomUUID(),archive:[],history:[],topic:1,notes:'',draft:'',assessment:{}};
let status={phase:'preparing'},current=null,version=0;
function persist(){record.draft=input.value;}
function add(role,content){const m={role,content,at:new Date().toISOString(),topic:record.topic};record.history.push(m);record.archive.push(m);persist();return m;}
function render(role,text){const box=document.createElement('div');box.className='turn '+role;if(role==='assistant'){const name=document.createElement('span');name.className='speaker';name.textContent='SAM · BROWSER AI';box.append(name);const answer=document.createElement('div');answer.className='answer-text';answer.textContent=text;box.append(answer);}else box.textContent=text;transcript.append(box);return box;}
function detail(){return status.phase==='ready'?'Reviewing the details you shared.':'Getting ready. Your message is waiting here.';}
function state(next){status=next;document.body.dataset.model=next.phase;$('#state-label').textContent=next.phase==='preparing'?'Getting ready…':next.phase==='failed'?'The guide is unavailable. You can still send your request.':'Ready when you are.';$('#state-label').removeAttribute('title');$('#retry').hidden=next.phase!=='failed';const p=$('#model-progress');p.hidden=next.phase!=='preparing';if(Number.isFinite(next.progress))p.value=Math.max(0,Math.min(1,next.progress));else p.removeAttribute('value');if(current)current.hint.textContent=detail();}
startMotion(motion);startCompanion(atmosphere);
const assistant=createLocalAssistant(state);assistant.start().catch(()=>{});
import('./neural.js').then(m=>m.startNeural(atmosphere)).catch(()=>{});
import('./showcase.js').then(m=>m.mountShowcase(document.querySelector('#showcase'))).catch(()=>{});
import('./atmosphere.js').then(m=>m.startAtmosphere(atmosphere,motion)).catch(()=>{atmosphere.dataset.renderer='fallback';});
function buttonState(busy){send.type=busy?'button':'submit';send.dataset.stop=String(busy);send.setAttribute('aria-label',busy?'Stop response':'Send message');send.textContent=busy?'■':'↑';$('#fresh').disabled=busy;document.querySelectorAll('[data-prompt]').forEach(b=>b.disabled=busy);}
function suggested(){followups.replaceChildren();followups.hidden=false;const review=document.createElement('button');review.type='button';review.textContent='Send Request ↗';review.className='primary';review.addEventListener('click',openBrief);followups.append(review);const more=document.createElement('button');more.type='button';more.textContent='Add more detail';more.addEventListener('click',()=>{input.focus();input.scrollIntoView({block:'center',behavior:'smooth'});});followups.append(more);document.body.dataset.handoff=record.assessment.reason||'exploring';}
function recentMessages(){
 // Only inference context is bounded; the original story never is.
 const pinned=Object.values(record.assessment.evidence||{}).map(e=>record.history[e.turn]).filter(Boolean);
 const source=[...new Set([...pinned,...record.history.slice(-8)])];
 return source.map(m=>({role:m.role,content:m.content.slice(0,1000)})).slice(-8);
}
async function submit(text){
 if(!text.trim()||current)return;const id=++version;input.value='';input.placeholder='';add('user',text);document.body.classList.add('has-conversation');$('#fresh').hidden=false;followups.hidden=true;render('user',text);
 const box=render('assistant',''),output=box.querySelector('.answer-text');const pending=document.createElement('div');pending.className='researching';pending.setAttribute('role','status');pending.textContent='Researching your request';const hint=document.createElement('small');hint.className='loading-detail';hint.textContent=detail();box.insertBefore(pending,output);box.insertBefore(hint,output);
 const task={id,output,pending,hint,raw:'',cancelled:false};current=task;atmosphere.dataset.state='researching';buttonState(true);box.scrollIntoView({block:'nearest',behavior:'instant'});
 try{
  const approved=starterAnswer(text);
  if(approved)record.assessment={reply:approved,reason:'',evidence:record.assessment.evidence||{},question:approved.match(/[^.!?\n]*\?/g)?.join(' ').trim()||''};
  else if(wantsPerson(text))record.assessment={reply:PERSON,reason:'person',evidence:record.assessment.evidence||{},question:''};
  else{
   await assistant.start();if(task.id!==version)return;
   await assistant.reply(recentMessages(),delta=>{if(!task.cancelled&&task.id===version)task.raw+=delta;});
   if(task.id!==version)return;
   record.assessment=interpret(task.raw,record.history,record.assessment);
  }
  if(task.id!==version)return;
  output.textContent=record.assessment.reply;add('assistant',output.textContent);
 }catch(error){if(task.id===version){record.assessment={reply:EMAIL,reason:'uncertain',evidence:{},question:''};output.textContent=EMAIL;add('assistant',EMAIL);output.title=error.message;}}
 finally{if(task.id===version){pending.hidden=true;hint.hidden=true;current=null;atmosphere.dataset.state='engaged';buttonState(false);suggested();persist();}}
}
$('#composer').addEventListener('submit',e=>{e.preventDefault();submit(input.value);});
input.addEventListener('input',()=>{persist();updateEmail();});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit(input.value);}});
send.addEventListener('click',()=>{if(!current)return;const task=current;task.cancelled=true;version++;assistant.stop();task.pending.hidden=true;task.hint.hidden=true;task.output.textContent='Response stopped. Your story is still here. You can add more detail or send it to a human.';add('assistant',task.output.textContent);current=null;atmosphere.dataset.state='engaged';buttonState(false);suggested();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-prompt]');if(b&&!b.disabled){e.preventDefault();submit(b.dataset.prompt);}});
$('#retry').addEventListener('click',()=>{if(!current)assistant.retry().catch(()=>{});});
$('#fresh').addEventListener('click',()=>{if(current)return;if(input.value.trim())add('user',input.value);input.value='';record.history=[];record.assessment={};record.topic++;transcript.replaceChildren();followups.hidden=true;document.body.classList.remove('has-conversation');$('#fresh').hidden=true;atmosphere.dataset.state='idle';assistant.reset().catch(()=>{});persist();input.focus();});
function emailBody(){return storyText(record,input.value);}
function updateEmail(){const body=emailBody();for(const a of document.querySelectorAll('a[href^="mailto:"]'))a.href='mailto:sam-in-nashville@pm.me?subject='+encodeURIComponent('Project / quote request — '+record.id)+'&body='+encodeURIComponent(body);const preview=$('#story-record');if(preview)preview.textContent=body;$('#email-warning').textContent=body.length>1800?'Long conversation: some email apps may shorten drafts. Copy the full request or download it and paste it into your email. Check before sending.':'Opening your email app does not send the request.';return body;}
function openBrief(){record.notes=$('#brief').value||record.notes;$('#brief').value=record.notes;updateEmail();$('#copy-status').textContent='';$('#brief-dialog').showModal();}
$('#review').addEventListener('click',openBrief);$('#brief').addEventListener('input',()=>{record.notes=$('#brief').value;persist();updateEmail();});
for(const a of document.querySelectorAll('a[href^="mailto:"]'))a.addEventListener('click',e=>{if(a.id!=='email'){e.preventDefault();openBrief();}else updateEmail();});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(updateEmail());$('#copy-status').textContent='Full request copied.';}catch{$('#copy-status').textContent='Copy the complete conversation below, or download it.';}});
$('#download-story').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([updateEmail()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='sam-digital-story-'+record.id+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
for(const m of record.history)render(m.role,m.content);input.value=record.draft||'';$('#brief').value=record.notes||'';if(record.history.length){document.body.classList.add('has-conversation');$('#fresh').hidden=false;suggested();}persist();updateEmail();
addEventListener('pagehide',()=>{persist();assistant.dispose();});
