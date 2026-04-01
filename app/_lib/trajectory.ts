import * as THREE from "three";

// ── Scale ────────────────────────────────────────────────
// Artistic scale: Earth radius ~3 units, Moon at ~40 units from Earth center.
// Real Earth-Moon distance ≈ 384,400 km → 1 unit ≈ 9,610 km.
// HEO apogee 70,000 km ≈ 7.3 units from Earth center.
// Lunar closest approach ≈ 6,700 km from surface (NASA) = ~8,440 km from
// Moon center → 0.88 units. We use 2.0 for artistic clarity.
// Moon radius (artistic) = 0.8 units ≈ 7,690 km (real: 1,737 km).

const EARTH_CENTER = new THREE.Vector3(0, 0, 0);
const MOON_CENTER = new THREE.Vector3(40, 0, 3);
const EARTH_RADIUS = 3;
const MOON_RADIUS = 0.8;
const HEO_APOGEE = 7.5; // ~70,000 km

// Flyby geometry — the spacecraft approaches from the Earth-facing side,
// swings behind the far side (x > Moon.x), and returns below.
const FLYBY_RADIUS = 2.0; // Minimum distance from Moon center (artistic)

// Flyby entry/exit angles (radians, measured from +X axis at Moon center).
// +X = far side (away from Earth), -X = Earth-facing side.
// Entry: upper Earth-facing quadrant (120°), Exit: lower Earth-facing (-120°).
const FLYBY_ENTRY_ANGLE = (Math.PI * 2) / 3; // 120°
const FLYBY_EXIT_ANGLE = (-Math.PI * 2) / 3; // -120°

// Pre-compute flyby entry/exit positions (relative to Moon)
function flybyPoint(angle: number, zOffset: number = 0): THREE.Vector3 {
  return new THREE.Vector3(
    MOON_CENTER.x + Math.cos(angle) * FLYBY_RADIUS,
    MOON_CENTER.y + Math.sin(angle) * FLYBY_RADIUS,
    MOON_CENTER.z + zOffset
  );
}

const FLYBY_ENTRY = flybyPoint(FLYBY_ENTRY_ANGLE, 0.5);
const FLYBY_EXIT = flybyPoint(FLYBY_EXIT_ANGLE, -0.5);

/**
 * Generate the Artemis II free-return trajectory.
 *
 * Profile (based on NASA mission data):
 *  1. Launch & ascent to initial orbit (~185 km)
 *  2. ICPS burns → 185 km × 70,000 km HEO (23.5-hour period)
 *  3. Orion separates from ICPS, proximity operations
 *  4. TLI burn at HEO perigee (T+25.5 h)
 *  5. Outbound coast ~4 days
 *  6. Lunar flyby — closest approach ~6,700 km above far side, ~402,000 km from Earth
 *  7. Return coast ~4 days (free-return trajectory)
 *  8. Skip re-entry & splashdown
 */
export function generateTrajectoryPoints(
  segments: number = 800
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let point: THREE.Vector3;

    if (t < 0.015) {
      // ── Phase 1: Launch — ascent from Earth surface to perigee ──
      const lt = t / 0.015;
      const r = EARTH_RADIUS + lt * 0.3;
      point = new THREE.Vector3(
        Math.sin(lt * 0.3) * r * 0.1,
        r,
        0
      );
    } else if (t < 0.06) {
      // ── Phase 2: ICPS burns — full 360° elliptical HEO (185 km × 70,000 km) ──
      // Keplerian orbit: one full revolution, clockwise from perigee at top
      const lt = (t - 0.015) / 0.045;
      const perigeeR = EARTH_RADIUS + 0.3;
      const apogeeR = HEO_APOGEE;
      const a = (perigeeR + apogeeR) / 2; // semi-major axis
      const e = (apogeeR - perigeeR) / (apogeeR + perigeeR); // eccentricity ~0.389
      // True anomaly sweeps 0 → 2π (full orbit)
      const theta = lt * Math.PI * 2;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
      // Clockwise from perigee at top (+Y)
      const angle = Math.PI * 0.5 - theta;
      point = new THREE.Vector3(
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        lt * 0.3
      );
    } else if (t < 0.08) {
      // ── Phase 3: Prox ops — loitering near perigee (top) ──
      const lt = (t - 0.06) / 0.02;
      const r = EARTH_RADIUS + 0.3;
      // Small loitering arc near perigee at top of orbit
      const baseAngle = Math.PI * 0.5;
      const wobble = Math.sin(lt * Math.PI * 2) * 0.12;
      point = new THREE.Vector3(
        Math.cos(baseAngle - lt * 0.3) * (r + wobble),
        Math.sin(baseAngle - lt * 0.3) * (r + wobble),
        0.3 + lt * 0.05
      );
    } else if (t < 0.10) {
      // ── Phase 4: TLI burn — smooth tangential departure from perigee ──
      // Bezier curve departing tangentially in +X direction from perigee
      const lt = (t - 0.08) / 0.02;
      const perigeeR = EARTH_RADIUS + 0.3;
      const p0 = new THREE.Vector3(
        Math.cos(Math.PI * 0.5 - 0.3) * perigeeR,
        Math.sin(Math.PI * 0.5 - 0.3) * perigeeR,
        0.35
      );
      const p1 = new THREE.Vector3(2.5, 3.5, 0.45);
      const p2 = new THREE.Vector3(3.5, 5.0, 0.65);
      const p3 = new THREE.Vector3(4.5, 5.5, 0.8);
      point = cubicBezier(p0, p1, p2, p3, lt);
    } else if (t < 0.46) {
      // ── Phase 5: Outbound coast to Moon (~4 days) ──
      // Bezier from TLI end to flyby entry, arcing above Earth-Moon line
      const lt = (t - 0.10) / 0.36;
      const p0 = new THREE.Vector3(4.5, 5.5, 0.8);
      const p1 = new THREE.Vector3(12, 10, 2.0);
      const p2 = new THREE.Vector3(26, 8, 3.0);
      const p3 = FLYBY_ENTRY.clone();
      point = cubicBezier(p0, p1, p2, p3, lt);
    } else if (t < 0.58) {
      // ── Phase 6: Lunar flyby ──
      // Arc around the Moon's far side. Entry at 120° (upper Earth-side),
      // pericynthion at 0° (far side, x > Moon.x), exit at -120° (lower).
      // Sweeps 240° clockwise.
      const lt = (t - 0.46) / 0.12;

      // Clockwise sweep from FLYBY_ENTRY_ANGLE to FLYBY_EXIT_ANGLE
      // Going from 120° → 0° → -120° (clockwise = decreasing angle)
      const totalSweep = FLYBY_ENTRY_ANGLE - FLYBY_EXIT_ANGLE; // 240°
      const angle = FLYBY_ENTRY_ANGLE - lt * totalSweep;

      // Slightly vary the radius — closest at pericynthion (angle ≈ 0)
      const pericynthionFactor = Math.cos(angle); // 1 at 0°, negative at 180°
      const r = FLYBY_RADIUS - pericynthionFactor * 0.15; // tighter at far side

      // Z variation for 3D interest
      const zOffset = Math.cos(lt * Math.PI) * 0.8;

      point = new THREE.Vector3(
        MOON_CENTER.x + Math.cos(angle) * r,
        MOON_CENTER.y + Math.sin(angle) * r,
        MOON_CENTER.z + zOffset
      );
    } else if (t < 0.93) {
      // ── Phase 7: Return coast to Earth (~4 days) ──
      // Bezier from flyby exit back to Earth, curving below the
      // Earth-Moon line (figure-8 return leg).
      const lt = (t - 0.58) / 0.35;
      const p0 = FLYBY_EXIT.clone();
      const p1 = new THREE.Vector3(28, -8, 1.5);
      const p2 = new THREE.Vector3(12, -9, 0.5);
      const p3 = new THREE.Vector3(1.5, -3.5, 0.2);
      point = cubicBezier(p0, p1, p2, p3, lt);
    } else {
      // ── Phase 8: Re-entry approach ──
      const lt = (t - 0.93) / 0.07;
      // Converge toward Earth surface
      const startPos = new THREE.Vector3(1.5, -3.5, 0.2);
      const endPos = new THREE.Vector3(0, -EARTH_RADIUS * 0.3, 0);
      point = new THREE.Vector3().lerpVectors(startPos, endPos, lt);
    }

    points.push(point);
  }

  return points;
}

function cubicBezier(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number
): THREE.Vector3 {
  const mt = 1 - t;
  return new THREE.Vector3()
    .copy(p0)
    .multiplyScalar(mt * mt * mt)
    .addScaledVector(p1, 3 * mt * mt * t)
    .addScaledVector(p2, 3 * mt * t * t)
    .addScaledVector(p3, t * t * t);
}

/**
 * Get position along the trajectory for a given mission progress (0-1).
 */
export function getPositionAtProgress(
  points: THREE.Vector3[],
  progress: number
): THREE.Vector3 {
  const clamped = Math.max(0, Math.min(1, progress));
  const index = clamped * (points.length - 1);
  const lower = Math.floor(index);
  const upper = Math.min(lower + 1, points.length - 1);
  const frac = index - lower;

  return new THREE.Vector3().lerpVectors(points[lower], points[upper], frac);
}

/**
 * Camera positions for each mission phase (10 phases).
 */
export function getCameraForPhase(phaseIndex: number): {
  position: [number, number, number];
  target: [number, number, number];
} {
  const phases: {
    position: [number, number, number];
    target: [number, number, number];
  }[] = [
    // 0: Pre-launch — close to Earth
    { position: [0, 5, 12], target: [0, 0, 0] },
    // 1: Launch — watching ascent
    { position: [6, 6, 10], target: [0, 3, 0] },
    // 2: ICPS burns — pulled back to see HEO ellipse
    { position: [12, 10, 16], target: [0, 3, 0] },
    // 3: Prox ops — near Earth
    { position: [8, 6, 12], target: [0, 2, 0] },
    // 4: HEO / TLI prep — medium distance
    { position: [12, 8, 16], target: [2, 2, 0] },
    // 5: TLI burn — pulling back
    { position: [15, 10, 20], target: [4, 4, 0] },
    // 6: Outbound coast — wide, both bodies visible
    { position: [20, 12, 32], target: [20, 0, 2] },
    // 7: Lunar flyby — close to Moon, angled to see far-side pass
    { position: [44, 4, 10], target: [40, 0, 3] },
    // 8: Return coast — wide view
    { position: [20, -8, 30], target: [18, -3, 2] },
    // 9: Re-entry — back near Earth
    { position: [4, -4, 12], target: [0, 0, 0] },
  ];

  return phases[Math.min(phaseIndex, phases.length - 1)];
}
