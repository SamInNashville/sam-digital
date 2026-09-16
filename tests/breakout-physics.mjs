import {chromium,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const source=(await readFile(new URL('../src/demos/arcade.js',import.meta.url),'utf8')).replace("import './arcade.css';",'');
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext();const page=await context.newPage();
try{
 await page.setContent('<div id="host"></div>');
 const results=await page.evaluate(async source=>{
  // Isolated physics run: no-op drawing and controlled frame clock, real mount/input/update logic.
  const context=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});HTMLCanvasElement.prototype.getContext=()=>context;
  let clock=performance.now(),seq=0,seed=1234567;const callbacks=new Map();window.requestAnimationFrame=fn=>{callbacks.set(++seq,fn);return seq;};window.cancelAnimationFrame=id=>callbacks.delete(id);Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));const module=await import(url);URL.revokeObjectURL(url);const dispose=module.mount(document.querySelector('#host'));const root=document.querySelector('.arcade-demo'),canvas=root.querySelector('canvas');
  function run(mode,limit){root.querySelector('[data-start]').click();let frames=0;while(root.dataset.gameState==='running'&&frames<limit){const ball=Number(root.dataset.ballX),r=canvas.getBoundingClientRect();const target=mode==='win'?ball+Math.sin(frames*.039)*30:ball<320?590:50;canvas.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+target/640*r.width,clientY:r.top+350/390*r.height,isPrimary:true}));clock+=1000/120;const batch=[...callbacks.values()];callbacks.clear();for(const fn of batch)fn(clock);frames++;}return {mode,frames,state:root.dataset.gameState,score:Number(root.dataset.score),lives:Number(root.dataset.lives)};}
  const win=run('win',100000);root.querySelector('[data-restart]').click();const lose=run('lose',20000);dispose();return {win,lose,pendingCallbacks:callbacks.size};
 },source);
 expect(results.win.state).toBe('won');expect(results.win.score).toBeGreaterThan(0);expect(results.lose.state).toBe('game-over');expect(results.lose.lives).toBe(0);expect(results.pendingCallbacks).toBe(0);
 await mkdir('proof/demo-gallery',{recursive:true});await writeFile('proof/demo-gallery/arcade-physics.json',JSON.stringify(results,null,2));console.log('PASS actual arcade collision/clear/loss/reset paths with deterministic frame clock; drawing stubbed (separate visual test)',JSON.stringify(results));
}finally{await context.close();await browser.close();}
