import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const mobile=process.env.MOBILE==='1',width=mobile?390:1440,height=mobile?844:1000;
const dir=`proof/demo-gallery/${mobile?'mobile':'desktop'}`;await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width,height}});
await context.addInitScript(()=>{window.Worker=class{postMessage(d){if(d.type==='init')queueMicrotask(()=>this.onmessage({data:{type:'ready',model:'UI test fixture'}}));}terminate(){}}});
const page=await context.newPage(),errors=[],requests=[],results=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
const chunks=()=>[...new Set(requests.map(u=>u.match(/\/(arcade|design|particles|pathfinder)-[^/]+\.js(?:\?|$)/)?.[1]).filter(Boolean))].sort();
async function pixels(selector){return page.locator(selector).evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261;for(let i=0;i<d.length;i+=13)hash=Math.imul(hash^d[i],16777619);return hash>>>0;});}
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/');await expect(page.locator('#intro')).toHaveCount(0);
 await expect(page.locator('.lede')).toHaveText("You have an idea. Let's build it. Tell Sam, your AI guide, what you have in mind. He'll help define your project. When ready, send it to the humans.");
 await expect(page.locator('#showcase [data-demo]')).toHaveCount(4);await expect(page.locator('#showcase canvas')).toHaveCount(0);expect(chunks()).toEqual([]);
 await page.locator('#showcase').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/swatches.png`,fullPage:true});
 for(const id of ['arcade','design','particles','pathfinder']){
  const swatch=page.locator(`#showcase [data-demo=${id}]`);await swatch.click();const modal=page.locator('#demo-dialog');await expect(modal).toHaveAttribute('data-state','ready',{timeout:12000});await expect(modal).toHaveAttribute('data-demo',id);
  expect(chunks()).toEqual([...results.map(r=>r.id),id].sort());await expect(page.locator('.demo-close')).toBeFocused();
  expect(await page.evaluate(()=>document.querySelector('#demo-dialog').scrollWidth<=document.querySelector('#demo-dialog').clientWidth+1&&document.querySelector('.demo-stage').scrollWidth<=document.querySelector('.demo-stage').clientWidth+1)).toBe(true);
  const result={id,lazy:true};
  if(id==='arcade'){
   await page.locator('[data-start]').click();await expect(page.locator('.arcade-demo')).toHaveAttribute('data-game-state','running');
   await expect.poll(()=>page.locator('.arcade-demo').getAttribute('data-score'),{timeout:16000}).not.toBe('0');result.score=Number(await page.locator('.arcade-demo').getAttribute('data-score'));
   await page.locator('[data-pause]').click();const before=await pixels('[data-game-canvas]');await page.waitForTimeout(300);expect(await pixels('[data-game-canvas]')).toBe(before);
   await expect(page.locator('[data-pause]')).toHaveText('Resume');await page.locator('[data-pause]').click();await expect.poll(()=>pixels('[data-game-canvas]')).not.toBe(before);
   await page.locator('[data-restart]').click();await expect(page.locator('.arcade-demo')).toHaveAttribute('data-score','0');await expect(page.locator('b[data-lives]')).toHaveText('3');
  }else if(id==='design'){
   if(!await page.locator('.design-demo__panel').evaluate(e=>e.open))await page.locator('.design-demo__panel>summary').click();
   const preview=page.locator('.design-demo__preview'),before=await preview.evaluate(e=>getComputedStyle(e).backgroundColor);
   await page.locator('button[data-palette=lavender]').click();await expect(page.locator('.design-demo')).toHaveAttribute('data-palette','lavender');await expect.poll(()=>preview.evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe(before);
   await page.locator('button[data-type=serif]').click();await page.locator('button[data-layout=split]').click();await expect(page.locator('.design-demo')).toHaveAttribute('data-type','serif');await expect(page.locator('.design-demo')).toHaveAttribute('data-layout','split');
   result.contrast=await page.locator('[data-contrast]').textContent();expect(parseFloat(result.contrast)).toBeGreaterThan(7);
   await page.locator('[data-preview-link]').click();await expect(page.locator('[data-preview-link]')).toContainText('Direction selected');
  }else if(id==='particles'){
   const before=await pixels('[data-particle-canvas]');await page.locator('[data-preset=torus]').click();await expect(page.locator('.particles-demo')).toHaveAttribute('data-shape','torus');await expect.poll(()=>pixels('[data-particle-canvas]')).not.toBe(before);
   await page.locator('[data-density]').focus();await page.locator('[data-density]').press('End');await expect(page.locator('.particles-demo')).toHaveAttribute('data-count','1000');result.nodes=1000;
   await page.locator('[data-particle-pause]').click();const frozen=await pixels('[data-particle-canvas]');await page.waitForTimeout(350);expect(await pixels('[data-particle-canvas]')).toBe(frozen);
   await page.locator('[data-particle-canvas]').focus();await page.locator('[data-particle-canvas]').press('ArrowRight');expect(await pixels('[data-particle-canvas]')).not.toBe(frozen);
  }else{
   await page.locator('[data-path-run]').click();await expect(page.locator('[data-path-status]')).toContainText('Route found',{timeout:16000});const a=Number(await page.locator('[data-explored]').textContent()),distance=Number(await page.locator('i[data-distance]').textContent());expect(distance).toBe(23);
   await page.locator('[data-path-algorithm]').selectOption('dijkstra');await page.locator('[data-path-run]').click();await expect(page.locator('[data-path-status]')).toContainText('Route found',{timeout:16000});const d=Number(await page.locator('[data-explored]').textContent());expect(d).toBeGreaterThan(a);await expect(page.locator('i[data-distance]')).toHaveText(String(distance));result.astarExplored=a;result.dijkstraExplored=d;result.distance=distance;
   await page.locator('[data-path-reset]').click();await page.locator('[data-path-canvas]').focus();await page.locator('[data-path-canvas]').press('ArrowUp');await page.locator('[data-path-canvas]').press('Space');await expect(page.locator('.pathfinder-demo')).toHaveAttribute('data-walls','1');
   await page.locator('[data-path-maze]').click();await page.locator('[data-path-algorithm]').selectOption('astar');await page.locator('[data-path-run]').click();await expect(page.locator('[data-path-status]')).toContainText('Route found',{timeout:16000});
  }
  if(id==='design'&&mobile)await page.locator('.design-demo__panel>summary').click();await page.locator('.demo-stage').evaluate(e=>e.scrollTop=0);await page.screenshot({path:`${dir}/${id}.png`});
  const axe=await new AxeBuilder({page}).include('#demo-dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await page.evaluate(()=>window.lastDemo=document.querySelector('.demo-stage').firstElementChild);await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(swatch).toBeFocused();await expect(page.locator('.demo-stage canvas')).toHaveCount(0);
  const frames=await page.evaluate(()=>window.lastDemo.dataset.frames);await page.waitForTimeout(250);expect(await page.evaluate(()=>window.lastDemo.dataset.frames)).toBe(frames);expect(await page.evaluate(()=>document.documentElement.style.overflow)).not.toBe('hidden');result.cleanedUp=true;results.push(result);
 }
 expect(errors).toEqual([]);expect(results.length).toBe(4);await writeFile(`${dir}/results.json`,JSON.stringify({mobile,results,errors},null,2));console.log('PASS four lazy demos, actual interactions/score/search/pixels, modal accessibility, focus restoration, cleanup, exact hero copy',JSON.stringify({mobile,results}));
}finally{await context.close();await browser.close();}
