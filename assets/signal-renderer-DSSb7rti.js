import{draw as e,effect as t,frame as n,sampler as r,target as i}from"./dist-CDkrgdfz.js";var a=`struct Params { resolution: vec2f, pointer: vec2f, time: f32, energy: f32, presence: f32, pulse: f32, rotation: vec2f }
@group(0) @binding(0) var<uniform> params: Params;
const TAU = 6.283185307;
fn turn(p: vec2f, a: f32) -> vec2f { return mat2x2f(cos(a), sin(a), -sin(a), cos(a)) * p; }
fn position(a: f32, b: f32) -> vec3f {
  let t = params.time;
  let evolve = 0.55 + 0.45 * sin(t * 0.40);
  let radius = 0.80 + 0.17 * sin(a * 3.0 + t * 0.50) * evolve + 0.065 * sin(a * 2.0 - t * 0.38);
  let height = 0.18 * sin(a * 2.0 + t * 0.5) + 0.10 * cos(a * 3.0 - t * 0.35);
  let thickness = 0.25 + 0.045 * sin(a * 3.0 - t * 0.75);
  let crossSection = turn(vec2f(cos(b), sin(b) * (0.65 + 0.15 * cos(a * 2.0 + t * 0.4))) * thickness, a + sin(t * 0.35));
  let p = vec3f((radius + crossSection.x) * cos(a), (radius + crossSection.x) * sin(a), height + crossSection.y);
  let yz = turn(p.yz, -0.75 - sin(t * 0.3) * 0.28 + params.pointer.y * 0.5 + params.rotation.y);
  let xz = turn(vec2f(p.x, yz.y), params.rotation.x + t * 0.22);
  let xy = turn(vec2f(xz.x, yz.x), 0.35 + sin(t * 0.19) * 0.30 - params.pointer.x * 0.42);
  var world = vec3f(xy, xz.y);
  let cursor = params.pointer * 1.35;
  let d = length(world.xy - cursor);
  let influence = exp(-d * d * 1.2) * params.presence;
  world += vec3f((cursor - world.xy) * 0.30, 0.18) * influence;
  let ripple = sin(d * 13.0 - t * 6.0) * exp(-d * 0.7) * (params.energy * 0.045 + params.pulse * 0.10);
  world += normalize(world + vec3f(0.0,0.0,0.1)) * ripple;
  return world;
}
struct Vertex {
 @builtin(position) clip: vec4f,
 @location(0) world: vec3f,
 @location(1) normal: vec3f,
 @location(2) tangent: vec3f,
 @location(3) uv: vec2f
}
@vertex fn vs_main(@builtin(vertex_index) vi: u32) -> Vertex {
  let uv = vec2f(f32(vi / 49u), f32(vi % 49u)) / vec2f(192.0,48.0);
  let a = uv.x * TAU;
  let b = uv.y * TAU;
  let p = position(a,b);
  let da = position(a + 0.002,b) - position(a - 0.002,b);
  let db = position(a,b + 0.002) - position(a,b - 0.002);
  let w = 4.4 - p.z;
  var out: Vertex;
  out.clip = vec4f(p.xy * 2.65, w * (10.0/9.9) - (1.0/9.9), w);
  out.world = p;
  out.normal = normalize(cross(da,db));
  out.tangent = normalize(da);
  out.uv = vec2f(a,b);
  return out;
}
@fragment fn fs_main(in: Vertex, @builtin(front_facing) front: bool) -> @location(0) vec4f {
  let phase = in.uv.x * 100.0 + in.uv.y * 3.0 + sin(in.uv.y * 2.0 + params.time * 0.5) - params.time * 0.7;
  let grooves = 0.5 + 0.5 * cos(phase);
  let ribs = pow(grooves, 3.0);
  let bump = sin(phase) * 0.16;
  let n = normalize(in.normal + in.tangent * bump);
  let v = normalize(vec3f(0,0,4.4) - in.world);
  let l = normalize(vec3f(-2.0 + params.pointer.x * 2.0, 3.0 + params.pointer.y * 1.5, 4.0));
  let key = max(dot(n,l),0.0);
  let rim = pow(1.0 - abs(dot(n,v)), 3.0);
  let spec = pow(max(dot(n,normalize(l+v)),0.0),70.0);
  let softbox = pow(max(dot(n,normalize(vec3f(2,-1,3)+v)),0.0),22.0);
  let copper = mix(vec3f(0.18,0.075,0.035),vec3f(0.87,0.54,0.27),ribs);
  let stream = pow(0.5 + 0.5 * sin(in.uv.x * 5.0 - params.time * 2.2 + in.uv.y),12.0);
  let emissive = stream * (0.025 + params.energy * 0.28 + params.pulse * 0.4);
  let color = copper * (0.35 + key * 0.9) + vec3f(1.0,0.81,0.55) * (spec * 0.7 + softbox * 0.18 + emissive) + vec3f(0.22,0.11,0.045) * rim;
  return vec4f(color,1.0);
}
`,o=`struct Params { resolution: vec2f, pointer: vec2f, time: f32, energy: f32, presence: f32, pulse: f32, rotation: vec2f }
@group(0) @binding(0) var<uniform> params: Params;
fn hash(n:f32)->f32{return fract(sin(n*127.1+311.7)*43758.5453);}
struct Out { @builtin(position) clip:vec4f,@location(0) uv:vec2f,@location(1) fade:f32,@location(2) tint:vec3f }
@vertex fn vs_main(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->Out{
 let id=f32(ii/4u);let trail=f32(ii%4u);
 let t=params.time-trail*0.032;
 let seed=hash(id+1.0);let speed=0.35+seed*0.42+params.energy*0.25;
 let a=id*2.399963+t*speed;
 let r=1.08+0.32*hash(id+17.0)+0.08*sin(t*0.65+id);
 let tilt=(hash(id+41.0)-0.5)*1.25;
 var p=vec3f(cos(a)*r,sin(a)*r*0.58,sin(a)*r*0.65+tilt*0.32);
 p.y+=sin(id*1.7+t*0.55)*0.16;
 let cursor=params.pointer*1.45;let delta=cursor-p.xy;
 let attraction=exp(-dot(delta,delta)*0.8)*params.presence;
 p+=vec3f(delta*attraction*0.22,sin(t*2.0+id)*params.energy*0.04);
 let w=4.4-p.z;
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 let uv=corners[vi];
 let size=(0.008+0.012*pow(seed,4.0))*(1.0-trail*0.12)*(1.0+params.energy*0.7);
 var out:Out;
 out.clip=vec4f((p.xy+uv*size)*2.65,w*(10.0/9.9)-(1.0/9.9),w);
 out.uv=uv;out.fade=(1.0-trail/4.0)*(0.3+0.7*pow(seed,2.0));
 out.tint=mix(vec3f(0.55,0.25,0.07),vec3f(1.0,0.85,0.56),seed);
 return out;
}
@fragment fn fs_main(in:Out)->@location(0) vec4f{
 let d=dot(in.uv,in.uv);let glow=exp(-d*5.0)+0.17*exp(-d*1.5);
 return vec4f(in.tint*glow*in.fade,min(1.0,glow*in.fade));
}
`,s=`
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
}`;async function c(c,l){let u=i(c,{size:l.size,depth:!0,msaa:!0,format:`rgba8unorm`,label:`Living Signal / 3D scene`}),d={resolution:l.size,pointer:[0,0],time:0,energy:0,presence:0,pulse:0,rotation:[0,0]},f=new Uint16Array(55296),p=0;for(let e=0;e<192;e++)for(let t=0;t<48;t++){let n=e*49+t,r=(e+1)*49+t;f.set([n,r,n+1,n+1,r,r+1],p),p+=6}let m=c.gpu.createBuffer({size:f.byteLength,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0});new Uint16Array(m.getMappedRange()).set(f),m.unmap();let h=e(c,{shader:a,geometry:{indexBuffer:m,indexCount:f.length,indexFormat:`uint16`},cull:`none`,set:{params:d},label:`Living Signal / indexed parametric mesh`}),g=e(c,{shader:o,vertices:6,instances:640,blend:`additive`,depth:{write:!1,compare:`less-equal`},set:{params:d},label:`Living Signal / orbit trails`}),_=t(c,s,{set:{params:d,scene:u.color,linear:r(c,{minFilter:`linear`,magFilter:`linear`})},label:`Living Signal / bloom & energy`});return await h.compile(u),await g.compile(u),await _.compile({colors:[navigator.gpu.getPreferredCanvasFormat()]}),{resize(){u.resize(l.size),_.set({scene:u.color})},render(e){let t={...d,...e,resolution:l.size};h.set({params:t}),g.set({params:t}),_.set({params:t}),n(c,e=>{e.pass({target:u,clear:[0,0,0,0]},e=>{e.draw(h),e.draw(g)}),e.pass(l,_)})}}}export{c as createSignalRenderer};