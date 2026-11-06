import type React from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Authentic OriginKit CloudSky (preset=base) WebGL GLSL shader, adapted for
 * frame-deterministic Remotion rendering (zero requestAnimationFrame drift).
 *
 * Reference: https://www.originkit.dev/components/cloud-sky?preset=base
 */
const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uNearX, uFarX, uCirrusX;
uniform float uCoverage, uSize, uSoftness, uShadow, uCirrus;
uniform vec3 uZenith, uHorizon, uCloud;
uniform vec4 uGlow;
uniform vec2 uSun;
uniform vec2 uParallax;

vec2 hash22(vec2 p){
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}

float hash12(vec2 p){
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float vnoise(vec2 x){
  vec2 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++){
    s += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

vec2 blobs(vec2 uv, float seed){
  vec2 id = floor(uv), f = fract(uv);
  float best = -1e4;
  float wsum = 0.0, ysum = 0.0;
  float wMax = min(2.150, 0.72 * uSize);
  float reach = min(2.0, ceil(wMax + 0.85) - 1.0);
  for (int j = -2; j <= 2; j++){
    for (int i = -2; i <= 2; i++){
      vec2 o = vec2(float(i), float(j));
      if (max(abs(o.x), abs(o.y)) > reach) continue;
      vec2 h = hash22(id + o + seed);
      if (fract(h.x * 37.1) > uCoverage) continue;
      vec2 c = o + 0.15 + h * 0.7;
      float w = min(2.150, (0.30 + 0.42 * fract(h.y * 19.7)) * uSize);
      vec2 d = f - c;
      float ry = (d.y > 0.0 ? 0.340 : 0.190) * uSize * (0.8 + 0.5 * fract(h.y * 7.3));
      float e = length(vec2(d.x / max(w, 1e-3), d.y / max(ry, 1e-3)));
      float val = 1.0 - e;
      float yN = d.y / max(ry, 1e-3);
      if (val > best){
        float k = exp(12.0 * (best - val));
        wsum = wsum * k + 1.0;
        ysum = ysum * k + yN;
        best = val;
      } else {
        float g = exp(12.0 * (val - best));
        wsum += g;
        ysum += g * yN;
      }
    }
  }
  return vec2(best, ysum / max(wsum, 1e-4));
}

vec2 cloudField(vec2 uv, float seed, float detailScale){
  vec2 b = blobs(uv, seed);
  float n = fbm(uv * detailScale + seed * 3.1) * 0.72
          + fbm(uv * detailScale * 3.3 + seed * 7.7) * 0.28;
  return vec2(b.x - (1.0 - n) * 0.700, b.y);
}

vec3 shadeCloud(float dyNorm, vec3 sky){
  float t = smoothstep(-0.95, 0.25, dyNorm);
  vec3 base = mix(uCloud * 0.52, sky, 0.34);
  return mix(mix(uCloud, base, uShadow), uCloud, t);
}

void main(){
  vec2 frag = gl_FragCoord.xy / max(uRes.y, 1.0);
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = vec2(frag.x, frag.y);

  vec3 sky = mix(uHorizon, uZenith, smoothstep(-0.15, 1.05, p.y));
  vec2 sunP = vec2(uSun.x * aspect, uSun.y);
  float sd = length(p - sunP);
  sky += uGlow.rgb * uGlow.a * exp(-sd * 3.4) * 0.30;

  vec3 col = sky;

  if (uCirrus > 0.0) {
    vec2 cuv = vec2(p.x * 1.4 + uCirrusX, p.y * 5.5);
    float veil = fbm(cuv) * fbm(cuv * 2.3 + 9.0);
    veil = smoothstep(0.24, 0.55, veil) * smoothstep(0.15, 0.7, p.y);
    col = mix(col, uCloud, veil * uCirrus * 0.5);
  }

  vec2 fuv = vec2(p.x + uFarX, p.y) * 2.150 + uParallax * 0.4;
  vec2 fd = cloudField(fuv, 17.0, 11.0);
  float fa = clamp(fd.x * uSoftness, 0.0, 1.0);
  if (fa > 0.0) {
    vec3 lit = shadeCloud(fd.y, sky);
    col = mix(col, mix(lit, sky, 0.550), fa);
  }

  vec2 nuv = vec2(p.x + uNearX, p.y) * 1.050 + uParallax;
  vec2 nd = cloudField(nuv, 3.0, 8.5);
  float na = clamp(nd.x * uSoftness, 0.0, 1.0);
  if (na > 0.0) {
    vec3 lit = shadeCloud(nd.y, sky);
    float above = clamp(cloudField(nuv + vec2(0.0, 0.085), 3.0, 8.5).x * uSoftness, 0.0, 1.0);
    lit *= 1.0 - 0.18 * uShadow * above;
    lit += uGlow.rgb * uGlow.a * 0.22 * exp(-length(p - sunP) * 1.6);
    col = mix(col, lit, na);
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

export interface CloudSkyBackdropProps {
  windSpeed?: number;
  sunGlow?: number;
  cloudDensity?: number;
  seedOffset?: number;
  zenith?: readonly [number, number, number];
  horizon?: readonly [number, number, number];
}

interface GlState {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export const CloudSkyBackdrop: React.FC<CloudSkyBackdropProps> = ({
  windSpeed = 1.15,
  sunGlow = 0.92,
  cloudDensity = 0.68,
  seedOffset = 4.2,
  // OriginKit preset=base rich azure zenith -> soft sky horizon
  zenith = [0.06, 0.48, 0.98],
  horizon = [0.71, 0.84, 0.96],
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glStateRef = useRef<GlState | null>(null);

  const ensureGl = (): GlState | null => {
    if (glStateRef.current) return glStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) return null;
    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const names = [
      "uRes",
      "uNearX",
      "uFarX",
      "uCirrusX",
      "uCoverage",
      "uSize",
      "uSoftness",
      "uShadow",
      "uCirrus",
      "uSun",
      "uParallax",
      "uZenith",
      "uHorizon",
      "uCloud",
      "uGlow",
    ];
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const n of names) uniforms[n] = gl.getUniformLocation(program, n);
    glStateRef.current = { gl, program, uniforms };
    return glStateRef.current;
  };

  const drawFrame = () => {
    const state = ensureGl();
    if (!state) return;
    const { gl, program, uniforms } = state;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.useProgram(program);
    gl.viewport(0, 0, width, height);

    const t = frame / Math.max(1, fps);
    const speed = 2.0 * windSpeed;
    const nearX = (seedOffset - 0.055 * speed * t) % 1000;
    const farX = (seedOffset * 0.55 - 0.026 * speed * t) % 1000;
    const cirrusX = (seedOffset * 0.25 - 0.014 * speed * t) % 1000;

    // Gentle camera drift parallax across the sky
    const px = Math.sin(t * 0.28) * 0.025;
    const py = Math.cos(t * 0.22) * 0.015;

    gl.uniform2f(uniforms.uRes, width, height);
    gl.uniform1f(uniforms.uNearX, nearX);
    gl.uniform1f(uniforms.uFarX, farX);
    gl.uniform1f(uniforms.uCirrusX, cirrusX);
    gl.uniform1f(uniforms.uCoverage, Math.max(0.2, Math.min(1, cloudDensity)));
    gl.uniform1f(uniforms.uSize, 1.28);
    gl.uniform1f(uniforms.uSoftness, 4.5 / 1.65);
    gl.uniform1f(uniforms.uShadow, 0.76);
    gl.uniform1f(uniforms.uCirrus, 0.58);
    gl.uniform2f(uniforms.uSun, 0.78, 0.90);
    gl.uniform2f(uniforms.uParallax, px, py);
    gl.uniform3f(uniforms.uZenith, zenith[0], zenith[1], zenith[2]);
    gl.uniform3f(uniforms.uHorizon, horizon[0], horizon[1], horizon[2]);
    gl.uniform3f(uniforms.uCloud, 1.0, 1.0, 1.0);
    gl.uniform4f(uniforms.uGlow, 0.92, 0.96, 1.0, Math.min(1, sunGlow));

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.flush();
  };

  useLayoutEffect(() => {
    drawFrame();
  });

  useEffect(() => {
    drawFrame();
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0f7aff 0%, #7cb8f2 58%, #b5d6f5 100%)",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </AbsoluteFill>
  );
};

export default CloudSkyBackdrop;
