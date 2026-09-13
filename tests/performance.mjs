import {chromium,expect} from '@playwright/test';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://127.0.0.1:4178/sam-digital/');await expect(p.locator('#signal')).toHaveAttribute('data-renderer','webgpu',{timeout:20000});
const measure=()=>p.evaluate(()=>new Promise(resolve=>{const host=document.querySelector('#signal');const f=Number(host.dataset.frames);const start=performance.now();let ticks=0;function loop(){ticks++;if(performance.now()-start<3000)requestAnimationFrame(loop);else resolve({rafFps:ticks/((performance.now()-start)/1000),renderFps:(Number(host.dataset.frames)-f)/((performance.now()-start)/1000),canvasWidth:document.querySelector('#signal-canvas').width});}requestAnimationFrame(loop);}));
console.log('Active',await measure());await p.locator('#motion-toggle').click();console.log('Paused baseline',await measure());await b.close();
