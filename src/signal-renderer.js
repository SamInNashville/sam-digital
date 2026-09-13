import {draw, effect, target, sampler, frame} from 'vgpu';
import source from './signal.wgsl?raw';
const compositeSource = `
struct Params { resolution: vec2f, pointer: vec2f, time: f32, energy: f32, presence: f32, pulse: f32, rotation: vec2f }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var scene: texture_2d<f32>;
@group(0) @binding(2) var linear: sampler;
@fragment fn fs_main(@location(0) uv:vec2f)->@location(0) vec4f {
 let bg=vec3f(0.07843,0.08627,0.07451);
 let src=textureSample(scene,linear,uv);
 let p=uv-0.5;
 var color=mix(bg,src.rgb,src.a);
 var bloom=vec3f(0);
 for(var i=0;i<8;i++) {
  let angle=f32(i)*0.785398;
  let offset=vec2f(cos(angle),sin(angle))*0.013;
  let tap=textureSample(scene,linear,uv+offset);
  bloom+=max(tap.rgb-vec3f(0.48),vec3f(0));
 }
 color+=bloom*(0.09+params.energy*0.04);
 color+=vec3f(0.035,0.018,0.006)*exp(-length(p)*7.0)*(1.0-src.a);
 // Energy is visible beyond the silhouette: travelling sparks and a pulse ring.
 if(params.energy>0.04 || params.pulse>0.01) {
  for(var i=0;i<14;i++) {
   let fi=f32(i);
   let a=fi*2.39996+params.time*(0.25+fi*0.008);
   let r=0.32+0.055*sin(fi*4.0+params.time*0.6);
   let point=vec2f(cos(a)*r,sin(a)*r*0.72);
   let d=length(p-point);
   let spark=exp(-d*d*120000.0)+0.10*exp(-d*d*5000.0);
   color+=vec3f(1.0,0.64,0.31)*spark*params.energy;
  }
  let origin=vec2f(params.pointer.x,-params.pointer.y)*0.20;
  let ring=abs(length(p-origin)-(0.06+(1.0-params.pulse)*0.52));
  color+=vec3f(0.5,0.26,0.09)*exp(-ring*260.0)*params.pulse*params.pulse*(1.0-src.a);
 }
 color=mix(color,bg,smoothstep(0.43,0.66,length(p)));
 return vec4f(color,1.0);
}`;
export async function createSignalRenderer(gpu, output) {
 const scene=target(gpu,{size:output.size,depth:true,msaa:true,format:'rgba8unorm',label:'Living Signal / 3D scene'});
 const initial={resolution:output.size,pointer:[0,0],time:0,energy:0,presence:0,pulse:0,rotation:[0,0]};
 const indices=new Uint16Array(192*48*6);
 let cursor=0;
 for(let a=0;a<192;a++)for(let b=0;b<48;b++){
  const i=a*49+b,j=(a+1)*49+b;
  indices.set([i,j,i+1,i+1,j,j+1],cursor);cursor+=6;
 }
 const indexBuffer=gpu.gpu.createBuffer({size:indices.byteLength,usage:GPUBufferUsage.INDEX,mappedAtCreation:true});
 new Uint16Array(indexBuffer.getMappedRange()).set(indices);indexBuffer.unmap();
 const sculpture=draw(gpu,{shader:source,geometry:{indexBuffer,indexCount:indices.length,indexFormat:'uint16'},cull:'none',set:{params:initial},label:'Living Signal / indexed parametric mesh'});
 const composite=effect(gpu,compositeSource,{set:{params:initial,scene:scene.color,linear:sampler(gpu,{minFilter:'linear',magFilter:'linear'})},label:'Living Signal / bloom & energy'});
 await sculpture.compile(scene);
 await composite.compile({colors:[navigator.gpu.getPreferredCanvasFormat()]});
 return {
  resize(){scene.resize(output.size);composite.set({scene:scene.color});},
  render(values){const params={...initial,...values,resolution:output.size};sculpture.set({params});composite.set({params});frame(gpu,f=>{f.pass({target:scene,clear:[0,0,0,0]},p=>p.draw(sculpture));f.pass(output,composite);});}
 };
}
