import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},...(process.env.RECORD_VIDEO ? {recordVideo:{dir:'proof/evolution/video',size:{width:1152,height:800}}} : {})});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4178/sam-digital/');await expect(page.locator('#signal')).toHaveAttribute('data-renderer','webgpu',{timeout:20000});
 await page.evaluate(()=>document.fonts.ready);
 const bounds=await page.locator('#signal').boundingBox();
 const start=Number(await page.locator('#signal').getAttribute('data-frames'));const time=performance.now();
 await page.mouse.move(500,480);await page.waitForTimeout(1500);
 await page.screenshot({path:'proof/evolution/live-idle.png'});
 for(const [x,y] of [[.25,.35],[.75,.55],[.35,.65],[.65,.30]]){
  await page.mouse.move(bounds.x+bounds.width*x,bounds.y+bounds.height*y,{steps:16});await page.waitForTimeout(650);
 }
 await page.mouse.click(bounds.x+bounds.width*.6,bounds.y+bounds.height*.4);await page.waitForTimeout(160);
 await page.screenshot({path:'proof/evolution/live-pulse.png'});
 await page.waitForTimeout(800);
 await page.mouse.move(bounds.x+bounds.width*.4,bounds.y+bounds.height*.4);await page.mouse.down();
 await page.mouse.move(bounds.x+bounds.width*.7,bounds.y+bounds.height*.6,{steps:20});await page.mouse.up();
 await page.waitForTimeout(500);await page.screenshot({path:'proof/evolution/live-drag.png'});
 await page.locator('#signal').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');await page.waitForTimeout(500);await page.keyboard.press('Escape');
 await page.mouse.move(10,10);await page.waitForTimeout(1500);
 const end=Number(await page.locator('#signal').getAttribute('data-frames'));
 const fps=(end-start)/((performance.now()-time)/1000);
 expect(fps).toBeGreaterThan(10);expect(fps).toBeLessThanOrEqual(31);expect(errors).toEqual([]);
 await expect(page.locator('#signal')).toHaveAttribute('data-renderer','webgpu');
 console.log('PASS mouse sweeps, pulse, drag-release, keyboard and healthy real GPU; observed fps',fps.toFixed(1));
 await writeFile('proof/evolution/runtime.json',JSON.stringify({fps,errors,frames:end-start},null,2));
 const video=page.video();await context.close();if(video)await video.saveAs('proof/evolution/interaction.webm');
}finally{await browser.close();}
