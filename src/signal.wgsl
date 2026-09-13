struct Params { resolution: vec2f, pointer: vec2f, time: f32, energy: f32, presence: f32, pulse: f32, rotation: vec2f }
@group(0) @binding(0) var<uniform> params: Params;
const TAU = 6.283185307;
fn turn(p: vec2f, a: f32) -> vec2f { return mat2x2f(cos(a), sin(a), -sin(a), cos(a)) * p; }
fn position(a: f32, b: f32) -> vec3f {
  let t = params.time;
  let evolve = 0.55 + 0.45 * sin(t * 0.25);
  let radius = 0.80 + 0.17 * sin(a * 3.0 + t * 0.50) * evolve + 0.065 * sin(a * 2.0 - t * 0.38);
  let height = 0.18 * sin(a * 2.0 + t * 0.5) + 0.10 * cos(a * 3.0 - t * 0.35);
  let thickness = 0.25 + 0.045 * sin(a * 3.0 - t * 0.75);
  let crossSection = turn(vec2f(cos(b), sin(b) * (0.65 + 0.15 * cos(a * 2.0 + t * 0.4))) * thickness, a + sin(t * 0.35));
  let p = vec3f((radius + crossSection.x) * cos(a), (radius + crossSection.x) * sin(a), height + crossSection.y);
  let yz = turn(p.yz, -0.75 - sin(t * 0.3) * 0.28 + params.pointer.y * 0.5 + params.rotation.y);
  let xz = turn(vec2f(p.x, yz.y), params.rotation.x);
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
