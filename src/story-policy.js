export const STORY_SCHEMA={type:'object',additionalProperties:false,required:['reply','uncertain','evidence'],properties:{reply:{type:'string'},uncertain:{type:'boolean'},evidence:{type:'object',additionalProperties:false,required:['outcome','people','starting','better'],properties:Object.fromEntries(['outcome','people','starting','better'].map(k=>[k,{type:'string'}]))}}};
export const CRITERIA=['outcome','people','starting','better'];
export const EMAIL='I’m not sure I can answer that reliably here. Let’s send this conversation by email for a human response. Nothing has been sent yet.';
export const READY='I think I’ve gathered enough for a useful first conversation. Let’s send this to a human. You can review your request now, or keep adding details.';
export const STALLED='I don’t want to keep asking you the same things. Let’s take this to a human by email, with the conversation included.';
export const PERSON='Let’s send this to a human. Select Send Request to review the conversation and open your email draft. Nothing has been sent yet.';
export const wantsPerson=t=>/\b(human|real person)\b|stop asking|going in circles|already (told|said|answered)|(?:please |let.s |can (?:I|we) |I (?:want|would like) to )(?:send|email|submit)\b|(?:speak|talk).{0,20}(?:someone|person)/i.test(t);
const norm=t=>t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim();
export function sameQuestion(a,b){const x=new Set(norm(a).split(' ').filter(w=>w.length>2));const y=new Set(norm(b).split(' ').filter(w=>w.length>2));if(!x.size||!y.size)return false;return [...x].filter(w=>y.has(w)).length/Math.max(x.size,y.size)>.72;}
export function interpret(raw,history,previous={}){
 let data;try{data=JSON.parse(raw.replace(/^\s*```(?:json)?\s*/,'').replace(/\s*```\s*$/,''));}catch{return {reply:EMAIL,evidence:{},reason:'uncertain',question:''};}
 if(!data||typeof data.reply!=='string'||typeof data.uncertain!=='boolean'||!data.evidence||CRITERIA.some(k=>typeof data.evidence[k]!=='string'))return {reply:EMAIL,evidence:{},reason:'uncertain',question:''};
 const evidence={};for(const key of CRITERIA){const quote=data.evidence[key].trim();const turn=history.findLastIndex(m=>m.role==='user'&&quote.length>=5&&m.content.includes(quote));const correction=history.findLastIndex(m=>m.role==='user'&&/^(actually|correction|I meant|to clarify)\b/i.test(m.content.trim()));const checks={outcome:/\b(want|need|like|wish|help|build|make|improve|create|hoping|goal)\b/i,people:/\b(people|parents|children|kids|adults|customers|clients|staff|team|employees|users|visitors|patients|students|players|friends|family|members|volunteers|readers|shoppers|for me|myself|we|our)\b/i,starting:/\b(today|currently|now|already|existing|new|scratch|first|before|call|phone|manual|broken|frustrat|struggl|takes|lose|lost|using|use|copy|every|each|nothing|haven.t|don.t have)\w*/i,better:/\b(choose|book|send|find|read|pay|play|request|contact|learn|track|see|understand|explore|shop|order|receive|get|finish|save|share|stop|reduce|without|easier|faster)\w*/i};if(turn>=0&&turn>=correction&&!quote.endsWith('?')&&checks[key].test(quote))evidence[key]={quote,turn};}
 if(!evidence.starting){const correction=history.findLastIndex(m=>m.role==='user'&&/^(actually|correction|I meant|to clarify)\b/i.test(m.content.trim()));for(let turn=history.length-1;turn>=Math.max(0,correction);turn--){if(history[turn].role!=='user')continue;const quote=(history[turn].content.match(/[^.!?\n]+[.!?]?/g)||[]).map(s=>s.trim()).find(s=>/^(today|currently|right now|at the moment|this is (?:a )?new|(?:I|we) currently)\b/i.test(s)&&!s.endsWith('?'));if(quote){evidence.starting={quote,turn};break;}}}
 let reply=data.reply.split(READY).join('').trim();let asked=false;reply=reply.replace(/[^.!?\n]*\?/g,q=>{if(asked)return '';asked=true;return q;});let question=reply.match(/[^.!?\n]*\?/g)?.join(' ').trim()||'';
 const last=history.filter(m=>m.role==='user').at(-1)?.content||'';
 const prior=history.filter(m=>m.role==='user').slice(0,-1);
 const repeatedInput=prior.some(m=>norm(m.content)===norm(last));
 const uncertain=data.uncertain||/\b(?:price|pricing|cost|quote|estimate|guarantee|delivery date|completion date)\b/i.test(last)||/\b(?:not sure|cannot confirm|can't confirm|don.t know|don.t have that information)\b/i.test(reply);
 const unsafe=/\b(?:upload|attach|send me).{0,45}\b(?:file|document|screenshot|password|credential)|\b(?:fixed (?:quote|price)|guarantee.{0,30}(?:deliver|ready))\b|[$£€]\s*\d/i.test(reply);
 const technicalQuestion=/\b(?:API|(?:tech|technology|software) stack|framework|database|hosting|integration|programming|email.*tools|spreadsheet.*tools)\b/i.test(question);
 const contextualReady=!!evidence.outcome&&/\b(enough (?:information|context)|clear (?:picture|enough)|ready to send|useful (?:first |human )?conversation)\b/i.test(reply)&&/\b(human|email|Send Request)\b/i.test(reply);
 let reason=uncertain||unsafe||(technicalQuestion&&!CRITERIA.every(k=>evidence[k]))||!reply?'uncertain':repeatedInput||sameQuestion(question,previous.question||'')||!!question&&history.some(m=>m.role==='assistant'&&sameQuestion(question,m.content.match(/[^.!?\n]*\?/g)?.join(' ')||''))||!!previous.reply&&norm(reply)===norm(previous.reply)?'stalled':(CRITERIA.every(k=>evidence[k])||contextualReady)?'ready':'';
 if(reason==='uncertain')reply=EMAIL;
 else if(reason==='stalled')reply=STALLED;
 else if(reason==='ready'){
  // Keep useful advice but never append another discovery question after offering handoff.
  reply=reply.replace(/[^.!?\n]*\?/g,'').trim();
  if(previous.reason!=='ready'||!reply)reply=reply?reply+'\n\n'+READY:READY;
 }
 return {reply,evidence,reason,question:reason?'':question};
}
export function storyText(record,draft=''){
 return `Sam Digital — project / quote request\nStory reference: ${record.id}\n\n${record.notes||'I’d like to discuss this project.'}\n\nFULL CONVERSATION — original record\n`+record.archive.map(m=>`[${m.at}] ${m.role==='user'?'Visitor':'AI guide'}${m.topic?` (topic ${m.topic})`:''}:\n${m.content}`).join('\n\n')+(draft.trim()?`\n\nVisitor — not yet submitted in chat:\n${draft}`:'')+'\n\nPlease respond by email. This is a request, not an agreed scope, price or delivery date.';
}
