import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome',headless:true});const ctx=await b.newContext({viewport:{width:1440,height:1000}});const page=await ctx.newPage();
await mkdir('proof/concierge',{recursive:true});
// Hold ONLY the model reply for capture. The vgpu renderer is real and unmocked.
await page.addInitScript(()=>{Object.defineProperty(window,'LanguageModel',{value:undefined});window.Worker=class{postMessage(d){if(d.type==='init')queueMicrotask(()=>this.onmessage({data:{type:'ready',model:'Visual capture fixture'}}));}terminate(){}};});
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4178/sam-digital/');await expect(page.locator('#atmosphere')).toHaveAttribute('data-renderer','webgpu',{timeout:20000});await expect(page.locator('#intro')).toHaveCount(0);
 const pixels=()=>page.locator('#atmosphere canvas').evaluate(c=>c.toDataURL());const a=await pixels();await page.waitForTimeout(700);expect(await pixels()).not.toBe(a);
 await page.screenshot({path:'proof/concierge/smoke.png'});
 await page.locator('#prompt').fill('I need help making appointments easier for my customers.');await page.locator('#composer').evaluate(f=>f.requestSubmit());await page.waitForTimeout(900);await expect(page.locator('#atmosphere')).toHaveAttribute('data-state','researching');const network=await pixels();expect(network).not.toBe(a);await page.screenshot({path:'proof/concierge/synapses.png'});await page.waitForTimeout(700);expect(await pixels()).not.toBe(network);
 await page.locator('#motion').click();await page.waitForTimeout(150);const paused=await pixels();await page.waitForTimeout(250);expect(await pixels()).toBe(paused);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'proof/concierge/mobile-researching.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#motion')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#atmosphere')).toHaveAttribute('data-renderer','webgpu');
 await writeFile('proof/concierge/visual-results.json',JSON.stringify({renderer:'real vgpu',model:'held test fixture',idlePixelsChange:true,workingCloudPixelsChange:true,pauseStable:true,mobileNoOverflow:true,reducedMotion:true},null,2));
 console.log('PASS real vgpu cloud at idle and during work, pause, reduced motion and mobile capture');
}finally{await b.close();}
