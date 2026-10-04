/*
 * Ferrofluid background: vanilla WebGL port of React Bits "Ferrofluid"
 * (https://reactbits.dev/backgrounds/ferrofluid), Copyright (c) 2026 David Haz.
 * Licensed under MIT + Commons Clause (use in a website permitted; the component itself must
 * not be sold or redistributed). Shader unchanged; React/OGL wrapper replaced.
 *
 * Site rules: started on idle, never under reduced motion, paused while off-screen or the tab is
 * hidden, lower resolution + 30 fps on touch devices so it never costs the performance gate.
 */
const VERTEX = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uMouseColor;
uniform vec2  uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

#define PI 3.14159265

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

float hash(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float r = exp2(-a / k) + exp2(-b / k);
  return -k * log2(r);
}

float sinlerp(float a, float b, float w) {
  return mix(a, b, (sin(w * PI - PI / 2.0) + 1.0) / 2.0);
}

float vn(vec2 p, float s, float seed) {
  vec2 cellp = floor(p / s);
  vec2 relp = mod(p, s);
  float g1 = hash(vec3(cellp, seed));
  float g2 = hash(vec3(cellp.x + 1.0, cellp.y, seed));
  float g3 = hash(vec3(cellp.x + 1.0, cellp.y + 1.0, seed));
  float g4 = hash(vec3(cellp.x, cellp.y + 1.0, seed));
  float bx = sinlerp(g1, g2, relp.x / s);
  float tx = sinlerp(g4, g3, relp.x / s);
  return sinlerp(bx, tx, relp.y / s);
}

float dbn(vec2 p, float s, float seed) {
  float o = s / 2.0;
  float n0 = vn(p, s, seed);
  float n1 = vn(p + vec2(o, o), s, seed + 0.1);
  float n2 = vn(p + vec2(-o, o), s, seed + 0.2);
  float n3 = vn(p + vec2(o, -o), s, seed + 0.3);
  float n4 = vn(p + vec2(-o, -o), s, seed + 0.4);
  return (2.0 * n0 + 1.5 * n1 + 1.25 * n2 + 1.125 * n3 + n4) / 7.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float ref = 700.0 / max(uScale, 0.05);
  vec2 p = fragCoord / iResolution.y * ref;

  float spd = 200.0 * uSpeed;
  float t = iTime;

  vec2 dir = uFlow;
  vec2 perp = vec2(-dir.y, dir.x);

  float distort1 = vn(p + perp * (t * spd), 60.0, 10.0) * 50.0 * uTurbulence;
  float distort2 = vn(p - perp * (t * spd), 120.0, 15.0) * 100.0 * uTurbulence;

  float peaks = dbn(p + distort1 + dir * (t * spd * 0.5), 40.0, 1.0);
  float peaks2 = dbn(p + distort2 - dir * (t * spd * 0.5), 40.0, 0.0);

  float mapeaks = smin(peaks, peaks2, max(uFluidity, 0.001));

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mp = iMouse / iResolution.y * ref;
    float md = length(p - mp) / ref;
    float rr = max(uMouseRadius, 0.02);
    mGlow = exp(-md * md / (rr * rr)) * uMouseStrength;
  }

  float band = (uRimWidth - abs((mapeaks - 0.4) * 2.0)) * 5.0;
  float ltn = clamp(band - vn(p + dir * (t * spd * 0.5), 60.0, 12.0) * uShimmer, 0.0, 1.0);
  ltn = pow(ltn, uSharpness) * uGlow;
  ltn *= clamp(1.0 - mGlow, 0.0, 1.0);

  float h = clamp(0.5 + (peaks - peaks2) * 0.8, 0.0, 1.0);
  vec3 col = palette(h);

  vec3 outc = col * ltn;
  float a = clamp(max(outc.r, max(outc.g, outc.b)), 0.0, 1.0);
  fragColor = vec4(outc, a * uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

export interface FerrofluidOptions {
  colors: string[];
  speed?: number;
  scale?: number;
  turbulence?: number;
  fluidity?: number;
  rimWidth?: number;
  sharpness?: number;
  shimmer?: number;
  glow?: number;
  opacity?: number;
  flow?: [number, number];
  mouseStrength?: number;
  mouseRadius?: number;
}

const hexToRGB = (hex: string): [number, number, number] => {
  const c = hex.replace('#', '').padEnd(6, '0');
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255) as [number, number, number];
};

/** CPU-emulated WebGL (no GPU) would stutter and block the main thread: keep the static background. */
function isSoftwareRenderer(gl: WebGLRenderingContext): boolean {
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  return /swiftshader|llvmpipe|software|basic render/i.test(name);
}

export function mountFerrofluid(canvas: HTMLCanvasElement, area: HTMLElement, o: FerrofluidOptions): () => void {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl || isSoftwareRenderer(gl)) return () => {};

  const compile = (type: number, code: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, code);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
    return sh;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // one oversized triangle covers the viewport
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const cols = o.colors.slice(0, 8).map(hexToRGB);
  for (let i = 0; i < 8; i++) gl.uniform3fv(u(`uColor${i}`), cols[Math.min(i, cols.length - 1)]);
  gl.uniform1i(u('uColorCount'), cols.length);
  const avg = [0, 1, 2].map((k) => cols.reduce((a, c) => a + c[k], 0) / cols.length);
  gl.uniform3fv(u('uMouseColor'), avg);
  gl.uniform2fv(u('uFlow'), o.flow ?? [0, -1]);
  gl.uniform1f(u('uSpeed'), o.speed ?? 0.5);
  gl.uniform1f(u('uScale'), o.scale ?? 1.6);
  gl.uniform1f(u('uTurbulence'), o.turbulence ?? 1);
  gl.uniform1f(u('uFluidity'), o.fluidity ?? 0.1);
  gl.uniform1f(u('uRimWidth'), o.rimWidth ?? 0.2);
  gl.uniform1f(u('uSharpness'), o.sharpness ?? 2.5);
  gl.uniform1f(u('uShimmer'), o.shimmer ?? 1.5);
  gl.uniform1f(u('uGlow'), o.glow ?? 2);
  gl.uniform1f(u('uOpacity'), o.opacity ?? 1);
  gl.uniform1f(u('uMouseEnabled'), 1);
  gl.uniform1f(u('uMouseStrength'), o.mouseStrength ?? 1);
  gl.uniform1f(u('uMouseRadius'), o.mouseRadius ?? 0.35);
  const uRes = u('iResolution');
  const uTime = u('iTime');
  const uMouse = u('iMouse');

  const touch = matchMedia('(pointer: coarse)').matches;
  const scaleDpr = Math.min(devicePixelRatio || 1, 1) * (touch ? 0.6 : 1);
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * scaleDpr));
    canvas.height = Math.max(1, Math.round(r.height * scaleDpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform3f(uRes, canvas.width, canvas.height, 1);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const mouse = [-9999, -9999];
  const target = [-9999, -9999];
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    target[0] = (e.clientX - r.left) * scaleDpr;
    target[1] = (r.height - (e.clientY - r.top)) * scaleDpr;
    if (mouse[0] < -9000) { mouse[0] = target[0]; mouse[1] = target[1]; }
  };
  area.addEventListener('pointermove', onMove, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) tick(performance.now()); });
  io.observe(canvas);

  let raf = 0;
  let last = 0;
  let lastFrame = 0;
  const minFrame = touch ? 1000 / 30 : 0;
  const tick = (t: number) => {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame(tick);
    if (t - lastFrame < minFrame) return;
    lastFrame = t;
    const dt = last ? (t - last) / 1000 : 0;
    last = t;
    const f = 1 - Math.exp(-dt / 0.15);
    mouse[0] += (target[0] - mouse[0]) * f;
    mouse[1] += (target[1] - mouse[1]) * f;
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.uniform1f(uTime, t * 0.001);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const onVis = () => !document.hidden && tick(performance.now());
  document.addEventListener('visibilitychange', onVis);
  canvas.classList.add('is-live');
  tick(performance.now());

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    area.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVis);
  };
}
