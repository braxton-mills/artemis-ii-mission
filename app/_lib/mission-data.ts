export interface MissionStage {
  id: string;
  name: string;
  shortName: string;
  description: string;
  details: string;
  startMET: number; // seconds from T-0 (negative for pre-launch)
  endMET: number;
  altitude: { start: number; peak: number; end: number }; // km
  velocity: { start: number; peak: number; end: number }; // km/s
  distanceFromEarth: { start: number; end: number }; // km
  icon: string;
  color: string;
  bgColor: string;
}

export interface CrewMember {
  name: string;
  role: string;
  agency: string;
  nationality: string;
  bio: string;
  initials: string;
  alma: string[];
}

// Artemis II launch: April 1, 2026, 6:36 PM EDT = 22:36 UTC (12-min delay)
export const T_ZERO = new Date("2026-04-01T22:36:00Z");

// ~10 days mission, splashdown ~April 10-11
export const MISSION_DURATION_DAYS = 10;
export const MISSION_DURATION_SECONDS = MISSION_DURATION_DAYS * 86400;

export const missionStages: MissionStage[] = [
  {
    id: "prelaunch",
    name: "Pre-Launch Countdown",
    shortName: "Countdown",
    description:
      "Final systems checks, crew ingress, and automated launch sequence at Kennedy Space Center Launch Complex 39B.",
    details:
      "The crew arrives at LC-39B and enters the Orion spacecraft (callsign: Integrity) approximately 2 hours 40 minutes before launch. Ground teams close the hatch at T\u22121:30, the flight termination system is armed at T\u22124:30, and the SLS auxiliary power unit starts at T\u22124:00. The water suppression system activates at T\u221212 seconds. At T\u22126.36 seconds, the four RS-25 engines ignite in sequence, building to full thrust before the twin solid rocket boosters light at T\u22120.",
    startMET: -9600, // T-2:40:00
    endMET: 0,
    altitude: { start: 0, peak: 0, end: 0 },
    velocity: { start: 0, peak: 0, end: 0 },
    distanceFromEarth: { start: 0, end: 0 },
    icon: "countdown",
    color: "text-amber-400",
    bgColor: "bg-amber-400",
  },
  {
    id: "launch",
    name: "Launch & Ascent",
    shortName: "Launch",
    description:
      "SLS produces 8.8 million pounds of thrust at liftoff — 15% more than the Saturn V — sending the crew through Max-Q, SRB separation, and core stage burnout in just eight minutes.",
    details:
      "At T+0, the twin five-segment SRBs ignite and SLS clears the tower. Max-Q (maximum aerodynamic pressure) occurs at T+1:10. The SRBs separate at T+2:08 at ~28 mi altitude after burning ~3.5 million lbs of propellant each. The Launch Abort System tower jettisons at T+3:18. The core stage\u2019s four RS-25 engines continue until Main Engine Cutoff (MECO) at T+8:06, and the spent core stage separates 10 seconds later. Orion is now in space.",
    startMET: 0,
    endMET: 496, // T+8:16
    altitude: { start: 0, peak: 185, end: 160 },
    velocity: { start: 0, peak: 7.8, end: 7.8 },
    distanceFromEarth: { start: 0, end: 160 },
    icon: "rocket",
    color: "text-orange-500",
    bgColor: "bg-orange-500",
  },
  {
    id: "icps-burns",
    name: "ICPS Burns & Orbit Setup",
    shortName: "Orbit Setup",
    description:
      "The ICPS upper stage fires twice to establish a 23.5-hour high Earth orbit with an apogee of ~43,500 mi — higher than GPS satellites and nearly one-fifth of the way to the Moon.",
    details:
      "Orion\u2019s solar arrays deploy at T+20 minutes. At T+49 minutes, the ICPS performs a perigee raise maneuver to stabilize the orbit at ~115 mi. Then at T+1:47:57, the ICPS fires again for a major apogee raise burn, boosting the orbit to ~115 \u00d7 ~43,500 mi. This expends nearly all of the ICPS\u2019s fuel. The resulting elliptical orbit takes 23.5 hours to complete one revolution — the crew will orbit Earth while climbing to an altitude higher than any human since Apollo.",
    startMET: 496, // T+8:16
    endMET: 12255, // T+3:24:15
    altitude: { start: 160, peak: 70000, end: 185 },
    velocity: { start: 7.8, peak: 10.2, end: 7.8 },
    distanceFromEarth: { start: 160, end: 185 },
    icon: "orbit",
    color: "text-blue-400",
    bgColor: "bg-blue-400",
  },
  {
    id: "prox-ops",
    name: "Orion Separation & Proximity Operations",
    shortName: "Prox Ops",
    description:
      "Orion separates from the spent ICPS at T+3:24:15. Pilot Victor Glover takes the controls and flies Orion in close formation around the ICPS — the first crewed piloting of a deep-space vehicle since 1972.",
    details:
      "After separation, Glover moves to the left seat and manually pilots Orion through a series of proximity operations, testing the spacecraft\u2019s handling qualities and maneuvering thrusters by flying in formation with the drifting ICPS. This evaluates Orion\u2019s ability to perform rendezvous-style operations that will be essential for future Artemis missions docking at the Lunar Gateway. After proximity ops are complete, the crew settles in for a short sleep period about 8.5 hours after launch.",
    startMET: 12255, // T+3:24:15
    endMET: 30600, // ~T+8:30:00
    altitude: { start: 185, peak: 70000, end: 70000 },
    velocity: { start: 7.8, peak: 7.8, end: 1.5 },
    distanceFromEarth: { start: 185, end: 70000 },
    icon: "proximity",
    color: "text-sky-400",
    bgColor: "bg-sky-400",
  },
  {
    id: "heo",
    name: "High Earth Orbit & TLI Prep",
    shortName: "HEO",
    description:
      "The crew awakens after 4 hours of sleep to prepare for the mission\u2019s most critical burn. At apogee — ~43,500 mi above Earth — they test communications via the Deep Space Network for the first time.",
    details:
      "During this phase, the crew performs a small orbit adjustment burn, checks out emergency Deep Space Network communications at the highest point of their orbit, and runs final pre-TLI systems checks. NASA managers conduct a formal GO/NO-GO poll before authorizing the trans-lunar injection burn. The crew is on the clock: TLI must happen at the next perigee passage to hit the Moon at the right time. If anything is off, there is one more orbit to try.",
    startMET: 30600, // ~T+8:30
    endMET: 91800, // ~T+25:30
    altitude: { start: 70000, peak: 70000, end: 185 },
    velocity: { start: 1.5, peak: 1.5, end: 7.8 },
    distanceFromEarth: { start: 70000, end: 185 },
    icon: "signal",
    color: "text-violet-400",
    bgColor: "bg-violet-400",
  },
  {
    id: "tli",
    name: "Trans-Lunar Injection",
    shortName: "TLI",
    description:
      "At T+25.5 hours, as Orion reaches perigee, Mission Specialist Christina Koch initiates the TLI burn using Orion\u2019s own Service Module engine — sending the crew on an escape trajectory to the Moon.",
    details:
      "Unlike Apollo, where the Saturn V\u2019s S-IVB stage performed TLI, Artemis II uses Orion\u2019s European Service Module AJ10 engine (derived from the Space Shuttle\u2019s Orbital Maneuvering System). Firing at perigee — the lowest, fastest point of the high Earth orbit — Earth\u2019s gravity gives the spacecraft an additional kick. The burn adds approximately ~6,900 mph of delta-V, pushing Orion past escape velocity (~25,000 mph). After burnout, the crew is Moon-bound with no turning back.",
    startMET: 91800, // ~T+25:30
    endMET: 93600, // ~T+26:00
    altitude: { start: 185, peak: 1500, end: 3000 },
    velocity: { start: 7.8, peak: 10.9, end: 10.9 },
    distanceFromEarth: { start: 185, end: 3000 },
    icon: "burn",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400",
  },
  {
    id: "outbound",
    name: "Outbound Coast to Moon",
    shortName: "Outbound",
    description:
      "Orion coasts through cislunar space for approximately four days. The crew performs trajectory corrections, tests spacesuits, and watches Earth shrink to the size of a thumbnail.",
    details:
      "Three outbound trajectory correction burns fine-tune the path to the Moon. On Flight Day 3, the first correction fires shortly after lunch. On Flight Days 4\u20135, the crew tests their Orion Crew Survival System suits — practicing rapid donning, pressurization, eating and drinking through helmet ports, and emergency seat ingress. These suits are their lifeline if the cabin depressurizes. Throughout, the crew participates in daily video calls with mission control and performs radiation monitoring inside the cabin. The Moon grows from a distant light to a vast cratered world filling the windows.",
    startMET: 93600, // ~T+26h
    endMET: 414000, // ~T+115h / ~Day 5.8
    altitude: { start: 3000, peak: 200000, end: 370000 },
    velocity: { start: 10.9, peak: 10.9, end: 0.8 },
    distanceFromEarth: { start: 3000, end: 370000 },
    icon: "coast",
    color: "text-indigo-400",
    bgColor: "bg-indigo-400",
  },
  {
    id: "flyby",
    name: "Lunar Flyby",
    shortName: "Flyby",
    description:
      "On Flight Day 6, Orion swings within ~4,600 mi of the lunar far side. For 30\u201350 minutes the crew loses all contact with Earth — the first humans to see the far side of the Moon since Apollo 17.",
    details:
      "The final outbound trajectory correction fires before closest approach. Orion passes behind the Moon on a free-return trajectory — the Moon\u2019s gravity bends the flight path into a figure-eight that naturally sends the crew back toward Earth. During far-side passage, the Moon blocks all radio signals and the crew is truly alone. They witness Earthrise over the lunar horizon. At closest approach (~4,600 mi above the surface), the crew may break Apollo 13\u2019s record for the farthest distance any humans have traveled from Earth: ~248,655 mi. The maximum distance from Earth during the flyby is expected to be ~249,000 mi.",
    startMET: 414000, // ~T+115h
    endMET: 432000, // ~T+120h / Day 6
    altitude: { start: 370000, peak: 7400, end: 370000 },
    velocity: { start: 0.8, peak: 2.0, end: 0.8 },
    distanceFromEarth: { start: 370000, end: 400000 },
    icon: "moon",
    color: "text-purple-400",
    bgColor: "bg-purple-400",
  },
  {
    id: "return",
    name: "Return Coast to Earth",
    shortName: "Return",
    description:
      "The free-return trajectory carries Orion home over ~4 days. Flight Day 7 is the crew\u2019s well-earned off-duty day — the first rest day in deep space since 1972.",
    details:
      "The free-return trajectory is the mission\u2019s ultimate safety net: even without engine burns, the Moon\u2019s gravity has already redirected Orion back toward Earth. The Service Module performs small return trajectory correction burns to refine the re-entry corridor. On Flight Day 7, the crew rests. On subsequent days, they stow equipment, configure Orion for re-entry, and run through splashdown procedures. As Earth grows from a marble to a world, the crew prepares to shed their Service Module and face the atmosphere at ~25,000 mph.",
    startMET: 432000, // Day 6
    endMET: 842400, // ~Day 9.75
    altitude: { start: 400000, peak: 400000, end: 500 },
    velocity: { start: 0.8, peak: 0.8, end: 10.5 },
    distanceFromEarth: { start: 400000, end: 500 },
    icon: "return",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400",
  },
  {
    id: "reentry",
    name: "Re-entry & Splashdown",
    shortName: "Splashdown",
    description:
      "The European Service Module is jettisoned 20 minutes before re-entry. Orion hits the atmosphere at ~25,000 mph and performs a skip re-entry before splashing down in the Pacific Ocean off San Diego.",
    details:
      "The Service Module separates ~20 minutes before Entry Interface (EI) at ~76 mi altitude, exposing the 16.5-foot AVCOAT heat shield. Orion strikes the atmosphere at approximately ~25,000 mph (Mach 32) — the fastest re-entry ever attempted with a crew. The heat shield endures temperatures up to ~5,000 \u00B0F, about half the surface temperature of the Sun. Orion performs a modified skip re-entry: it dips into the atmosphere, uses aerodynamic lift to skip back up briefly, then re-enters a second time. This reduces peak G-forces and improves landing accuracy. Drogue parachutes deploy at ~4.7 mi, followed by three 115-foot main parachutes at ~1.5 mi. Splashdown at ~20 mph in the Pacific Ocean off San Diego, where a U.S. Navy amphibious transport dock is waiting for recovery.",
    startMET: 842400, // ~Day 9.75
    endMET: 864000, // Day 10
    altitude: { start: 500, peak: 122, end: 0 },
    velocity: { start: 10.5, peak: 11.0, end: 0.009 },
    distanceFromEarth: { start: 500, end: 0 },
    icon: "parachute",
    color: "text-green-400",
    bgColor: "bg-green-400",
  },
];

export const crew: CrewMember[] = [
  {
    name: "Reid Wiseman",
    role: "Commander",
    agency: "NASA",
    nationality: "American",
    bio: "U.S. Navy captain and test pilot. Flew aboard the ISS during Expedition 41 and served as NASA\u2019s Chief Astronaut before stepping down to focus on Artemis II training.",
    initials: "RW",
    alma: ["Rensselaer Polytechnic Institute (B.S.)", "Johns Hopkins University (M.S.)"],
  },
  {
    name: "Victor Glover",
    role: "Pilot",
    agency: "NASA",
    nationality: "American",
    bio: "U.S. Navy test pilot who piloted SpaceX Crew-1, the first operational Crew Dragon flight. Will become the first Black astronaut to fly beyond low Earth orbit.",
    initials: "VG",
    alma: ["Cal Poly San Luis Obispo (B.S.)", "Air University (M.S., M.A.)"],
  },
  {
    name: "Christina Koch",
    role: "Mission Specialist 1",
    agency: "NASA",
    nationality: "American",
    bio: "Holds the record for the longest single spaceflight by a woman at 328 days. Participated in the first all-female spacewalk in 2019. Will prepare and initiate the TLI burn.",
    initials: "CK",
    alma: ["NC State University (B.S., M.S.)"],
  },
  {
    name: "Jeremy Hansen",
    role: "Mission Specialist 2",
    agency: "CSA",
    nationality: "Canadian",
    bio: "Canadian Space Agency astronaut and former CF-18 Hornet fighter pilot. Will become the first Canadian — and first non-American — ever to fly beyond low Earth orbit.",
    initials: "JH",
    alma: ["Royal Military College of Canada (B.Sc., M.Sc.)"],
  },
];
