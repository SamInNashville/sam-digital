struct Params { resolution: vec2f, pointer: vec2f, time: f32, energy: f32, presence: f32, pulse: f32, rotation: vec2f }
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
