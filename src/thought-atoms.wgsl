struct Params{resolution:vec2f,time:f32,age:f32,strength:f32}
@group(0) @binding(0) var<uniform> params:Params;
fn hash(n:f32)->f32{return fract(sin(n*127.1+311.7)*43758.5453);}
struct Out{@builtin(position) position:vec4f,@location(0) uv:vec2f,@location(1) color:vec3f,@location(2) alpha:f32}
@vertex fn vs_main(@builtin(vertex_index) vi:u32,@builtin(instance_index) ii:u32)->Out{
 let id=f32(ii);let a=hash(id+1.);let b=hash(id+19.);let c=hash(id+57.);
 let age=max(0.,params.age);let burst=1.-exp(-age*7.);
 let chaos=vec2f(a-.5,b-.5)*vec2f(2.15,1.85);
 let jitter=vec2f(sin(age*(3.+c*5.)+a*40.),cos(age*(4.+a*4.)+b*40.))*.055;
 let u=hash(id+107.);let lane=floor(c*7.);
 // Seven narrow flowing filaments: order emerges from the scattered field.
 let pattern=vec2f((u-.5)*1.9,sin(u*10.+lane*.8)*.16+(lane-3.)*.10+(b-.5)*.016);
 let gather=smoothstep(.8,2.8,age);let dissolve=smoothstep(3.6,6.,age);
 var p=mix(chaos*burst+jitter*(1.-gather),pattern,gather);
 p+=normalize(chaos+vec2f(.001))*dissolve*dissolve*.4;
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 var out:Out;out.uv=corners[vi];
 out.position=vec4f(p+out.uv/params.resolution,0.,1.);
 out.color=mix(vec3f(.38,.78,1.),vec3f(.86,.73,1.),a);
 let side=.25+.75*smoothstep(.1,.5,abs(p.x));
 out.alpha=(.12+c*.32)*smoothstep(0.,.12,age)*(1.-dissolve)*params.strength*side;
 return out;
}
@fragment fn fs_main(in:Out)->@location(0) vec4f{
 let d=dot(in.uv,in.uv);if(d>1.){discard;}
 let alpha=(1.-smoothstep(.15,1.,d))*in.alpha;
 return vec4f(in.color*alpha,alpha);
}
