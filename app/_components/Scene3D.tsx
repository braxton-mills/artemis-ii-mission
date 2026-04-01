"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Line, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  generateTrajectoryPoints,
  getPositionAtProgress,
} from "../_lib/trajectory";

// ── Types ────────────────────────────────────────────────

export type CameraMode = "follow" | "earth" | "moon" | "overview" | "free";

interface Scene3DProps {
  missionProgress: number;
  phaseIndex: number;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
}

// ── Constants ────────────────────────────────────────────

const EARTH_POS = new THREE.Vector3(0, 0, 0);
const MOON_POS = new THREE.Vector3(40, 0, 3);
const SUN_DIR = new THREE.Vector3(50, 20, 30).normalize();

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
  vNormal = normalize(normalMatrix * normal);
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

  // ── Night side: city lights ──
  float cityNoise = fbm(spherePos * 8.0 + vec3(50.0, 25.0, 12.0), 4);
  float cityMask = smoothstep(0.3, 0.6, cityNoise) * continent * (1.0 - iceMask);
  vec3 cityColor = vec3(1.0, 0.85, 0.5) * cityMask * 0.3;
  vec3 nightColor = surfaceColor * 0.02 + cityColor;

  // ── Final mix day/night ──
  vec3 finalColor = mix(nightColor, dayColor, dayFactor);

  // Subtle Fresnel rim
  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);
  finalColor += vec3(0.2, 0.5, 1.0) * fresnel * 0.15 * dayFactor;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// ── Atmosphere Shader ────────────────────────────────────

const atmosphereVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vNormal = normalize(normalMatrix * normal);
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

  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 2.5);
  float sunFactor = max(0.15, dot(normal, uSunDir) * 0.5 + 0.5);

  vec3 atmosColor = mix(vec3(0.3, 0.6, 1.0), vec3(0.5, 0.8, 1.0), fresnel);
  float alpha = fresnel * 0.6 * sunFactor;

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
  vNormal = normalize(normalMatrix * normal);
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

  // Animated cloud noise
  float cloudNoise = fbm(spherePos * 2.5 + vec3(uTime * 0.01, 0.0, uTime * 0.005), 5);
  float cloudMask = smoothstep(0.1, 0.4, cloudNoise);

  float NdotL = dot(normal, uSunDir);
  float dayFactor = smoothstep(-0.1, 0.3, NdotL);

  vec3 cloudColor = vec3(1.0) * (0.4 + 0.6 * max(0.0, NdotL));
  float alpha = cloudMask * 0.45 * dayFactor;

  gl_FragColor = vec4(cloudColor, alpha);
}
`;

// ── Moon Shader ──────────────────────────────────────────

const moonVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const moonFragmentShader = /* glsl */ `
${SIMPLEX_NOISE_GLSL}

uniform vec3 uSunDir;
uniform vec3 uMoonCenter;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 localPos = normalize(vWorldPos - uMoonCenter) * 2.0;
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // ── Base surface with variation ──
  float baseNoise = fbm(localPos * 3.0 + vec3(100.0, 50.0, 25.0), 4) * 0.5 + 0.5;
  vec3 baseColor = mix(vec3(0.45, 0.43, 0.40), vec3(0.60, 0.58, 0.55), baseNoise);

  // ── Dark maria (lunar seas) ──
  float mariaNoise = fbm(localPos * 1.0 + vec3(200.0, 100.0, 50.0), 3);
  float mariaMask = smoothstep(-0.1, 0.3, mariaNoise);
  vec3 mariaColor = vec3(0.25, 0.24, 0.22);
  baseColor = mix(baseColor, mariaColor, mariaMask * 0.6);

  // ── Craters (sharp threshold noise) ──
  float craterNoise = snoise(localPos * 12.0 + vec3(300.0, 150.0, 75.0));
  float craterRim = smoothstep(0.35, 0.45, craterNoise) - smoothstep(0.45, 0.55, craterNoise);
  float craterFloor = smoothstep(0.45, 0.55, craterNoise);
  baseColor += vec3(0.12) * craterRim; // bright rim
  baseColor -= vec3(0.08) * craterFloor; // dark floor

  // Small craters
  float smallCrater = snoise(localPos * 25.0 + vec3(500.0, 250.0, 125.0));
  float smallRim = smoothstep(0.4, 0.48, smallCrater) - smoothstep(0.48, 0.56, smallCrater);
  baseColor += vec3(0.08) * smallRim;

  // ── Lighting ──
  float NdotL = max(0.0, dot(normal, uSunDir));
  vec3 litColor = baseColor * (0.08 + 0.92 * NdotL);

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
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <hemisphereLight
        args={["#4488cc", "#111122", 0.3]}
      />
      <directionalLight
        position={[50, 20, 30]}
        intensity={1.8}
        color="#fff5e0"
      />

      <Stars
        radius={250}
        depth={100}
        count={1500}
        factor={2}
        fade
        speed={0}
      />

      <Earth />
      <Moon />
      <TrajectoryPath missionProgress={missionProgress} />
      <OrionCapsule
        missionProgress={missionProgress}
        phaseIndex={phaseIndex}
      />
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
    </Canvas>
  );
}

// ── Earth ────────────────────────────────────────────────

function Earth() {
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
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.065;
    }
    earthUniforms.uTime.value = timeRef.current;
    cloudUniforms.uTime.value = timeRef.current;
  });

  return (
    <group position={[0, 0, 0]}>
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
          color="#4a9eff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Self-illumination glow */}
      <pointLight color="#1a4a8a" intensity={0.5} distance={8} />

      {/* Label */}
      <Html position={[0, -4, 0]} center>
        <div className="text-[10px] font-mono text-blue-300/60 whitespace-nowrap select-none pointer-events-none">
          EARTH
        </div>
      </Html>
    </group>
  );
}

// ── Moon ─────────────────────────────────────────────────

function Moon() {
  const meshRef = useRef<THREE.Mesh>(null);

  const moonUniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR.clone() },
      uMoonCenter: { value: MOON_POS.clone() },
    }),
    []
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group position={[MOON_POS.x, MOON_POS.y, MOON_POS.z]}>
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
        <div className="text-[10px] font-mono text-zinc-400/60 whitespace-nowrap select-none pointer-events-none">
          MOON
        </div>
      </Html>
    </group>
  );
}

// ── Trajectory Path ──────────────────────────────────────

function TrajectoryPath({
  missionProgress,
}: {
  missionProgress: number;
}) {
  const points = useMemo(() => generateTrajectoryPoints(600), []);

  const linePoints = useMemo(
    () => points.map((p) => [p.x, p.y, p.z] as [number, number, number]),
    [points]
  );

  // Gradient colors: orange near Earth → blue in transit → purple near Moon
  const traveledColors = useMemo(() => {
    const splitIndex = Math.floor(
      missionProgress * (linePoints.length - 1)
    );
    const traveled = linePoints.slice(0, splitIndex + 1);
    return traveled.map((_, i) => {
      const t = traveled.length > 1 ? i / (traveled.length - 1) : 0;
      const orange = new THREE.Color("#f97316");
      const blue = new THREE.Color("#3b82f6");
      const purple = new THREE.Color("#a855f7");
      if (t < 0.5) {
        return orange.clone().lerp(blue, t * 2);
      }
      return blue.clone().lerp(purple, (t - 0.5) * 2);
    });
  }, [missionProgress, linePoints]);

  const splitIndex = Math.floor(
    missionProgress * (linePoints.length - 1)
  );
  const traveledPoints = linePoints.slice(0, splitIndex + 1);
  const remainingPoints = linePoints.slice(splitIndex);

  return (
    <>
      {traveledPoints.length >= 2 && (
        <Line
          points={traveledPoints}
          vertexColors={traveledColors.map(
            (c) => [c.r, c.g, c.b] as [number, number, number]
          )}
          lineWidth={2}
          transparent
          opacity={0.9}
        />
      )}
      {remainingPoints.length >= 2 && (
        <Line
          points={remainingPoints}
          color="#3b82f6"
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

  useFrame(() => {
    if (!groupRef.current) return;
    const pos = getPositionAtProgress(points, missionProgress);
    groupRef.current.position.copy(pos);

    const nextPos = getPositionAtProgress(
      points,
      Math.min(1, missionProgress + 0.005)
    );
    const direction = new THREE.Vector3()
      .subVectors(nextPos, pos)
      .normalize();
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
      {/* Capsule body (cone) */}
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial
          color="#e0e0e0"
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      {/* Service module (cylinder) */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.4, 8]} />
        <meshStandardMaterial
          color="#888888"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      {/* Nozzle */}
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.1, 8]} />
        <meshStandardMaterial
          color="#555555"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      {/* Solar panels */}
      <mesh position={[0.4, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.02, 0.5, 0.15]} />
        <meshStandardMaterial
          color="#1a3a5c"
          emissive="#1a3a8c"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[-0.4, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.02, 0.5, 0.15]} />
        <meshStandardMaterial
          color="#1a3a5c"
          emissive="#1a3a8c"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Engine exhaust glow (visible during burns) */}
      {burning && (
        <group position={[0, -0.55, 0]}>
          <pointLight color="#ff6a00" intensity={4} distance={5} />
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial
              color="#ff8833"
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial
              color="#ff6600"
              transparent
              opacity={0.3}
            />
          </mesh>
        </group>
      )}

      {/* Position indicator glow */}
      <pointLight color="#3b82f6" intensity={2} distance={3} />

      {/* Label */}
      <Html position={[0, 1, 0]} center>
        <div className="text-[9px] font-mono text-blue-300/80 whitespace-nowrap select-none pointer-events-none bg-black/40 px-1.5 py-0.5 rounded">
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
      if (cameraModeRef.current !== "free") {
        onCameraModeChange("free");
      }
    };
    (controls as any).addEventListener("start", onStart);
    return () => {
      (controls as any).removeEventListener("start", onStart);
    };
  }, [controls, onCameraModeChange]);

  useFrame(() => {
    if (cameraMode === "free") return;

    const orionPos = getPositionAtProgress(points, missionProgress);

    switch (cameraMode) {
      case "follow": {
        const offset = new THREE.Vector3(2, 1.5, 4);
        targetPos.current.copy(orionPos).add(offset);
        targetLookAt.current.copy(orionPos);
        break;
      }
      case "earth": {
        targetPos.current.set(0, 3, 10);
        targetLookAt.current.set(0, 0, 0);
        break;
      }
      case "moon": {
        targetPos.current.set(MOON_POS.x - 2, MOON_POS.y + 2, MOON_POS.z + 5);
        targetLookAt.current.copy(MOON_POS);
        break;
      }
      case "overview": {
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
