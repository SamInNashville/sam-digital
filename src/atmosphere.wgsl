struct Params{resolution:vec2f,time:f32,activity:f32}
@group(0) @binding(0) var<uniform> params:Params;
fn hash(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn noise(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2f(1,0)),u.x),mix(hash(i+vec2f(0,1)),hash(i+vec2f(1,1)),u.x),u.y);}
fn fbm(input:vec2f)->f32{var p=input;var v=0.;var a=.5;for(var i=0;i<4;i++){v+=a*noise(p);p=vec2f(p.x*.8-p.y*.6,p.x*.6+p.y*.8)*2.03+7.3;a*=.5;}return v;}
// Jittered local network: dense coverage without evaluating every edge at every pixel.
const NETWORK_SCALE:f32=9.;
fn node(cell:vec2f)->vec2f{return (cell+vec2f(.15)+vec2f(hash(cell+19.7),hash(cell+71.3))*.7)/NETWORK_SCALE;}
fn edge(p:vec2f,a:vec2f,b:vec2f,t:f32,seed:f32)->vec3f{
 let ab=b-a;let h=clamp(dot(p-a,ab)/max(dot(ab,ab),.000001),0.,1.);let d=length(p-a-ab*h);
 let clock=t*(.35+seed*.85)+seed*31.;let cycle=floor(clock);let phase=fract(clock);
 let roll=hash(vec2f(seed*93.,cycle));let travel=select(phase,1.-phase,roll>.5);
 let firing=smoothstep(.02,.12,phase)*(1.-smoothstep(.86,1.,phase))*step(.22,hash(vec2f(cycle+9.,seed*157.)));
 let packet=exp(-pow((h-travel)*14.,2.))*firing;
 let signal=packet*(exp(-d*850.)*.65+exp(-d*170.)*.10);
 let joint=exp(-length(p-a)*700.)*(.025+packet*.35);
 let tint=mix(vec3f(.32,.82,.94),vec3f(.75,.52,1.),seed);
 return tint*(exp(-d*450.)*.014+signal)+vec3f(.65,.9,1.)*joint;
}
@fragment fn fs_main(@location(0) uv:vec2f)->@location(0) vec4f{
 let ratio=params.resolution.x/params.resolution.y;let p=vec2f(uv.x*ratio,uv.y);let t=params.time;
 // Exactly twice the previous smoke time; firing has its own independent clock.
 let smokeTime=t*2.;
 let q=vec2f(fbm(p*2.5+vec2f(smokeTime*.018,-smokeTime*.026)),fbm(p*2.5+vec2f(4.7,-smokeTime*.02)));
 let fog=fbm(p*3.6+q*3.1+vec2f(-smokeTime*.018,smokeTime*.015));
 let veil=pow(fog,2.1);let strand=exp(-abs(fog-.51)*28.)*.045;
 let side=.3+.7*smoothstep(.08,.44,abs(uv.x-.5));
 var color=vec3f(.033,.048,.079)+vec3f(.075,.13,.16)*veil*side*2.0;
 color+=vec3f(.25,.17,.34)*pow(fbm(p*2.1-q*1.8+3.7),3.)*side*.55;
 color+=vec3f(.24,.36,.39)*strand*side;
 if(params.activity>.001){
  var synapses=vec3f(0);let home=floor(p*NETWORK_SCALE);
  for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
   let cell=home+vec2f(f32(x),f32(y));let a=node(cell);
   synapses+=edge(p,a,node(cell+vec2f(1,0)),t,hash(cell+3.1));
   synapses+=edge(p,a,node(cell+vec2f(0,1)),t,hash(cell+8.7));
   let diagonal=select(-1.,1.,hash(cell+14.)>.5);
   synapses+=edge(p,a,node(cell+vec2f(diagonal,1)),t,hash(cell+27.2));
  }}
  color+=synapses*params.activity*(.3+.7*side);
 }
 return vec4f(color,1.);
}
