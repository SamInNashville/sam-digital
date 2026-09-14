import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/sam-digital/';
await mkdir('proof/concierge',{recursive:true});
const ctx=await chromium.launchPersistentContext('/Users/sam/sam-digital-ai-test-profile',{channel:'chrome',headless:true,viewport:{width:1440,height:1000}});
const page=await ctx.newPage();let lastProgress='';
page.on('console',m=>{if(m.type()==='error')console.log('BROWSER ERROR',m.text().slice(0,400));});
page.on('requestfailed',r=>console.log('NETWORK FAILURE',r.url().slice(0,160),r.failure()?.errorText));
const result={base,answers:[],start:Date.now()};
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.body.dataset.model==='ready'||document.body.dataset.model==='failed',{},{timeout:300000});
 result.loadMs=Date.now()-result.start;result.model=await page.locator('#state-label').getAttribute('title');
 await page.screenshot({path:'proof/concierge/real-idle.png'});
 await expect(page.locator('body')).toHaveAttribute('data-model','ready');
 console.log('MODEL READY',result.loadMs,'ms',result.model);
 for(const question of ['Where are you based, and what services do you offer?','How much will you charge for an app? Can you guarantee delivery tomorrow?','I manually copy customer orders from email into a spreadsheet every morning. Can you help?']){
  await page.locator('#prompt').fill(question);const n=await page.locator('.turn.assistant').count();const start=Date.now();await page.locator('#composer').evaluate(f=>f.requestSubmit());
  await expect(page.locator('.turn.assistant')).toHaveCount(n+1);if(n===0){await page.waitForTimeout(250);await page.screenshot({path:'proof/concierge/real-synapses.png'});}await expect(page.locator('#atmosphere')).toHaveAttribute('data-state','engaged',{timeout:180000});
  const answer=await page.locator('.answer-text').last().innerText();expect(answer.length).toBeGreaterThan(10);expect(await page.locator('.answer-text.error').count()).toBe(0);
  result.answers.push({question,answer,ms:Date.now()-start});console.log('REAL ANSWER',JSON.stringify(result.answers.at(-1)));
 }
 await page.screenshot({path:'proof/concierge/real-conversation.png'});
 await writeFile('proof/concierge/real-model.json',JSON.stringify(result,null,2));
 console.log('PASS real local model preload and three company/job enquiries');
}finally{await writeFile('proof/concierge/real-model-attempt.json',JSON.stringify(result,null,2));await ctx.close();}
