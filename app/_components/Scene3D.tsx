'use client';

import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Line, OrbitControls, Html, useTexture } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
  EffectComposer,
  Bloom,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { setConsoleFunction } from 'three';
import {
  generateTrajectoryPoints,
  getPositionAtProgress,
} from '../_lib/trajectory';

// ── Types ────────────────────────────────────────────────

export type CameraMode = 'follow' | 'earth' | 'moon' | 'overview' | 'free';

interface Scene3DProps {
  missionProgress: number;
  phaseIndex: number;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
}

// ── Constants ────────────────────────────────────────────

const EARTH_POS = new THREE.Vector3(0, 0, 0);
const MOON_POS = new THREE.Vector3(40, 0, 3); // flyby-time position (trajectory target)
// Full Moon geometry: Sun is behind Earth, opposite Moon direction.
// Moon orbit has ~5.14° inclination to ecliptic.
const MOON_DIR = new THREE.Vector3(40, 0, 3).normalize();
const SUN_DIR = MOON_DIR.clone().negate();
SUN_DIR.y += 0.08; // ecliptic offset
SUN_DIR.normalize();

// ── Orbital mechanics constants ─────────────────────────
const EARTH_SIDEREAL_DAY = 86164; // seconds per full rotation
const MOON_ORBITAL_PERIOD = 27.322 * 86400; // sidereal month in seconds
const MOON_ORBITAL_RADIUS = Math.sqrt(40 * 40 + 3 * 3); // ~40.11 scene units
const FLYBY_MET = 423000; // ~Day 5, approximate midpoint of flyby phase
const FLYBY_ANGLE = Math.atan2(3, 40); // orbital angle where Moon = (40, 0, 3)
const MOON_OMEGA = (2 * Math.PI) / MOON_ORBITAL_PERIOD; // rad/s
const MISSION_DURATION = 864000; // 10 days in seconds

function getMoonPosition(missionProgress: number): THREE.Vector3 {
  const metSeconds = missionProgress * MISSION_DURATION;
  // Moon arrives at FLYBY_ANGLE exactly when metSeconds = FLYBY_MET
  const angle = FLYBY_ANGLE + MOON_OMEGA * (metSeconds - FLYBY_MET);
  return new THREE.Vector3(
    MOON_ORBITAL_RADIUS * Math.cos(angle),
    0,
    MOON_ORBITAL_RADIUS * Math.sin(angle)
  );
}

// Suppress THREE.Clock deprecation from @react-three/fiber v9 internals.
// r3f creates new THREE.Clock() in its store; three.js r183+ deprecated it.
// Remove when r3f ships a stable release using THREE.Timer.
setConsoleFunction((type: string, message: string, ...args: unknown[]) => {
  if (
    type === 'warn' &&
    typeof message === 'string' &&
    message.includes('Clock')
  )
    return;
  (console as unknown as Record<string, Function>)[type](message, ...args);
});

// ── GLSL Noise ───────────────────────────────────────────

const SIMPLEX_NOISE_GLSL = /* glsl */ `
// Simplex 3D noise (Ashima Arts / Ian McEwan)
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`;

// ── Earth Shader Material ────────────────────────────────

const earthVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const earthFragmentShader = /* glsl */ `
${SIMPLEX_NOISE_GLSL}

uniform vec3 uSunDir;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // Spherical coordinates for noise sampling
  vec3 spherePos = normalize(vWorldPos) * 2.0;

  // ── Land mask (multi-octave noise) ──
  float continent = fbm(spherePos * 1.5 + vec3(3.7, 1.2, 0.8), 5);
  continent = smoothstep(-0.05, 0.15, continent);

  // ── Polar ice caps ──
  float latitude = abs(spherePos.y);
  float iceMask = smoothstep(1.3, 1.7, latitude);
  // Some ice at lower latitudes on land
  iceMask += smoothstep(1.0, 1.4, latitude) * continent * 0.5;
  iceMask = clamp(iceMask, 0.0, 1.0);

  // ── Ocean colors ──
  float oceanDepth = fbm(spherePos * 3.0 + vec3(10.0, 5.0, 2.0), 3) * 0.5 + 0.5;
  vec3 deepOcean = vec3(0.04, 0.24, 0.42);
  vec3 shallowOcean = vec3(0.10, 0.44, 0.63);
  vec3 oceanColor = mix(deepOcean, shallowOcean, oceanDepth);

  // ── Land colors ──
  float landDetail = fbm(spherePos * 4.0 + vec3(7.0, 3.0, 1.0), 4) * 0.5 + 0.5;
  float desertMask = smoothstep(0.3, 0.6, fbm(spherePos * 2.0 + vec3(20.0, 10.0, 5.0), 3) * 0.5 + 0.5);
  float tropicalMask = smoothstep(0.8, 0.3, latitude);
  vec3 forest = vec3(0.13, 0.35, 0.15);
  vec3 plains = vec3(0.28, 0.40, 0.18);
  vec3 desert = vec3(0.58, 0.48, 0.30);
  vec3 mountain = vec3(0.35, 0.30, 0.25);
  vec3 landColor = mix(forest, plains, landDetail);
  landColor = mix(landColor, desert, desertMask * (1.0 - tropicalMask * 0.5));
  landColor = mix(landColor, mountain, smoothstep(0.7, 0.9, landDetail));

  // ── Ice color ──
  vec3 iceColor = vec3(0.9, 0.93, 0.97);

  // ── Combine surface ──
  vec3 surfaceColor = mix(oceanColor, landColor, continent);
  surfaceColor = mix(surfaceColor, iceColor, iceMask);

  // ── Lighting ──
  float NdotL = dot(normal, uSunDir);
  float dayFactor = smoothstep(-0.15, 0.2, NdotL);

  // Diffuse
  vec3 dayColor = surfaceColor * (0.3 + 0.7 * max(0.0, NdotL));

  // Specular on oceans only
  vec3 halfVec = normalize(uSunDir + viewDir);
  float spec = pow(max(0.0, dot(normal, halfVec)), 80.0);
  dayColor += vec3(1.0, 0.95, 0.8) * spec * 0.5 * (1.0 - continent);

  // ── Terminator atmospheric reddening ──
  float terminatorBand = smoothstep(-0.15, 0.0, NdotL) * smoothstep(0.2, 0.05, NdotL);
  dayColor = mix(dayColor, dayColor * vec3(1.1, 0.7, 0.5), terminatorBand * 0.4);

  // ── Night side: city lights (HDR for bloom) ──
  float cityNoise = fbm(spherePos * 8.0 + vec3(50.0, 25.0, 12.0), 4);
  float cityMask = smoothstep(0.3, 0.6, cityNoise) * continent * (1.0 - iceMask);
  vec3 cityColor = vec3(1.0, 0.85, 0.5) * cityMask * 2.0;
  vec3 nightColor = surfaceColor * 0.02 + cityColor;

  // ── Final mix day/night ──
  vec3 finalColor = mix(nightColor, dayColor, dayFactor);

  // Fresnel rim
  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);
  finalColor += vec3(0.2, 0.5, 1.0) * fresnel * 0.2 * dayFactor;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// ── Atmosphere Shader ────────────────────────────────────

const atmosphereVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const atmosphereFragmentShader = /* glsl */ `
uniform vec3 uSunDir;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // Fresnel limb brightness
  float rim = 1.0 - max(0.0, dot(normal, viewDir));
  float fresnel = pow(rim, 3.0);

  // Sun alignment
  float sunDot = dot(normal, uSunDir);
  float sunFactor = smoothstep(-0.3, 0.5, sunDot);

  // Rayleigh scattering: blue at limb, orange/red at terminator
  vec3 rayleighBlue = vec3(0.15, 0.45, 1.0);
  vec3 rayleighOrange = vec3(1.0, 0.4, 0.1);

  // Terminator detection (grazing sun angle)
  float terminator = 1.0 - abs(sunDot);
  terminator = pow(terminator, 4.0) * smoothstep(-0.15, 0.15, sunDot);

  vec3 atmosColor = mix(rayleighBlue, rayleighOrange, terminator * 0.7);

  // HDR push for bloom
  atmosColor *= 1.3;

  float alpha = fresnel * (0.5 * sunFactor + 0.15 + terminator * 0.4) * 0.7;

  gl_FragColor = vec4(atmosColor, alpha);
}
`;

// ── Cloud Shader ─────────────────────────────────────────

const cloudVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const cloudFragmentShader = /* glsl */ `
${SIMPLEX_NOISE_GLSL}

uniform vec3 uSunDir;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 spherePos = normalize(vWorldPos) * 2.0;

  // Animated cloud noise (~67% coverage)
  float cloudNoise = fbm(spherePos * 2.5 + vec3(uTime * 0.01, 0.0, uTime * 0.005), 5);
  float cloudMask = smoothstep(0.0, 0.35, cloudNoise);

  float NdotL = dot(normal, uSunDir);
  float dayFactor = smoothstep(-0.1, 0.3, NdotL);

  vec3 cloudColor = vec3(1.0) * (0.4 + 0.6 * max(0.0, NdotL));
  float alpha = cloudMask * 0.45 * max(0.05, dayFactor);

  gl_FragColor = vec4(cloudColor, alpha);
}
`;

// ── Moon Shader ──────────────────────────────────────────

const moonVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const moonFragmentShader = /* glsl */ `
${SIMPLEX_NOISE_GLSL}

uniform vec3 uSunDir;
uniform vec3 uMoonCenter;
uniform vec3 uEarthDir;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 localDir = normalize(vWorldPos - uMoonCenter);
  vec3 localPos = localDir * 2.0;
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // ── Near-side vs far-side factor ──
  // +1 = Earth-facing (near side, maria-rich), -1 = far side (highlands)
  float nearSideFactor = dot(localDir, uEarthDir);

  // ── Base surface with variation ──
  float baseNoise = fbm(localPos * 3.0 + vec3(100.0, 50.0, 25.0), 4) * 0.5 + 0.5;
  vec3 highlands = mix(vec3(0.50, 0.48, 0.45), vec3(0.62, 0.60, 0.57), baseNoise);
  vec3 baseColor = highlands;

  // ── Dark maria — concentrated on near side ──
  float mariaNoise = fbm(localPos * 1.0 + vec3(200.0, 100.0, 50.0), 3);
  float mariaMask = smoothstep(-0.1, 0.3, mariaNoise) * smoothstep(0.0, 0.5, nearSideFactor);
  vec3 mariaColor = vec3(0.22, 0.21, 0.19);
  baseColor = mix(baseColor, mariaColor, mariaMask * 0.7);

  // ── Large craters ──
  float craterNoise = snoise(localPos * 12.0 + vec3(300.0, 150.0, 75.0));
  float craterRim = smoothstep(0.35, 0.45, craterNoise) - smoothstep(0.45, 0.55, craterNoise);
  float craterFloor = smoothstep(0.45, 0.55, craterNoise);
  baseColor += vec3(0.12) * craterRim;
  baseColor -= vec3(0.08) * craterFloor;

  // ── Medium craters ──
  float smallCrater = snoise(localPos * 25.0 + vec3(500.0, 250.0, 125.0));
  float smallRim = smoothstep(0.4, 0.48, smallCrater) - smoothstep(0.48, 0.56, smallCrater);
  baseColor += vec3(0.08) * smallRim;

  // ── Micro craters ──
  float microCrater = snoise(localPos * 50.0 + vec3(700.0, 350.0, 175.0));
  float microRim = smoothstep(0.42, 0.48, microCrater) - smoothstep(0.48, 0.54, microCrater);
  baseColor += vec3(0.05) * microRim;

  // ── Lighting ──
  float NdotL = max(0.0, dot(normal, uSunDir));
  vec3 litColor = baseColor * (0.06 + 0.94 * NdotL);

  gl_FragColor = vec4(litColor, 1.0);
}
`;

// ── Textured Earth Shader ────────────────────────────────

const texturedEarthVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const texturedEarthFragmentShader = /* glsl */ `
uniform sampler2D uDayMap;
uniform sampler2D uNightMap;
uniform vec3 uSunDir;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  vec3 dayColor = texture2D(uDayMap, vUv).rgb;
  vec3 nightColor = texture2D(uNightMap, vUv).rgb * 2.0;

  float NdotL = dot(normal, uSunDir);
  float dayFactor = smoothstep(-0.15, 0.2, NdotL);

  vec3 litDay = dayColor * (0.3 + 0.7 * max(0.0, NdotL));

  // Specular on oceans (darker areas of the day map)
  float oceanMask = 1.0 - smoothstep(0.1, 0.35, dot(dayColor, vec3(0.299, 0.587, 0.114)));
  vec3 halfVec = normalize(uSunDir + viewDir);
  float spec = pow(max(0.0, dot(normal, halfVec)), 80.0);
  litDay += vec3(1.0, 0.95, 0.8) * spec * 0.5 * oceanMask;

  // Terminator atmospheric reddening
  float terminatorBand = smoothstep(-0.15, 0.0, NdotL) * smoothstep(0.2, 0.05, NdotL);
  litDay = mix(litDay, litDay * vec3(1.1, 0.7, 0.5), terminatorBand * 0.4);

  vec3 finalColor = mix(nightColor, litDay, dayFactor);

  // Fresnel rim
  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);
  finalColor += vec3(0.2, 0.5, 1.0) * fresnel * 0.2 * dayFactor;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// ── Textured Moon Shader ─────────────────────────────────

const texturedMoonVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const texturedMoonFragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uSunDir;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 baseColor = texture2D(uMap, vUv).rgb;
  float NdotL = max(0.0, dot(normal, uSunDir));
  vec3 litColor = baseColor * (0.06 + 0.94 * NdotL);
  gl_FragColor = vec4(litColor, 1.0);
}
`;

// ── Burn phases (for engine glow) ────────────────────────

function isBurnPhase(phaseIndex: number): boolean {
  // 1=launch, 2=ICPS burns, 5=TLI
  return phaseIndex === 1 || phaseIndex === 2 || phaseIndex === 5;
}

// ── Main Component ───────────────────────────────────────

export default function Scene3D({
  missionProgress,
  phaseIndex,
  cameraMode,
  onCameraModeChange,
}: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 5, 12], fov: 55, near: 0.1, far: 500 }}
      style={{ background: 'transparent' }}
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
    >
      <hemisphereLight args={['#334466', '#0a0a18', 0.25]} />
      <directionalLight
        position={[SUN_DIR.x * 80, SUN_DIR.y * 80, SUN_DIR.z * 80]}
        intensity={2.0}
        color='#fff8f0'
      />

      <CustomStars />

      <EarthWithFallback missionProgress={missionProgress} />
      <MoonWithFallback missionProgress={missionProgress} />
      <MoonOrbitLine />
      <TrajectoryPath missionProgress={missionProgress} />
      <OrionCapsule missionProgress={missionProgress} phaseIndex={phaseIndex} />
      <CameraController
        missionProgress={missionProgress}
        cameraMode={cameraMode}
        onCameraModeChange={onCameraModeChange}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableDamping={true}
        dampingFactor={0.08}
        minDistance={1}
        maxDistance={200}
        autoRotate={false}
        makeDefault
      />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          mipmapBlur
          radius={0.8}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette
          offset={0.3}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </Canvas>
  );
}

// ── Custom Star Field ────────────────────────────────────

function CustomStars() {
  const { geometry, material } = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const starColors = [
      new THREE.Color(0.6, 0.7, 1.0), // O/B blue-white (rare)
      new THREE.Color(0.8, 0.85, 1.0), // A white
      new THREE.Color(1.0, 1.0, 0.9), // F/G yellow-white (Sun-like)
      new THREE.Color(1.0, 0.85, 0.6), // K orange
      new THREE.Color(1.0, 0.6, 0.4), // M red-orange
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 200 + Math.random() * 50;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Spectral type distribution: more dim red/orange than bright blue
      const roll = Math.random();
      let color: THREE.Color;
      if (roll < 0.02) color = starColors[0];
      else if (roll < 0.08) color = starColors[1];
      else if (roll < 0.25) color = starColors[2];
      else if (roll < 0.55) color = starColors[3];
      else color = starColors[4];

      // Brightness variation (power-law: many dim, few bright)
      const brightness = 0.3 + Math.pow(Math.random(), 3) * 1.5;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  return <points geometry={geometry} material={material} />;
}

// ── Earth ────────────────────────────────────────────────

function Earth({ missionProgress }: { missionProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const earthUniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR.clone() },
      uTime: { value: 0 },
    }),
    []
  );

  const atmosUniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR.clone() },
    }),
    []
  );

  const cloudUniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR.clone() },
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const metSeconds = missionProgress * MISSION_DURATION;
    const earthAngle = (metSeconds / EARTH_SIDEREAL_DAY) * Math.PI * 2;
    if (meshRef.current) meshRef.current.rotation.y = earthAngle;
    if (cloudRef.current) cloudRef.current.rotation.y = earthAngle * 1.03;
    earthUniforms.uTime.value = timeRef.current;
    cloudUniforms.uTime.value = timeRef.current;
  });

  return (
    <group position={[0, 0, 0]} rotation={[0, 0, -23.44 * (Math.PI / 180)]}>
      {/* Earth surface */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[3, 128, 128]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={earthUniforms}
        />
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[3.05, 96, 96]} />
        <shaderMaterial
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[3.25, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosUniforms}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere haze */}
      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial
          color='#4a9eff'
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Self-illumination glow */}
      <pointLight color='#1a4a8a' intensity={0.5} distance={8} />

      {/* Label */}
      <Html position={[0, -4, 0]} center>
        <div className='text-[10px] font-mono text-blue-300/60 whitespace-nowrap select-none pointer-events-none'>
          EARTH
        </div>
      </Html>
    </group>
  );
}

// ── Moon ─────────────────────────────────────────────────

function Moon({ missionProgress }: { missionProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const moonPos = getMoonPosition(missionProgress);

  const moonUniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR.clone() },
      uMoonCenter: { value: moonPos.clone() },
      uEarthDir: {
        value: new THREE.Vector3().subVectors(EARTH_POS, moonPos).normalize(),
      },
    }),
    []
  );

  // Update shader uniforms when Moon moves
  useFrame(() => {
    const pos = getMoonPosition(missionProgress);
    moonUniforms.uMoonCenter.value.copy(pos);
    moonUniforms.uEarthDir.value.subVectors(EARTH_POS, pos).normalize();
  });

  // Moon is tidally locked — no rotation

  return (
    <group position={[moonPos.x, moonPos.y, moonPos.z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.8, 64, 64]} />
        <shaderMaterial
          vertexShader={moonVertexShader}
          fragmentShader={moonFragmentShader}
          uniforms={moonUniforms}
        />
      </mesh>

      {/* Label */}
      <Html position={[0, -1.5, 0]} center>
        <div className='text-[10px] font-mono text-zinc-400/60 whitespace-nowrap select-none pointer-events-none'>
          MOON
        </div>
      </Html>
    </group>
  );
}

// ── Textured Earth (loaded when textures available) ──────

function TexturedEarth({ missionProgress }: { missionProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const [dayMap, nightMap, cloudMap] = useTexture([
    '/textures/earth_day.jpg',
    '/textures/earth_night.jpg',
    '/textures/earth_clouds.jpg',
  ]);

  // Flip textures for correct orientation
  dayMap.colorSpace = THREE.SRGBColorSpace;
  nightMap.colorSpace = THREE.SRGBColorSpace;
  cloudMap.colorSpace = THREE.SRGBColorSpace;

  const earthUniforms = useMemo(
    () => ({
      uDayMap: { value: dayMap },
      uNightMap: { value: nightMap },
      uSunDir: { value: SUN_DIR.clone() },
    }),
    [dayMap, nightMap]
  );

  const atmosUniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR.clone() },
    }),
    []
  );

  const cloudUniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR.clone() },
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const metSeconds = missionProgress * MISSION_DURATION;
    const earthAngle = (metSeconds / EARTH_SIDEREAL_DAY) * Math.PI * 2;
    if (meshRef.current) meshRef.current.rotation.y = earthAngle;
    if (cloudRef.current) cloudRef.current.rotation.y = earthAngle * 1.03;
    cloudUniforms.uTime.value = timeRef.current;
  });

  return (
    <group position={[0, 0, 0]} rotation={[0, 0, -23.44 * (Math.PI / 180)]}>
      {/* Earth surface with real textures */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[3, 128, 128]} />
        <shaderMaterial
          vertexShader={texturedEarthVertexShader}
          fragmentShader={texturedEarthFragmentShader}
          uniforms={earthUniforms}
        />
      </mesh>

      {/* Clouds — texture-based with transparency */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[3.05, 96, 96]} />
        <meshBasicMaterial
          map={cloudMap}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>

      {/* Atmosphere glow (keep procedural — looks great) */}
      <mesh>
        <sphereGeometry args={[3.25, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosUniforms}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial
          color='#4a9eff'
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>

      <pointLight color='#1a4a8a' intensity={0.5} distance={8} />

      <Html position={[0, -4, 0]} center>
        <div className='text-[10px] font-mono text-blue-300/60 whitespace-nowrap select-none pointer-events-none'>
          EARTH
        </div>
      </Html>
    </group>
  );
}

// ── Textured Moon (loaded when texture available) ────────

function TexturedMoon({ missionProgress }: { missionProgress: number }) {
  const [moonMap] = useTexture(['/textures/moon.jpg']);
  const moonPos = getMoonPosition(missionProgress);
  moonMap.colorSpace = THREE.SRGBColorSpace;

  const uniforms = useMemo(
    () => ({
      uMap: { value: moonMap },
      uSunDir: { value: SUN_DIR.clone() },
    }),
    [moonMap]
  );

  return (
    <group position={[moonPos.x, moonPos.y, moonPos.z]}>
      <mesh>
        <sphereGeometry args={[0.8, 64, 64]} />
        <shaderMaterial
          vertexShader={texturedMoonVertexShader}
          fragmentShader={texturedMoonFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      <Html position={[0, -1.5, 0]} center>
        <div className='text-[10px] font-mono text-zinc-400/60 whitespace-nowrap select-none pointer-events-none'>
          MOON
        </div>
      </Html>
    </group>
  );
}

// ── Earth/Moon wrappers with texture fallback ────────────

function EarthWithFallback({ missionProgress }: { missionProgress: number }) {
  const [hasTextures, setHasTextures] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/textures/earth_day.jpg', { method: 'HEAD' })
      .then((res) => setHasTextures(res.ok))
      .catch(() => setHasTextures(false));
  }, []);

  if (hasTextures) {
    return (
      <Suspense fallback={<Earth missionProgress={missionProgress} />}>
        <TexturedEarth missionProgress={missionProgress} />
      </Suspense>
    );
  }

  return <Earth missionProgress={missionProgress} />;
}

function MoonWithFallback({ missionProgress }: { missionProgress: number }) {
  const [hasTexture, setHasTexture] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/textures/moon.jpg', { method: 'HEAD' })
      .then((res) => setHasTexture(res.ok))
      .catch(() => setHasTexture(false));
  }, []);

  if (hasTexture) {
    return (
      <Suspense fallback={<Moon missionProgress={missionProgress} />}>
        <TexturedMoon missionProgress={missionProgress} />
      </Suspense>
    );
  }

  return <Moon missionProgress={missionProgress} />;
}

// ── Moon Orbit Line ──────────────────────────────────────

function MoonOrbitLine() {
  const points = useMemo(() => {
    const segments = 128;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push([
        MOON_ORBITAL_RADIUS * Math.cos(angle),
        0,
        MOON_ORBITAL_RADIUS * Math.sin(angle),
      ]);
    }
    return pts;
  }, []);

  return (
    <Line
      points={points}
      color="#ffffff"
      lineWidth={1}
      transparent
      opacity={0.06}
      dashed
      dashSize={1}
      gapSize={0.8}
    />
  );
}

// ── Trajectory Path ──────────────────────────────────────

function TrajectoryPath({ missionProgress }: { missionProgress: number }) {
  const points = useMemo(() => generateTrajectoryPoints(600), []);

  const linePoints = useMemo(
    () => points.map((p) => [p.x, p.y, p.z] as [number, number, number]),
    [points]
  );

  // Gradient colors: orange near Earth → blue in transit → purple near Moon
  const traveledColors = useMemo(() => {
    const splitIndex = Math.floor(missionProgress * (linePoints.length - 1));
    const traveled = linePoints.slice(0, splitIndex + 1);
    return traveled.map((_, i) => {
      const t = traveled.length > 1 ? i / (traveled.length - 1) : 0;
      const orange = new THREE.Color('#f97316');
      const blue = new THREE.Color('#3b82f6');
      const purple = new THREE.Color('#a855f7');
      if (t < 0.5) {
        return orange.clone().lerp(blue, t * 2);
      }
      return blue.clone().lerp(purple, (t - 0.5) * 2);
    });
  }, [missionProgress, linePoints]);

  const splitIndex = Math.floor(missionProgress * (linePoints.length - 1));
  const traveledPoints = linePoints.slice(0, splitIndex + 1);
  const remainingPoints = linePoints.slice(splitIndex);

  return (
    <>
      {traveledPoints.length >= 2 && (
        <>
          {/* Glow line (wider, HDR colors for bloom) */}
          <Line
            points={traveledPoints}
            vertexColors={traveledColors.map(
              (c) => [c.r * 2, c.g * 2, c.b * 2] as [number, number, number]
            )}
            lineWidth={4}
            transparent
            opacity={0.15}
          />
          {/* Primary traveled line */}
          <Line
            points={traveledPoints}
            vertexColors={traveledColors.map(
              (c) => [c.r, c.g, c.b] as [number, number, number]
            )}
            lineWidth={2}
            transparent
            opacity={0.9}
          />
        </>
      )}
      {remainingPoints.length >= 2 && (
        <Line
          points={remainingPoints}
          color='#3b82f6'
          lineWidth={1}
          transparent
          opacity={0.12}
          dashed
          dashSize={0.5}
          gapSize={0.3}
        />
      )}
    </>
  );
}

// ── Orion Capsule ────────────────────────────────────────

function OrionPrimitive({ burning }: { burning: boolean }) {
  return (
    <>
      {/* Docking mechanism — top of crew module */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.06, 12]} />
        <meshStandardMaterial color='#888' metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <torusGeometry args={[0.06, 0.008, 8, 24]} />
        <meshStandardMaterial color='#aaa' metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Crew Module — wider frustum matching real 5m base diameter */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.07, 0.22, 0.28, 24]} />
        <meshStandardMaterial color='#c0c4cc' metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Heat shield — slightly convex spherical section */}
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.225, 0.22, 0.02, 24]} />
        <meshStandardMaterial color='#a89880' metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Spacecraft adapter ring */}
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.215, 0.008, 8, 32]} />
        <meshStandardMaterial color='#666' metalness={0.6} roughness={0.4} />
      </mesh>

      {/* European Service Module — wider gold/amber Kapton MLI cylinder */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.175, 0.175, 0.22, 24]} />
        <meshStandardMaterial
          color='#8b6914'
          emissive='#4a3500'
          emissiveIntensity={0.05}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* AJ10 Engine Nozzle — wider bell */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.07, 0.12, 0.14, 16]} />
        <meshStandardMaterial
          color='#3a3a3a'
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {/* RCS thruster pods — 4 clusters on ESM */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={`rcs-${i}`}
          position={[Math.cos(angle) * 0.19, -0.05, Math.sin(angle) * 0.19]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.012, 0.015, 0.03, 8]} />
          <meshStandardMaterial color='#555' metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* High-gain antenna dish */}
      <group position={[0.2, 0.0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <mesh>
          <cylinderGeometry args={[0.0, 0.06, 0.02, 12]} />
          <meshStandardMaterial color='#ccc' metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Antenna arm */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.06, 6]} />
          <meshStandardMaterial color='#888' metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* X-wing solar arrays with mounting arms */}
      {[
        Math.PI / 4,
        (3 * Math.PI) / 4,
        (5 * Math.PI) / 4,
        (7 * Math.PI) / 4,
      ].map((angle, i) => (
        <group
          key={`solar-${i}`}
          position={[0, -0.1, 0]}
          rotation={[0, angle, 0]}
        >
          {/* Mounting arm */}
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.15, 6]} />
            <meshStandardMaterial
              color='#888'
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          {/* Solar panel */}
          <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.02, 0.55, 0.12]} />
            <meshStandardMaterial
              color='#0a1628'
              emissive='#0a1a3c'
              emissiveIntensity={0.1}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Engine exhaust — HDR for bloom */}
      {burning && (
        <group position={[0, -0.47, 0]}>
          <pointLight color='#ff6a00' intensity={5} distance={6} />
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.05, 0.3, 8]} />
            <meshBasicMaterial color={new THREE.Color(4.0, 2.5, 0.5)} />
          </mesh>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.12, 0.55, 8]} />
            <meshBasicMaterial
              color={new THREE.Color(3.0, 1.2, 0.1)}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      )}
    </>
  );
}

function OrionSTL({ burning }: { burning: boolean }) {
  const geometry = useLoader(STLLoader, '/models/orion.stl');

  // Center, rotate Z-up→Y-up, scale to match crew module size, position at top
  const processedGeometry = useMemo(() => {
    const geo = geometry.clone();
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const center = new THREE.Vector3();
    box.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);

    // Rotate from Z-up (STL/CAD convention) to Y-up (Three.js)
    geo.rotateY(Math.PI / 2);

    // Scale: the crew module is ~0.28 units tall in our primitive model
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 0.35;
    const scale = targetSize / maxDim;
    geo.scale(scale, scale, scale);
    geo.computeVertexNormals();
    return geo;
  }, [geometry]);

  return (
    <>
      {/* STL Crew Module — positioned where the primitive CM sits */}
      <mesh geometry={processedGeometry} position={[0, 0.22, 0]}>
        <meshStandardMaterial color='#c0c4cc' metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Heat shield — below the STL capsule */}
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.225, 0.22, 0.02, 24]} />
        <meshStandardMaterial color='#a89880' metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Spacecraft adapter ring
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.215, 0.008, 8, 32]} />
        <meshStandardMaterial color='#666' metalness={0.6} roughness={0.4} />
      </mesh> */}

      {/* European Service Module — gold Kapton MLI */}
      <mesh position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.175, 0.175, 0.22, 24]} />
        <meshStandardMaterial
          color='#8b6914'
          emissive='#4a3500'
          emissiveIntensity={0.05}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* AJ10 Engine Nozzle */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.1, 16]} />
        <meshStandardMaterial
          color='#3a3a3a'
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {/* RCS thruster pods */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={`stl-rcs-${i}`}
          position={[Math.cos(angle) * 0.19, -0.05, Math.sin(angle) * 0.19]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.012, 0.015, 0.03, 8]} />
          <meshStandardMaterial color='#555' metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* X-wing solar arrays with mounting arms */}
      {[
        Math.PI / 4,
        (3 * Math.PI) / 4,
        (5 * Math.PI) / 4,
        (7 * Math.PI) / 4,
      ].map((angle, i) => (
        <group
          key={`stl-solar-${i}`}
          position={[0, -0.009, 0]}
          rotation={[0, angle, 0]}
        >
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.15, 6]} />
            <meshStandardMaterial
              color='#888'
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.02, 0.55, 0.12]} />
            <meshStandardMaterial
              color='#0a1628'
              emissive='#0a1a3c'
              emissiveIntensity={0.1}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Engine exhaust */}
      {burning && (
        <group position={[0, -0.47, 0]}>
          <pointLight color='#ff6a00' intensity={5} distance={6} />
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.05, 0.3, 8]} />
            <meshBasicMaterial color={new THREE.Color(4.0, 2.5, 0.5)} />
          </mesh>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.12, 0.55, 8]} />
            <meshBasicMaterial
              color={new THREE.Color(3.0, 1.2, 0.1)}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      )}
    </>
  );
}

const RCS_POSITIONS = [
  [0.19, -0.05, 0],
  [0, -0.05, 0.19],
  [-0.19, -0.05, 0],
  [0, -0.05, -0.19],
] as const;

function RCSFlicker() {
  const lightsRef = useRef<(THREE.PointLight | null)[]>([]);
  const timerRef = useRef(0);
  const activeRef = useRef(-1);

  useFrame((_, delta) => {
    timerRef.current += delta;
    // Random pulse every 0.8–2.5 seconds
    if (timerRef.current > 0.8 + Math.random() * 1.7) {
      timerRef.current = 0;
      activeRef.current = Math.floor(Math.random() * 4);
    }
    // Each pulse lasts ~0.15s then fades
    for (let i = 0; i < 4; i++) {
      const light = lightsRef.current[i];
      if (!light) continue;
      if (i === activeRef.current && timerRef.current < 0.15) {
        light.intensity = 3 * (1 - timerRef.current / 0.15);
      } else {
        light.intensity = 0;
      }
    }
  });

  return (
    <>
      {RCS_POSITIONS.map((pos, i) => (
        <pointLight
          key={`rcs-light-${i}`}
          ref={(el) => { lightsRef.current[i] = el; }}
          position={[pos[0], pos[1], pos[2]]}
          color="#ffaa44"
          intensity={0}
          distance={1.5}
        />
      ))}
    </>
  );
}

function OrionCapsule({
  missionProgress,
  phaseIndex,
}: {
  missionProgress: number;
  phaseIndex: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const points = useMemo(() => generateTrajectoryPoints(600), []);
  const burning = isBurnPhase(phaseIndex);
  const [hasStl, setHasStl] = useState(false);

  useEffect(() => {
    fetch('/models/orion.stl', { method: 'HEAD' })
      .then((res) => setHasStl(res.ok))
      .catch(() => setHasStl(false));
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const pos = getPositionAtProgress(points, missionProgress);
    groupRef.current.position.copy(pos);

    const nextPos = getPositionAtProgress(
      points,
      Math.min(1, missionProgress + 0.005)
    );
    const direction = new THREE.Vector3().subVectors(nextPos, pos).normalize();
    if (direction.length() > 0.001) {
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        up,
        direction
      );
      groupRef.current.quaternion.slerp(quaternion, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      {hasStl ? (
        <Suspense fallback={<OrionPrimitive burning={burning} />}>
          <OrionSTL burning={burning} />
        </Suspense>
      ) : (
        <OrionPrimitive burning={burning} />
      )}

      {/* Dim locator light above capsule for visibility at distance */}
      <pointLight position={[0, 0.45, 0]} color="#3b82f6" intensity={0.3} distance={2} />

      {/* RCS thruster pulses — intermittent attitude control during coast */}
      {!burning && <RCSFlicker />}

      {/* Label */}
      <Html position={[0, 1, 0]} center>
        <div className='text-[9px] font-mono text-blue-300/80 whitespace-nowrap select-none pointer-events-none bg-black/40 px-1.5 py-0.5 rounded'>
          ORION
        </div>
      </Html>
    </group>
  );
}

// ── Camera Controller ────────────────────────────────────

function CameraController({
  missionProgress,
  cameraMode,
  onCameraModeChange,
}: {
  missionProgress: number;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
}) {
  const { camera, controls } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 5, 12));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const points = useMemo(() => generateTrajectoryPoints(600), []);
  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  // Switch to free mode as soon as OrbitControls starts (before dragging moves the camera)
  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      if (cameraModeRef.current !== 'free') {
        onCameraModeChange('free');
      }
    };
    (controls as any).addEventListener('start', onStart);
    return () => {
      (controls as any).removeEventListener('start', onStart);
    };
  }, [controls, onCameraModeChange]);

  useFrame(() => {
    if (cameraMode === 'free') return;

    const orionPos = getPositionAtProgress(points, missionProgress);

    switch (cameraMode) {
      case 'follow': {
        const offset = new THREE.Vector3(2, 1.5, 4);
        targetPos.current.copy(orionPos).add(offset);
        targetLookAt.current.copy(orionPos);
        break;
      }
      case 'earth': {
        targetPos.current.set(0, 3, 10);
        targetLookAt.current.set(0, 0, 0);
        break;
      }
      case 'moon': {
        const moonNow = getMoonPosition(missionProgress);
        targetPos.current.set(moonNow.x - 2, moonNow.y + 2, moonNow.z + 5);
        targetLookAt.current.copy(moonNow);
        break;
      }
      case 'overview': {
        targetPos.current.set(20, 15, 45);
        targetLookAt.current.set(20, 0, 2);
        break;
      }
    }

    camera.position.lerp(targetPos.current, 0.03);

    const orbitControls = controls as any;
    if (orbitControls?.target) {
      orbitControls.target.lerp(targetLookAt.current, 0.03);
    }
  });

  return null;
}
