/*
 * Side Rays: vanilla WebGL port of React Bits "Side Rays"
 * (https://reactbits.dev/backgrounds/side-rays), Copyright (c) 2026 David Haz.
 * Licensed under MIT + Commons Clause (use in a website permitted; the component itself must
 * not be sold or redistributed). Shader unchanged; React/OGL wrapper replaced.
 *
 * Site rules: started after the first interaction (fx.ts), never under reduced motion, skipped on
 * software-rendered WebGL, paused while off-screen or the tab is hidden, 30 fps on touch devices.
 */
const VERTEX = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

export interface SideRaysOptions {
  rayColor1?: string;
  rayColor2?: string;
  speed?: number;
  intensity?: number;
  spread?: number;
  origin?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  tilt?: number;
  saturation?: number;
  blend?: number;
  falloff?: number;
  opacity?: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const FLIP: Record<string, [number, number]> = {
  'top-right': [0, 0],
  'top-left': [1, 0],
  'bottom-right': [0, 1],
  'bottom-left': [1, 1],
};

/** CPU-emulated WebGL (no GPU) would stutter and block the main thread: keep the static background. */
function isSoftwareRenderer(gl: WebGLRenderingContext): boolean {
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  return /swiftshader|llvmpipe|software|basic render/i.test(name);
}

export function mountSideRays(canvas: HTMLCanvasElement, o: SideRaysOptions): () => void {
  // premultiplied: the shader's rgb never exceeds its alpha, so light only ever ADDS to the page
  // (straight alpha made faint ray edges darken the cream background into a grey haze)
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
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

  const buf = gl.createBuffer(); // one oversized triangle covers the viewport
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const [flipX, flipY] = FLIP[o.origin ?? 'top-right'];
  gl.uniform1f(u('iSpeed'), o.speed ?? 2.5);
  gl.uniform3fv(u('iRayColor1'), hexToRgb(o.rayColor1 ?? '#EAB308'));
  gl.uniform3fv(u('iRayColor2'), hexToRgb(o.rayColor2 ?? '#96c8ff'));
  gl.uniform1f(u('iIntensity'), o.intensity ?? 2);
  gl.uniform1f(u('iSpread'), o.spread ?? 2);
  gl.uniform1f(u('iFlipX'), flipX);
  gl.uniform1f(u('iFlipY'), flipY);
  gl.uniform1f(u('iTilt'), o.tilt ?? 0);
  gl.uniform1f(u('iSaturation'), o.saturation ?? 1.5);
  gl.uniform1f(u('iBlend'), o.blend ?? 0.75);
  gl.uniform1f(u('iFalloff'), o.falloff ?? 1.6);
  gl.uniform1f(u('iOpacity'), o.opacity ?? 1);
  const uRes = u('iResolution');
  const uTime = u('iTime');

  const touch = matchMedia('(pointer: coarse)').matches;
  const dpr = Math.min(devicePixelRatio || 1, touch ? 1 : 1.5);
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let visible = true;
  let raf = 0;
  let lastFrame = 0;
  const minFrame = touch ? 1000 / 30 : 0;
  const tick = (t: number) => {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame(tick);
    if (t - lastFrame < minFrame) return;
    lastFrame = t;
    gl.uniform1f(uTime, t * 0.001);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) tick(performance.now()); });
  io.observe(canvas);
  const onVis = () => !document.hidden && tick(performance.now());
  document.addEventListener('visibilitychange', onVis);
  canvas.classList.add('is-live');
  tick(performance.now());

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
  };
}
