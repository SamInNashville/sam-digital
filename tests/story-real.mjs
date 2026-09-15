import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/';
await mkdir('proof/story',{recursive:true});
const ctx=await chromium.launchPersistentContext('/Users/sam/sam-digital-ai-test-profile',{channel:'chrome',headless:true,viewport:{width:1440,height:1000}});
await ctx.addInitScript(()=>{sessionStorage.removeItem('sam-digital-story-v1');window.rawModel=[];const W=window.Worker;window.Worker=class extends W{constructor(...args){super(...args);this.addEventListener('message',({data})=>{if(data.type==='delta')window.rawModel.push(data.text);});}};});
const page=await ctx.newPage(),results=[];
try{
 await page.goto(base);await expect(page.locator('body')).toHaveAttribute('data-model','ready',{timeout:300000});
 const questions=['Where are you based, and what services do you offer?','I want a website.','I want parents to book music lessons for their children. Today they phone me and I lose messages. I want them to choose a lesson time and send a booking request without calling.','One more detail: some parents book for two children together.','Actually it is adults, not children, who will book their own lessons.','Can you guarantee an exact price and completion date tomorrow?'];
 for(const question of questions){await page.evaluate(()=>window.rawModel=[]);await page.locator('#prompt').fill(question);await page.locator('#composer').evaluate(f=>f.requestSubmit());await expect(page.locator('#atmosphere')).toHaveAttribute('data-state','engaged',{timeout:180000});const answer=await page.locator('.answer-text').last().innerText();const raw=await page.evaluate(()=>window.rawModel.join(''));const record={assessment:{reason:await page.locator('body').getAttribute('data-handoff')}};results.push({question,answer,raw,assessment:record.assessment});console.log(JSON.stringify(results.at(-1)));}
 await page.screenshot({path:'proof/story/real-conversation.png'});
 await writeFile('proof/story/real.json',JSON.stringify(results,null,2));
 if(!process.env.DIAGNOSTIC){expect(results[0].answer).toContain('Nashville');expect(results[0].assessment.reason).not.toBe('ready');expect(results[1].assessment.reason).not.toBe('ready');expect(results[2].assessment.reason).toBe('ready');expect(results[3].answer).not.toContain('not sure I can');expect(results[4].answer.toLowerCase()).toContain('adults');expect(results[5].assessment.reason).toBe('uncertain');}
}finally{await writeFile('proof/story/real.json',JSON.stringify(results,null,2));await ctx.close();}
