import { chromium, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import { mkdir,writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:512,height:512}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('proof/evolution',{recursive:true});
try {
 await page.goto('http://127.0.0.1:4180/sam-digital/tests/render.html');
 await page.waitForFunction(()=>typeof window.renderSignal==='function',null,{timeout:20000});
 const cases=[{name:'idle-start',time:0},{name:'idle-evolved',time:8},{name:'cursor-left',time:8,pointer:[-.65,.35],presence:1,energy:.7},{name:'cursor-right',time:8,pointer:[.65,-.3],presence:1,energy:.7},{name:'pulse',time:8,pointer:[.65,-.3],presence:1,energy:1,pulse:1}];
 const images=[];
 for(const sample of cases){const {name,...params}=sample;const data=await page.evaluate(p=>window.renderSignal(p),params);const buf=Buffer.from(data.split(',')[1],'base64');await writeFile(`proof/evolution/${name}.png`,buf);const png=PNG.sync.read(buf);images.push(png);let copper=0;for(let i=0;i<png.data.length;i+=4)if(png.data[i]>60 && png.data[i]>png.data[i+1]*1.15)copper++;expect(copper).toBeGreaterThan(12000);console.log('PASS visible sculpture',name,copper,'copper pixels');}
 const diff=(a,b)=>{let changed=0;for(let i=0;i<a.data.length;i+=4)if(Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2])>45)changed++;return changed/(a.width*a.height);};
 const report={idleChangedFraction:diff(images[0],images[1]),pointerChangedFraction:diff(images[2],images[3]),pulseChangedFraction:diff(images[3],images[4])};
 expect(report.idleChangedFraction).toBeGreaterThan(.08);expect(report.pointerChangedFraction).toBeGreaterThan(.10);expect(report.pulseChangedFraction).toBeGreaterThan(.02);
 const sheet=new PNG({width:512*cases.length,height:512});images.forEach((p,i)=>PNG.bitblt(p,sheet,0,0,512,512,i*512,0));await writeFile('proof/evolution/contact-sheet.png',PNG.sync.write(sheet));
 // Same inputs produce the same real GPU pixels, rather than an RNG-dependent assertion.
 const repeat=PNG.sync.read(Buffer.from((await page.evaluate(()=>window.renderSignal({time:8}))).split(',')[1],'base64'));
 expect(diff(images[1],repeat)).toBe(0);expect(errors).toEqual([]);
 await writeFile('proof/evolution/results.json',JSON.stringify(report,null,2));console.log('PASS same-time pointer deformation and repeatable pixels',report);
} finally {await browser.close();}
