struct Params { resolution: vec2f, pointer: vec2f, time: f32 }
@group(0) @binding(0) var<uniform> params: Params;
fn turn(p: vec2f, a: f32) -> vec2f {
  return mat2x2f(cos(a), sin(a), -sin(a), cos(a)) * p;
}
fn local(p: vec3f) -> vec3f {
  let xy = turn(p.xy, -0.38 + params.pointer.x * 0.12);
  let yz = turn(vec2f(xy.y, p.z), 0.83 + params.pointer.y * 0.10);
  return vec3f(xy.x, yz.x, yz.y);
}
fn field(p: vec3f) -> f32 {
  let q = local(p);
  let a = atan2(q.y, q.x);
  let wave = sin(a * 3.0 + params.time * 0.25) * 0.045;
  return length(vec2f(length(q.xy) - 0.90, q.z)) - (0.34 + wave);
}
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let pos = (uv - 0.5) * vec2f(params.resolution.x / params.resolution.y, 1.0);
  let ro = vec3f(0.0, 0.0, 4.4);
  let rd = normalize(vec3f(pos.x * 3.6, -pos.y * 3.6, -4.4));
  var t = 0.0;
  var hit = false;
  for (var i = 0; i < 64; i++) {
    let d = field(ro + rd * t);
    if (d < 0.0015) { hit = true; break; }
    t += d * 0.85;
    if (t > 7.0) { break; }
  }
  let bg = vec3f(0.07843, 0.08627, 0.07451);
  var color = bg + vec3f(0.047, 0.026, 0.009) * exp(-length(pos) * 5.0);
  if (hit) {
    let p = ro + rd * t;
    let e = 0.002;
    let n = normalize(vec3f(field(p + vec3f(e,0,0)) - field(p - vec3f(e,0,0)), field(p + vec3f(0,e,0)) - field(p - vec3f(0,e,0)), field(p + vec3f(0,0,e)) - field(p - vec3f(0,0,e))));
    let q = local(p);
    let a = atan2(q.y, q.x);
    let b = atan2(q.z, length(q.xy) - 0.90);
    let ribs = pow(0.5 + 0.5 * cos(a * 100.0 + b * 2.0 - params.time * 0.12), 4.0);
    let l = normalize(vec3f(-2.0, 3.0, 4.0));
    let light = max(dot(n,l), 0.0);
    let spec = pow(max(dot(n, normalize(l-rd)),0.0), 55.0);
    let rim = pow(1.0 - max(dot(n, -rd),0.0), 3.0);
    let copper = mix(vec3f(0.22,0.115,0.063), vec3f(0.86,0.56,0.32), ribs);
    color = copper * (0.22 + 0.9 * light) + vec3f(1.0,0.85,0.65) * spec * (0.25 + ribs * 0.75) + vec3f(0.32,0.20,0.09) * rim;
    color += vec3f(0.12,0.08,0.035) * max(dot(n,normalize(vec3f(2.0,-1.0,1.0))),0.0);
  }
  let vignette = smoothstep(0.40, 0.66, length(pos));
  return vec4f(mix(color, bg, vignette), 1.0);
}
