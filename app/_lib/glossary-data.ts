export interface GlossaryTerm {
  term: string;
  abbreviation?: string;
  definition: string;
  plainEnglish: string;
  category: "orbital-mechanics" | "spacecraft" | "mission-ops" | "physics";
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "Trans-Lunar Injection",
    abbreviation: "TLI",
    definition:
      "A propulsive maneuver that accelerates a spacecraft from Earth orbit onto a trajectory that intersects the Moon\u2019s orbit. For Artemis II, TLI occurs at T+25.5 hours using the Service Module\u2019s AJ10 engine at perigee of the high Earth orbit.",
    plainEnglish:
      "The big engine burn that pushes you off the Earth-orbit highway and onto the Moon-bound freeway. It happens at the lowest, fastest point of the orbit so Earth\u2019s gravity gives you an extra kick.",
    category: "orbital-mechanics",
  },
  {
    term: "Free-Return Trajectory",
    definition:
      "A flight path that uses the Moon\u2019s gravity to swing a spacecraft around and send it back toward Earth without requiring additional propulsive maneuvers. Artemis II uses a \u2018hybrid free-return\u2019 \u2014 a powered flyby shapes the path, but even if the engine fails, the crew still comes home.",
    plainEnglish:
      "A boomerang path around the Moon. If anything goes wrong, the Moon\u2019s gravity naturally slings the crew back toward Earth \u2014 no extra fuel needed. It\u2019s the ultimate safety net, and the same concept that saved the Apollo 13 crew.",
    category: "orbital-mechanics",
  },
  {
    term: "Mission Elapsed Time",
    abbreviation: "MET",
    definition:
      "A timekeeping method that counts from the moment of liftoff (T-0), used to coordinate all mission events relative to launch rather than clock time.",
    plainEnglish:
      "A stopwatch that starts at liftoff. Instead of saying \u20183:42 PM on Tuesday,\u2019 mission control says \u2018T+4 hours, 12 minutes.\u2019 Everything revolves around when the rocket left the ground.",
    category: "mission-ops",
  },
  {
    term: "Perigee",
    definition:
      "The point in an orbit around Earth where the orbiting object is closest to Earth\u2019s center. For Artemis II\u2019s high Earth orbit, perigee is ~115 mi \u2014 and it\u2019s where TLI fires because the spacecraft is moving fastest there.",
    plainEnglish:
      "The lowest point of a loop around Earth \u2014 where you\u2019re skimming closest to the surface and moving the fastest. Artemis II fires its Moon-bound engine here to get maximum bang for the fuel.",
    category: "orbital-mechanics",
  },
  {
    term: "Apogee",
    definition:
      "The point in an orbit around Earth where the orbiting object is farthest from Earth\u2019s center. Artemis II\u2019s high Earth orbit has an apogee of ~43,500 mi \u2014 higher than GPS satellites.",
    plainEnglish:
      "The highest point of a loop around Earth. For Artemis II, that\u2019s ~43,500 mi up \u2014 almost one-fifth of the way to the Moon, and higher than any human has orbited since Apollo.",
    category: "orbital-mechanics",
  },
  {
    term: "Delta-V",
    abbreviation: "\u0394V",
    definition:
      "The change in velocity a spacecraft needs for a maneuver. TLI requires ~6,900 mph of delta-V. It is the fundamental measure of propulsive capability.",
    plainEnglish:
      "The \u2018currency\u2019 of spaceflight. Every maneuver costs delta-V, and your fuel supply determines your budget. Want to go to the Moon? That\u2019ll cost about 6,900 mph of delta-V, please.",
    category: "physics",
  },
  {
    term: "Space Launch System",
    abbreviation: "SLS",
    definition:
      "NASA\u2019s super-heavy-lift launch vehicle. Stands 322 feet tall and produces 8.8 million pounds of thrust at liftoff \u2014 15% more than the Saturn V.",
    plainEnglish:
      "The most powerful rocket NASA has ever built \u2014 taller than the Statue of Liberty, louder than a rock concert at point-blank range, and strong enough to push a fully loaded 747 to orbital speed.",
    category: "spacecraft",
  },
  {
    term: "Orion",
    definition:
      "NASA\u2019s crew exploration vehicle for deep-space missions. Carries up to 4 astronauts and is protected by the largest heat shield ever built (16.5 feet in diameter). Artemis II\u2019s Orion has the callsign \u2018Integrity.\u2019",
    plainEnglish:
      "The capsule the astronauts actually ride in \u2014 like the tip of the rocket that becomes their home for the whole 10-day trip. It\u2019s the only part that comes back to Earth.",
    category: "spacecraft",
  },
  {
    term: "European Service Module",
    abbreviation: "ESM",
    definition:
      "Built by ESA and Airbus, the ESM provides propulsion (AJ10 engine), electrical power (four solar array wings), thermal control, air, and water. Its AJ10 engine performs the TLI burn on Artemis II.",
    plainEnglish:
      "Orion\u2019s backpack \u2014 it carries the main engine, solar panels, air supply, and water. Unlike Apollo where the big rocket stage did TLI, Artemis II\u2019s service module does it with its own engine. It gets tossed away 20 minutes before re-entry.",
    category: "spacecraft",
  },
  {
    term: "Interim Cryogenic Propulsion Stage",
    abbreviation: "ICPS",
    definition:
      "The upper stage of the SLS Block 1 rocket, derived from the Delta IV Heavy\u2019s upper stage. Uses a single RL10B-2 engine burning liquid hydrogen and liquid oxygen. On Artemis II, it establishes the high Earth orbit but does NOT perform TLI.",
    plainEnglish:
      "The second stage that gets Orion into a high orbit. Its big job is two burns: one to stabilize the orbit, one to fling it way out to ~43,500 mi. After that it\u2019s empty, Orion separates, and Glover practices flying around the spent stage.",
    category: "spacecraft",
  },
  {
    term: "Solid Rocket Boosters",
    abbreviation: "SRBs",
    definition:
      "Two five-segment solid-fuel boosters, each producing ~3.6 million pounds of thrust. They burn for ~126 seconds (separating at T+2:08) and are the largest solid rockets ever flown.",
    plainEnglish:
      "Two giant Roman candles strapped to the sides of the rocket. They provide most of the muscle for the first two minutes, then they\u2019re empty and fall away into the Atlantic Ocean.",
    category: "spacecraft",
  },
  {
    term: "Skip Re-entry",
    definition:
      "A technique where the spacecraft enters the atmosphere, uses aerodynamic lift to bounce back up briefly, then re-enters a second time. This lowers peak G-forces and dramatically improves landing accuracy. Artemis II uses a modified (shorter) skip compared to Artemis I.",
    plainEnglish:
      "Like skipping a stone on water \u2014 the capsule dips into the atmosphere, bounces back up, then comes down again for good. This spreads the brutal deceleration over two dips instead of one, and lets them land within ~12 mi of the target instead of ~125 mi.",
    category: "physics",
  },
  {
    term: "Heat Shield (AVCOAT)",
    definition:
      "An ablative thermal protection system on Orion\u2019s base. AVCOAT (Avcoat 5026-39) slowly burns away in a controlled manner to dissipate heat, withstanding up to ~5,000 \u00B0F during lunar-return re-entry at ~25,000 mph.",
    plainEnglish:
      "A sacrificial shield on the bottom of the capsule that slowly burns away to protect the crew from the inferno of re-entry \u2014 temperatures half as hot as the surface of the Sun. After Artemis I, engineers investigated unexpected \u2018spalling\u2019 (flaking) of the material.",
    category: "spacecraft",
  },
  {
    term: "Cislunar Space",
    definition:
      "The volume of space between Earth and the Moon, encompassing all trajectories and orbits within the Earth-Moon system. Artemis II will be the first crewed mission to traverse cislunar space since Apollo 17 in 1972.",
    plainEnglish:
      "The cosmic neighborhood between Earth and the Moon \u2014 about 239,000 mi of mostly empty void. Think of it as the \u2018open ocean\u2019 between two shores.",
    category: "orbital-mechanics",
  },
  {
    term: "Low Earth Orbit",
    abbreviation: "LEO",
    definition:
      "An orbit between ~100 and ~1,250 mi altitude. The ISS orbits at ~250 mi. Artemis II passes through LEO briefly during ascent but spends most of its Earth-orbit time in a much higher orbit.",
    plainEnglish:
      "The \u2018kiddie pool\u2019 of space \u2014 close enough that you can still see city lights at night. Every crewed mission since Apollo has stayed here... until Artemis II.",
    category: "orbital-mechanics",
  },
  {
    term: "Proximity Operations",
    abbreviation: "Prox Ops",
    definition:
      "Controlled maneuvering of a spacecraft in close formation with another object. On Artemis II, Pilot Glover manually flies Orion around the spent ICPS to test handling qualities and rendezvous techniques needed for future Gateway docking.",
    plainEnglish:
      "Fancy parallel parking in space. After Orion detaches from its upper stage, the pilot flies circles around it to prove the capsule can maneuver precisely \u2014 a critical skill for docking at the Lunar Gateway on future missions.",
    category: "mission-ops",
  },
  {
    term: "Splashdown",
    definition:
      "Spacecraft recovery via parachute descent into the ocean. Orion deploys two drogue chutes at ~4.7 mi altitude and three 115-foot main parachutes at ~1.5 mi, hitting the water at ~20 mph off San Diego.",
    plainEnglish:
      "The final plunge \u2014 parachutes pop open, the capsule floats down, and plop! Into the Pacific Ocean. Navy ships are waiting nearby to fish the crew out.",
    category: "mission-ops",
  },
  {
    term: "Escape Velocity",
    definition:
      "The minimum speed an object must reach to break free from a celestial body\u2019s gravitational pull without further propulsion. For Earth, this is approximately ~25,000 mph.",
    plainEnglish:
      "The speed you\u2019d need to throw a ball so hard it never comes back down. For Earth, that\u2019s about 25,000 mph \u2014 which is exactly what the TLI burn achieves.",
    category: "physics",
  },
  {
    term: "Max-Q",
    definition:
      "Maximum dynamic pressure \u2014 the point during ascent when aerodynamic stress on the vehicle is greatest, typically around T+70 seconds at ~7\u20139 mi altitude. The vehicle must be designed to survive this peak load.",
    plainEnglish:
      "The moment the rocket is getting punched hardest by the atmosphere \u2014 moving fast but still low enough that the air is thick. It\u2019s the roughest part of the ride, about a minute after liftoff.",
    category: "physics",
  },
];

export const categoryLabels: Record<GlossaryTerm["category"], string> = {
  "orbital-mechanics": "Orbital Mechanics",
  spacecraft: "Spacecraft",
  "mission-ops": "Mission Operations",
  physics: "Physics",
};

export const categoryColors: Record<GlossaryTerm["category"], string> = {
  "orbital-mechanics": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  spacecraft: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "mission-ops": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  physics: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};
