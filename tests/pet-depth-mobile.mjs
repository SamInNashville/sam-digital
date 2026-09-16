import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('proof/sam-depth',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
await context.addInitScript(()=>{window.Worker=class{postMessage(d){if(d.type==='init')queueMicrotask(()=>this.onmessage({data:{type:'ready',model:'Mobile depth fixture'}}));}terminate(){}}});
const page=await context.newPage(),results=[];
try {
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/');
 await expect(page.locator('.dot-bubble')).toHaveText("I'm Sam! I'll guide you.");
 for(const selector of ['.breakout-start','[data-palette=lavender]','.breakout-start']) {
  await page.locator(selector).focus();
  await expect(page.locator('.dot-flight')).toHaveAttribute('data-flying','true',{timeout:10000});
  const sampling=page.evaluate(async()=>{const f=document.querySelector('.dot-flight'),pet=document.querySelector('#companion'),rows=[];const deadline=performance.now()+7000;do{const r=pet.getBoundingClientRect();rows.push({scale:f.getBoundingClientRect().width/f.offsetWidth,left:r.left,top:r.top,right:r.right,bottom:r.bottom});await new Promise(requestAnimationFrame);}while(f.dataset.flying==='true'&&performance.now()<deadline);return rows;});
  await page.waitForTimeout(1200);await page.screenshot({path:`proof/sam-depth/mobile-flight-${results.length}.png`});
  const rows=await sampling;expect(rows.length).toBeGreaterThan(5);expect(rows.every(r=>r.left>=0&&r.top>=0&&r.right<=390&&r.bottom<=844)).toBe(true);
  results.push({min:Math.min(...rows.map(r=>r.scale)),max:Math.max(...rows.map(r=>r.scale)),frames:rows.length});
  await expect(page.locator('.dot-flight')).toHaveAttribute('data-flying','false');
 }
 expect(Math.max(...results.map(r=>r.max))).toBeGreaterThan(1.8);
 expect(Math.min(...results.map(r=>r.min))).toBeLessThan(.8);
 await writeFile('proof/sam-depth/mobile-metrics.json',JSON.stringify(results,null,2));
 console.log('PASS real mobile near/far flight remains fully visible',JSON.stringify(results));
}finally{await context.close();await browser.close();}
