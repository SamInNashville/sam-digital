import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/';await mkdir('proof/scope',{recursive:true});
const ctx=await chromium.launchPersistentContext('/Users/sam/sam-digital-ai-test-profile',{channel:'chrome',headless:true,viewport:{width:1440,height:1000}});const page=await ctx.newPage(),results=[];
try{
 await page.goto(base);await expect(page.locator('body')).toHaveAttribute('data-model','ready',{timeout:300000});
 for(const message of ['I want to build a domino multiplayer mobile app','Both iPhone and Android.','It is a brand new project. I want friends to play together from their own phones.']){
  await page.locator('#prompt').fill(message);await page.locator('#composer').evaluate(f=>f.requestSubmit());await expect(page.locator('#atmosphere')).toHaveAttribute('data-state','engaged',{timeout:180000});const answer=await page.locator('.answer-text').last().innerText();results.push({message,answer});console.log(JSON.stringify(results.at(-1)));
 }
 expect(results[0].answer).toMatch(/iPhone|Android/i);expect(results[0].answer).not.toMatch(/unique features|how.*(?:game.*played|play.*game)|not sure I can/i);
 expect(results[1].answer).not.toMatch(/(?:iPhone.{0,20}Android|Android.{0,20}iPhone).{0,15}\?/i);expect(results[1].answer).not.toMatch(/not sure I can/i);expect(results[1].answer).toMatch(/new|already|started|existing/i);expect(results[1].answer).not.toMatch(/how.*game.*work|unique features/i);
 await page.locator('#review').click();for(const r of results)await expect(page.locator('#story-record')).toContainText(r.message);await page.screenshot({path:'proof/scope/review.png'});console.log('PASS actual local model: domino mobile scope, both devices, new project, original context');
}finally{await writeFile('proof/scope/real.json',JSON.stringify({base,results},null,2));await ctx.close();}
