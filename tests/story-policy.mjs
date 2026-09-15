import assert from 'node:assert/strict';
import {interpret,READY,EMAIL,STALLED,wantsPerson,storyText} from '../src/story-policy.js';
const story='I want parents to book music lessons. Today they call me. They should choose a time without calling.';
const h=[{role:'user',content:story}];
const empty={outcome:'',people:'',starting:'',better:''};
const full={outcome:'I want parents to book music lessons.',people:'parents',starting:'Today they call me.',better:'They should choose a time without calling.'};
const raw=(reply,evidence=empty,uncertain=false)=>JSON.stringify({reply,evidence,uncertain});
assert.equal(interpret(raw('That helps.',full),h).reason,'ready');
assert.equal(interpret(raw('What would you like?',empty),h).reason,'');
assert.equal(interpret(raw('That helps.',Object.fromEntries(Object.keys(full).map(k=>[k,'Invented visitor detail']))),h).reason,'');
assert.equal(interpret(raw('That helps.',Object.fromEntries(Object.keys(full).map(k=>[k,'Where are you based?']))),[{role:'user',content:'Where are you based?'}]).reason,'');
assert.equal(interpret('malformed',h).reply,EMAIL);
assert.equal(interpret(raw('I do not know.',empty,true),h).reply,EMAIL);
assert.equal(interpret(raw('Which API platform do you use?',empty),h).reply,EMAIL);
assert.equal(interpret(raw('That helps. Which platform do you use?',full),h).reason,'ready');
assert(!interpret(raw('That helps. Which platform do you use?',full),h).reply.includes('platform'));
assert.equal(interpret(raw('Who will use this?',empty),h,{question:'Who will use this?'}).reply,STALLED);
assert.equal(interpret(raw('Another question?',empty),[...h,...h]).reply,STALLED);
assert.equal(wantsPerson(story+' I want them to send a booking request.'),false);
assert.equal(wantsPerson('Please send this request'),true);
assert.equal(wantsPerson('I want to talk to a human'),true);
assert.equal(interpret(raw('That helps.',full),[...h,{role:'user',content:'Actually adults book their own lessons.'}]).reason,'');
assert(!interpret(raw('Extra detail noted. '+READY,full),h,{reason:'ready'}).reply.includes(READY));
for(let i=0;i<12;i++)assert.equal(interpret(raw('Useful answer '+i,empty),Array.from({length:i+1},(_,j)=>({role:'user',content:'Unique useful detail '+j}))).reason,'');
const long='Full detail '.repeat(1000);const body=storyText({id:'test-story',notes:'my correction',archive:[{role:'user',at:'fixture',content:long},{role:'assistant',at:'fixture',content:'Full guide question?'}]},'Unsent note');for(const s of [long,'Full guide question?','Unsent note','my correction','test-story'])assert(body.includes(s));
console.log('PASS readiness, provenance, unknown, correction, uncertainty, repetition, productive long interviews, complete record');

// Short contextual answers add evidence without erasing previously verified details.
{
 const history=[{role:'user',content:"I'd like to make a mobile game where many people can play dominos"}];
 const first=interpret(JSON.stringify({reply:'Are you thinking iPhone, Android, or both?',uncertain:false,evidence:{outcome:history[0].content,people:history[0].content,starting:'',better:history[0].content}}),history);
 history.push({role:'assistant',content:first.reply},{role:'user',content:'both'},{role:'assistant',content:'Are you starting fresh, or have you already begun?'},{role:'user',content:'new'});
 const next=interpret(JSON.stringify({reply:'A fresh start! What gameplay do you envision?',uncertain:false,evidence:{outcome:history[0].content,people:'both',starting:'new',better:''}}),history,first);
 assert.equal(next.reason,'ready');assert.equal(next.evidence.starting.quote,'new');assert.equal(next.evidence.people.quote,history[0].content);assert.ok(!next.reply.includes('What gameplay'));
 console.log('PASS short new answer and retained original evidence');
}
