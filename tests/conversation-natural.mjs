import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/';
const cases=[['I want to build a game site for dominos'],['I want to build a domino game where multiple people can play online'],["I'd like to make a mobile game where many people can play dominos"],['I want a website for my bakery. People should be able to see our cakes and ask about an order.']];
await mkdir('proof/natural',{recursive:true});const ctx=await chromium.launchPersistentContext('/Users/sam/sam-digital-ai-test-profile',{channel:'chrome',headless:true});
await ctx.addInitScript(()=>{window.rawModel=[];const W=window.Worker;window.Worker=class extends W{constructor(...args){super(...args);this.addEventListener('message',({data})=>{if(data.type==='delta')window.rawModel.push(data.text);});}};});
const page=await ctx.newPage(),results=[];
try{
 await page.goto(base);await expect(page.locator('body')).toHaveAttribute('data-model','ready',{timeout:300000});
 for(const [message] of cases){
  if(results.length)await page.locator('#fresh').click();
  await page.locator('#prompt').fill(message);await page.locator('#composer').evaluate(f=>f.requestSubmit());await expect(page.locator('#atmosphere')).toHaveAttribute('data-state','engaged',{timeout:180000});
  const answer=await page.locator('.answer-text').last().innerText(),raw=JSON.parse(await page.evaluate(()=>window.rawModel.at(-1)));
  results.push({message,answer,raw});console.log(JSON.stringify(results.at(-1)));
  expect(answer).toContain(raw.reply.trim());expect(answer.length).toBeGreaterThan(30);
  expect(answer).not.toMatch(/\b(?:fantastic|great) idea![^?]*, right\?\s*$/i);
 }
 await page.locator('#review').click();for(const r of results){await expect(page.locator('#story-record')).toContainText(r.message);await expect(page.locator('#story-record')).toContainText(r.answer);}
 console.log('PASS real-model varied openings: uncut replies, full original record. Review text for voice; no prescribed question order.');
}finally{await writeFile('proof/natural/results.json',JSON.stringify({base,results},null,2));await ctx.close();}
