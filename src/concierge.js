import {createLocalAssistant} from './local-assistant.js';
const $=s=>document.querySelector(s), input=$('#prompt'), send=$('#send'), transcript=$('#transcript');
const atmosphere=document.createElement('div');atmosphere.id='atmosphere';atmosphere.dataset.state='idle';atmosphere.setAttribute('aria-hidden','true');atmosphere.innerHTML='<canvas aria-hidden="true"></canvas>';document.body.prepend(atmosphere);
const motion=document.createElement('button');motion.id='motion';motion.type='button';motion.textContent='Pause background';motion.hidden=true;document.body.append(motion);
let status={phase:'preparing'},current=null,version=0,history=[];
const followups=$('#follow-ups');
function detail(){return status.phase==='ready'?'Reviewing the details you shared.':status.phase==='failed'?'Local AI could not start. You can still email us.':'The local model is still loading. Your request is queued on this device.';}
function state(next){status=next;document.body.dataset.model=next.phase;$('#state-label').textContent=next.phase==='preparing'?'Preparing local AI…':next.phase==='failed'?'Local AI unavailable — your enquiry can still be emailed.':next.detail;$('#state-label').title=next.detail;$('#retry').hidden=next.phase!=='failed';const progress=$('#model-progress');progress.hidden=next.phase!=='preparing';if(Number.isFinite(next.progress))progress.value=Math.max(0,Math.min(1,next.progress));else progress.removeAttribute('value');if(current?.hint)current.hint.textContent=detail();}
const assistant=createLocalAssistant(state);
// Model startup is not chained to the intro, a user click, or the background renderer.
assistant.start().catch(()=>{});
import('./atmosphere.js').then(m=>m.startAtmosphere(atmosphere,motion)).catch(()=>{atmosphere.dataset.renderer='fallback';});
function buttonState(busy){send.type=busy?'button':'submit';send.dataset.stop=String(busy);send.setAttribute('aria-label',busy?'Stop response':'Send request');send.textContent=busy?'■':'↑';$('#fresh').disabled=busy;document.querySelectorAll('[data-prompt]').forEach(b=>b.disabled=busy);}
function suggested(){
 followups.replaceChildren();followups.hidden=false;
 const latest=history.filter(m=>m.role==='user').slice(-2).map(m=>m.content).join(' ').toLowerCase();
 let options=[['Software development','I need help with a software project.'],['Automation','I need help automating a task.'],['Research','I need a research or analysis project.'],['Documentation','I need technical writing or documentation.']];
 if(/automat|workflow|repetitive/.test(latest))options=[['Spreadsheets & reports','My repetitive task involves spreadsheets and reports.'],['Connecting tools','I need to move information between tools.'],['Files & documents','My repetitive task involves files and documents.']];
 else if(/app|software|website/.test(latest))options=[['A new application','I want to build a new application.'],['Improve existing software','I need to improve software I already use.'],['A script or integration','I need a script or an integration between systems.']];
 if(history.filter(m=>m.role==='user').length>2)options=[['What details should I send?','What details should I include in my job enquiry?'],['Help me define the scope','Help me narrow this down to a clear first deliverable.']];
 const question=history.filter(m=>m.role==='assistant').at(-1)?.content.toLowerCase()||'';
 if(/which.*(?:email|spreadsheet).*tools|email and spreadsheet tools/.test(question))options=[['Gmail + Google Sheets','I use Gmail and Google Sheets.'],['Outlook + Excel','I use Outlook and Excel.'],['Another combination','I use a different combination of tools. What do you need to know about them?']];
 else if(/how (many|often)|what.*volume/.test(question))options=[['A few each day','There are only a few each day.'],['Dozens each day','There are dozens each day.'],['Hundreds each day','There are hundreds each day.']];
 else if(/what.*(?:deadline|timeline)|when.*(?:need|ready)/.test(question))options=[['As soon as practical','I would like it as soon as practical, but need your assessment first.'],['Within a month','Ideally within a month.'],['Just exploring','I am exploring options and have no firm deadline yet.']];
 for(const [label,prompt] of options){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.prompt=prompt;followups.append(b);}
 const review=document.createElement('button');review.type='button';review.textContent='Review my enquiry ↗';review.addEventListener('click',openBrief);followups.append(review);
}
function recentMessages(){let messages=history.slice(-8);while(messages.length>2&&messages.reduce((n,m)=>n+m.content.length,0)>7000)messages=messages.slice(2);if(messages[0]?.role!=='user')messages=messages.slice(1);return messages;}
async function submit(text){
 text=text.trim().slice(0,1200);if(!text||current)return;
 const id=++version;history.push({role:'user',content:text});input.value='';input.placeholder='';document.body.classList.add('has-conversation');$('#fresh').hidden=false;followups.hidden=true;
 const user=document.createElement('div');user.className='turn user';user.textContent=text;transcript.append(user);
 const answer=document.createElement('div');answer.className='turn assistant';answer.innerHTML='<span class="speaker">SAM DIGITAL · AI GUIDE</span><div class="researching" role="status"><span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Researching your request</span></div><small class="loading-detail"></small><div class="answer-text" aria-live="polite"></div>';transcript.append(answer);
 const output=answer.querySelector('.answer-text'),pending=answer.querySelector('.researching'),hint=answer.querySelector('.loading-detail');hint.textContent=detail();current={id,answer,pending,hint,output,text:'',cancelled:false,streaming:false};const task=current;
 atmosphere.dataset.state='researching';buttonState(true);answer.scrollIntoView({block:'nearest',behavior:'instant'});
 try{
  await assistant.start();if(task.id!==version)return;task.streaming=true;
  await assistant.reply(recentMessages(),delta=>{if(task.cancelled||task.id!==version)return;pending.hidden=true;hint.hidden=true;task.text+=delta;output.textContent=task.text;});
  if(!task.cancelled&&task.text)history.push({role:'assistant',content:task.text});
  if(!task.cancelled&&!task.text)throw Error('The local model returned no text. Please try again.');
 }catch(error){if(!task.cancelled&&task.id===version){pending.hidden=true;hint.hidden=true;output.textContent=task.text||'I couldn’t prepare a reply on this device. You can still review your enquiry and email the builder directly.';output.classList.add('error');output.title=error.message;}}
 finally{if(task.id===version){pending.hidden=true;hint.hidden=true;if(task.cancelled){output.textContent=task.text?task.text+'\n\nResponse stopped.':'Response stopped. Your request is still included in your enquiry.';}current=null;atmosphere.dataset.state='engaged';buttonState(false);suggested();}}
}
$('#composer').addEventListener('submit',event=>{event.preventDefault();submit(input.value);});
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submit(input.value);}});
send.addEventListener('click',()=>{if(!current)return;current.cancelled=true;assistant.stop();if(!current.streaming){version++;current.pending.hidden=true;current.hint.hidden=true;current.output.textContent='Response stopped. Your request is still included in your enquiry.';current=null;atmosphere.dataset.state='engaged';buttonState(false);suggested();}});
document.addEventListener('click',event=>{const b=event.target.closest('[data-prompt]');if(b&&!b.disabled)submit(b.dataset.prompt);});
$('#retry').addEventListener('click',()=>{if(!current)assistant.retry().catch(()=>{});});
$('#fresh').addEventListener('click',()=>{if(current)return;history=[];transcript.replaceChildren();followups.hidden=true;document.body.classList.remove('has-conversation');$('#fresh').hidden=true;atmosphere.dataset.state='idle';assistant.reset().catch(()=>{});input.focus();});
function updateEmail(){const body=$('#brief').value;$('#email').href='mailto:sam-in-nashville@pm.me?subject='+encodeURIComponent('Project enquiry — Sam Digital')+'&body='+encodeURIComponent(body);}
function openBrief(){const asks=history.filter(m=>m.role==='user').map(m=>m.content);if(input.value.trim())asks.push(input.value.trim());$('#brief').value='Hi Sam Digital,\n\n'+(asks.length?asks.join('\n\n'):'I’d like to discuss a project.\n\nWhat I want to achieve:\n\nWhat I currently use:\n\nTiming or constraints:')+'\n\nPlease let me know the next step.\n';updateEmail();$('#copy-status').textContent='';$('#brief-dialog').showModal();}
$('#review').addEventListener('click',openBrief);$('#brief').addEventListener('input',updateEmail);$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#brief').value);$('#copy-status').textContent='Enquiry copied.';}catch{$('#copy-status').textContent='Select and copy the enquiry text above.';}});
addEventListener('pagehide',()=>assistant.dispose());
