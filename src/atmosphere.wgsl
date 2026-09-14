struct Params{resolution:vec2f,time:f32,activity:f32}
@group(0) @binding(0) var<uniform> params:Params;
fn hash(p:vec2f)->f32{return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453);}
fn noise(p:vec2f)->f32{let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2f(1,0)),u.x),mix(hash(i+vec2f(0,1)),hash(i+vec2f(1,1)),u.x),u.y);}
fn fbm(input:vec2f)->f32{var p=input;var v=0.;var a=.5;for(var i=0;i<4;i++){v+=a*noise(p);p=vec2f(p.x*.8-p.y*.6,p.x*.6+p.y*.8)*2.03+7.3;a*=.5;}return v;}
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
 return vec4f(color,1.);
}
