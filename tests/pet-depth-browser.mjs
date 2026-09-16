import {chromium,expect} from '@playwright/test';import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('proof/sam-depth',{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});const c=await browser.newContext({viewport:{width:1440,height:1000}});
await c.addInitScript(()=>{window.Worker=class{postMessage(d){if(d.type==='init')queueMicrotask(()=>this.onmessage({data:{type:'ready',model:'Depth fixture'}}));}terminate(){}}});
const p=await c.newPage(),errors=[],results=[];p.on('pageerror',e=>errors.push(e.message));
async function sampleFlight(label){
 const flight=p.locator('.dot-flight');await expect(flight).toHaveAttribute('data-flying','true',{timeout:8000});
 const mode=await flight.getAttribute('data-depth');
 const pending=p.evaluate(async()=>{const f=document.querySelector('.dot-flight'),pet=document.querySelector('#companion'),canvas=document.querySelector('.pet-bubbles'),rows=[],deadline=performance.now()+6500;do{const m=new DOMMatrixReadOnly(getComputedStyle(f).transform),r=pet.getBoundingClientRect(),box=f.getBoundingClientRect();rows.push({z:m.m43,scale:box.width/f.offsetWidth,emitterScale:Number(canvas.dataset.emitterScale),left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,viewportWidth:innerWidth,viewportHeight:innerHeight});await new Promise(requestAnimationFrame);}while(f.dataset.flying==='true'&&performance.now()<deadline);return rows;});
 await p.waitForTimeout(1250);await p.screenshot({path:`proof/sam-depth/${label}-${mode}.png`});const rows=await pending;
 expect(rows.length).toBeGreaterThan(8);expect(rows.every(r=>r.left>=0&&r.top>=0&&r.right<=r.viewportWidth&&r.bottom<=r.viewportHeight)).toBe(true);
 await expect(flight).toHaveAttribute('data-flying','false');expect(await flight.evaluate(e=>Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m43))).toBeLessThan(.01);
 const result={label,mode,minZ:Math.min(...rows.map(r=>r.z)),maxZ:Math.max(...rows.map(r=>r.z)),minScale:Math.min(...rows.map(r=>r.scale)),maxScale:Math.max(...rows.map(r=>r.scale)),minEmitter:Math.min(...rows.map(r=>r.emitterScale)),maxEmitter:Math.max(...rows.map(r=>r.emitterScale)),frames:rows.length};results.push(result);return result;
}
try{
 await p.goto(process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/');await expect(p.locator('.dot-bubble')).toHaveText("I'm Sam! I'll guide you.");
 await p.locator('#showcase').scrollIntoViewIfNeeded();await p.locator('[data-palette=lavender]').focus();await expect(p.locator('.dot-flight')).toHaveAttribute('data-target-kind','showcase',{timeout:8000});await expect(p.locator('.dot-flight')).toHaveAttribute('data-flying','false',{timeout:8000});
 for(const [label,target] of [['first','.breakout-start'],['second','[data-palette=lavender]']]){await p.locator(target).focus();await sampleFlight(label);}
 const far=results.find(r=>r.mode==='far'),near=results.find(r=>r.mode==='near');expect(far).toBeTruthy();expect(near).toBeTruthy();expect(far.minZ).toBeLessThan(-100);expect(far.minScale).toBeLessThan(.9);expect(far.minEmitter).toBeLessThan(.9);expect(near.maxZ).toBeGreaterThan(50);expect(near.maxScale).toBeGreaterThan(1.07);expect(near.maxEmitter).toBeGreaterThan(1.07);
 await p.setViewportSize({width:390,height:844});await p.locator('#prompt').focus();await sampleFlight('mobile');await p.keyboard.type('A thought');await expect(p.locator('.dot-bubble')).toBeHidden();
 await p.locator('#motion').click();await expect(p.locator('#companion-stage')).toHaveAttribute('data-still','true');await expect(p.locator('.dot-flight')).toBeHidden();await expect(p.locator('#companion-stage #companion')).toBeVisible();expect(errors).toEqual([]);
 await writeFile('proof/sam-depth/metrics.json',JSON.stringify(results,null,2));console.log('PASS actual CSS depth, visible near/far scale, depth-matched emitter, resting speech scale, mobile bounds and pause');console.log(JSON.stringify(results));
}finally{await c.close();await browser.close();}
