import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/';await mkdir('proof/experience',{recursive:true});
const ctx=await chromium.launchPersistentContext('/Users/sam/sam-digital-ai-test-profile',{channel:'chrome',headless:true,viewport:{width:1440,height:1000}});
const page=await ctx.newPage(),requests=[];const marker='LOCAL-STORY-CHECK-753184';
page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()||''}));
try{
 await page.goto(base);await expect(page.locator('body')).toHaveAttribute('data-model','ready',{timeout:300000});
 const before=requests.length;await page.locator('#prompt').fill('I would like a website for my pottery classes. My private project reference is '+marker+'.');await page.locator('#composer').evaluate(f=>f.requestSubmit());await expect(page.locator('#atmosphere')).toHaveAttribute('data-state','engaged',{timeout:180000});const answer=await page.locator('.answer-text').last().innerText();expect(answer.length).toBeGreaterThan(30);
 const leaked=requests.filter(r=>(r.url+r.body).includes(marker));expect(leaked).toEqual([]);expect(requests.slice(before).filter(r=>r.method!=='GET')).toEqual([]);
 await page.locator('#review').click();await expect(page.locator('#story-record')).toContainText(marker);await expect(page.locator('#story-record')).toContainText(answer);
 console.log(JSON.stringify({base,answer,networkRequestsDuringReply:requests.length-before,promptInNetwork:false,emailReviewHasFullContext:true}));
 await writeFile('proof/experience/privacy-network.json',JSON.stringify({base,requests:requests.map(({url,method})=>({url,method})),answer,promptInNetwork:false},null,2));
}finally{await ctx.close();}
