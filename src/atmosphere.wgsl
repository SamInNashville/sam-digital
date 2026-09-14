struct Params{resolution:vec2f,time:f32,activity:f32}
@group(0) @binding(0) var<uniform> params:Params;
fn hash(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn noise(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2f(1,0)),u.x),mix(hash(i+vec2f(0,1)),hash(i+vec2f(1,1)),u.x),u.y);}
fn fbm(input:vec2f)->f32{var p=input;var v=0.;var a=.5;for(var i=0;i<4;i++){v+=a*noise(p);p=vec2f(p.x*.8-p.y*.6,p.x*.6+p.y*.8)*2.03+7.3;a*=.5;}return v;}
fn node(i:f32)->vec2f{let col=i%6.;let row=floor(i/6.);return vec2f(.06+col*.178,.06+row*.22)+vec2f(sin(i*17.2),cos(i*12.4))*.048;}
fn edge(p:vec2f,a:vec2f,b:vec2f,t:f32,phase:f32)->vec3f{
 let ab=b-a;let h=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.);let d=length(p-a-ab*h);
 let base=exp(-d*380.)*.065;
 let travel=fract(t*.22+phase);let packet=exp(-pow((h-travel)*19.,2.));
 let signal=packet*(exp(-d*700.)*.9+exp(-d*130.)*.18);
 let joint=exp(-length(p-a)*650.)*.5+exp(-length(p-a)*120.)*.08;
 return vec3f(.40,.86,.94)*(base+signal)+vec3f(.80,.65,1.)*joint;
}
@fragment fn fs_main(@location(0) uv:vec2f)->@location(0) vec4f{
 let ratio=params.resolution.x/params.resolution.y;let p=vec2f(uv.x*ratio,uv.y);let t=params.time;
 let q=vec2f(fbm(p*2.5+vec2f(t*.018,-t*.026)),fbm(p*2.5+vec2f(4.7,-t*.02)));
 let fog=fbm(p*3.6+q*3.1+vec2f(-t*.018,t*.015));
 let veil=pow(fog,2.1);let strand=exp(-abs(fog-.51)*28.)*.045;
 let side=.3+.7*smoothstep(.08,.44,abs(uv.x-.5));
 var color=vec3f(.033,.048,.079)+vec3f(.075,.13,.16)*veil*side*2.0;
 color+=vec3f(.25,.17,.34)*pow(fbm(p*2.1-q*1.8+3.7),3.)*side*.55;
 color+=vec3f(.24,.36,.39)*strand*side;
 if(params.activity>.001){
  var synapses=vec3f(0);
  for(var i=0;i<24;i++){
   let id=f32(i);let a=node(id);let b=node(id+6.);synapses+=edge(p,vec2f(a.x*ratio,a.y),vec2f(b.x*ratio,b.y),t,id*.137);
   if(i%6<5 && i%2==0){let c=node(id+1.);synapses+=edge(p,vec2f(a.x*ratio,a.y),vec2f(c.x*ratio,c.y),t,id*.173);}
  }
  color+=synapses*params.activity*(.3+.7*side);
 }
 return vec4f(color,1.);
}
