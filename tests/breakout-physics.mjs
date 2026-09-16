import {chromium,expect} from '@playwright/test';
const base=process.env.BASE_URL||'http://127.0.0.1:4183/sam-digital/';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.addInitScript(()=>{
 Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true});
 let id=0,time=0;const callbacks=new Map();window.requestAnimationFrame=fn=>{callbacks.set(++id,fn);return id;};window.cancelAnimationFrame=id=>callbacks.delete(id);
 const arc=CanvasRenderingContext2D.prototype.arc;CanvasRenderingContext2D.prototype.arc=function(x,y,...rest){if(this.canvas.classList.contains('breakout-canvas'))window.drawnBall={x,y};return arc.call(this,x,y,...rest);};
 window.playFrames=(limit,mode)=>{const c=document.querySelector('.breakout-canvas'),r=c.getBoundingClientRect();let bounces=0,oldY=0,oldDirection=0,frames=0;
  for(;frames<limit;frames++){const ball=window.drawnBall;if(ball){const direction=Math.sign(ball.y-oldY);if(oldDirection>0&&direction<0&&ball.y>260)bounces++;if(direction)oldDirection=direction;oldY=ball.y;const aim=mode==='win'?ball.x+Math.sin(frames*.041)*29:ball.x>280?10:550;c.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+aim/c.width*r.width,clientY:r.top+r.height-10,isPrimary:true}));}
   time+=1000/60;const batch=[...callbacks.values()];callbacks.clear();for(const fn of batch)fn(time);
   if(/cleared|Game over/.test(document.querySelector('.breakout-status').textContent))break;
  }
  return {frames,bounces,score:document.querySelector('[data-score]').textContent,lives:document.querySelector('[data-lives]').textContent,status:document.querySelector('.breakout-status').textContent,queuedFrames:callbacks.size};
 };
});
try{
 await page.goto(base);await page.locator('.breakout-start').scrollIntoViewIfNeeded();await page.waitForTimeout(150);await page.locator('.breakout-start').click();
 const win=await page.evaluate(()=>window.playFrames(24000,'win'));console.log('Rendered-ball-following win proof',win);expect(win.status).toContain('cleared');expect(win.score).toBe('280');expect(win.bounces).toBeGreaterThan(0);
 await page.locator('.breakout-restart').click();await page.locator('.breakout-start').click();const lose=await page.evaluate(()=>window.playFrames(10000,'lose'));console.log('Deliberately missed paddle loss proof',lose);expect(lose.status).toContain('Game over');expect(lose.lives).toBe('0');
 await page.locator('.breakout-restart').click();expect(await page.locator('[data-score]').innerText()).toBe('0');expect(await page.locator('[data-lives]').innerText()).toBe('3');console.log('PASS real game physics: bricks, paddle bounces, full win, full loss, restart; virtual frame clock, no state injection');
}finally{await browser.close();}
