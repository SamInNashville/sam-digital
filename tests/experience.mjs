import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/';await mkdir('proof/experience',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
await ctx.addInitScript(()=>{window.Worker=class{constructor(){window.fixture=this;}postMessage(d){if(d.type==='init')queueMicrotask(()=>this.onmessage({data:{type:'ready',model:'Explicit visual fixture'}}));if(d.type==='generate')window.finishReply=()=>{this.onmessage({data:{type:'delta',id:d.id,text:JSON.stringify({reply:'An idea worth exploring. Who would you like to use it?',uncertain:false,evidence:{outcome:'',people:'',starting:'',better:''}})}});this.onmessage({data:{type:'done',id:d.id}});};}terminate(){}};});
const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base);await expect(page.locator('#intro')).toHaveCount(0);await expect(page.locator('#showcase canvas')).toBeVisible();await expect(page.getByRole('heading',{name:'Sam is here to help you.',exact:true})).toBeVisible();await expect(page.locator('#companion')).toBeVisible();
 await page.screenshot({path:'proof/experience/desktop-idle.png'});
 await page.locator('#prompt').fill('I would like to make something playful.');await page.locator('#composer').evaluate(f=>f.requestSubmit());await expect(page.locator('#companion-stage')).toHaveAttribute('data-mood','thinking');await page.waitForTimeout(1400);await page.screenshot({path:'proof/experience/desktop-firing.png'});
 await expect(page.locator('#atmosphere')).toHaveAttribute('data-neural-state',/active|firing|working|researching/);
 await page.locator('#motion').click();await expect(page.locator('#companion-stage')).toHaveAttribute('data-still','true');const frames=await page.locator('#atmosphere').getAttribute('data-neural-frames');await page.waitForTimeout(500);expect(await page.locator('#atmosphere').getAttribute('data-neural-frames')).toBe(frames);
 await page.locator('#motion').click();await page.evaluate(()=>window.finishReply());await expect(page.locator('.speaker')).toContainText('SAM · BROWSER AI');await expect(page.locator('#companion-stage')).toHaveAttribute('data-mood','reply');await page.waitForTimeout(5000);
 await page.locator('#privacy-details').evaluate(e=>e.open=true);await page.locator('#companion-toggle').click();await expect(page.locator('#companion')).toBeHidden();await page.locator('#companion-toggle').click();await expect(page.locator('#companion')).toBeVisible();
 await page.locator('#privacy-details summary').click();await expect(page.locator('#privacy-details')).toContainText('model files');await expect(page.locator('#privacy-details')).toContainText('not a person');
 await page.locator('#showcase').scrollIntoViewIfNeeded();await page.screenshot({path:'proof/experience/desktop-gallery.png'});
 const axe=await new AxeBuilder({page}).analyze();expect(axe.violations).toEqual([]);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'proof/experience/mobile-top.png'});await page.locator('#showcase').scrollIntoViewIfNeeded();await page.screenshot({path:'proof/experience/mobile-gallery.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#companion-stage')).toHaveAttribute('data-still','true');await expect(page.locator('#motion')).toBeDisabled();const reducedAxe=await new AxeBuilder({page}).analyze();expect(reducedAxe.violations).toEqual([]);
 expect(errors).toEqual([]);console.log('PASS identity, companion states/hide, neural pause, reduced motion, responsive gallery and accessibility');
}finally{await writeFile('proof/experience/errors.json',JSON.stringify(errors));await browser.close();}
