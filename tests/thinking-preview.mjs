import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('proof/thinking',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:'proof/thinking',size:{width:1440,height:1000}}});
const page=await context.newPage();
await page.addInitScript(()=>{Object.defineProperty(window,'LanguageModel',{value:undefined});window.Worker=class{constructor(){window.fixtureWorker=this;}postMessage(d){if(d.type==='init')queueMicrotask(()=>this.onmessage({data:{type:'ready',model:'Visual test — response held'}}));if(d.type==='generate')window.requestId=d.id;}terminate(){}};});
const readActivity=()=>page.locator('#atmosphere').getAttribute('data-activity').then(Number);
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/');await expect(page.locator('#atmosphere')).toHaveAttribute('data-renderer','webgpu',{timeout:20000});await expect(page.locator('#intro')).toHaveCount(0);
 await expect(page.locator('#atmosphere')).toHaveAttribute('data-atom-count','0');
 await expect.poll(readActivity).toBeLessThan(.001);
 await page.locator('#prompt').pressSequentially('I would like help with my website.',{delay:80});
 await expect(page.locator('#atmosphere')).toHaveAttribute('data-thinking','typing');expect(await readActivity()).toBeGreaterThan(.2);await page.screenshot({path:'proof/thinking/typing.png'});
 await page.locator('#composer').evaluate(f=>f.requestSubmit());await expect(page.locator('#atmosphere')).toHaveAttribute('data-thinking','responding');await expect.poll(readActivity).toBeGreaterThan(.9);
 const start=Date.now(),frames=Number(await page.locator('#atmosphere').getAttribute('data-frames'));await page.waitForTimeout(4000);const fps=(Number(await page.locator('#atmosphere').getAttribute('data-frames'))-frames)/((Date.now()-start)/1000);
 await page.screenshot({path:'proof/thinking/responding.png'});
 await page.evaluate(()=>{window.fixtureWorker.onmessage({data:{type:'delta',id:window.requestId,text:'I can help you prepare that enquiry. What should work better?'}});window.fixtureWorker.onmessage({data:{type:'done',id:window.requestId}});});
 await expect(page.locator('#atmosphere')).toHaveAttribute('data-thinking','idle');await expect.poll(readActivity).toBeLessThan(.001);await page.waitForTimeout(1000);await page.screenshot({path:'proof/thinking/finished.png'});
 await page.locator('#motion').click();const a=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.waitForTimeout(300);expect(await page.locator('canvas').evaluate(c=>c.toDataURL())).toBe(a);
 await writeFile('proof/thinking/results.json',JSON.stringify({renderer:'real WebGPU',model:'explicit held fixture',typingActivates:true,responseActivates:true,completionExtinguishes:true,pauseStable:true,fps},null,2));console.log('PASS typing, response, completion, pause; fps',fps);
}finally{const video=page.video();await context.close();await video.saveAs('proof/thinking/pinpoint-loading.webm');await browser.close();}
