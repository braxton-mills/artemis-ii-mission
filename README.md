# To The Moon -- Artemis II Tracker

A real-time interactive 3D visualization of the **Artemis II** mission — NASA's first crewed flight beyond low Earth orbit since Apollo 17 in 1972.

**[Live Demo](https://to-the-moon-ten.vercel.app/)**

![Mission Trajectory](/public/mission-trajectory.png)

## What is this?

A web app that tracks the Artemis II mission in real time, synchronized to the actual launch date (April 1, 2026). It features:

- **3D interactive scene** — Earth, Moon, and the Orion spacecraft rendered in Three.js with realistic lighting, procedural shaders, and optional NASA texture maps
- **Real-time mission tracking** — mission elapsed time, current phase, and live telemetry (altitude, velocity, distance from Earth/Moon) all update based on the actual mission timeline
- **Accurate orbital mechanics** — Earth rotates at its real sidereal rate, the Moon orbits and arrives at the flyby point exactly when Orion does, and the free-return trajectory matches the planned mission profile
- **10 mission phases** — from pre-launch countdown through TLI, lunar flyby, and splashdown, each with detailed descriptions and telemetry data
- **Multiple camera modes** — follow Orion, orbit Earth, track the Moon, or free-fly through the scene
- **Crew profiles and glossary** — background on the four Artemis II astronauts and an interactive glossary of spaceflight terms

## Tech Stack

- [Next.js](https://nextjs.org/) 16
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Drei](https://github.com/pmndrs/drei) + [Three.js](https://threejs.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- TypeScript
- Deployed on [Vercel](https://vercel.com)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional: High-res textures

The app uses procedural shaders by default. For real NASA imagery, download textures from [Solar System Scope](https://www.solarsystemscope.com/textures/) and place them in `public/textures/`:

- `earth_day.jpg`
- `earth_night.jpg`
- `earth_clouds.jpg`
- `moon.jpg`

### Optional: NASA Orion STL model

Download "Orion Capsule (no fbc).stl" from [NASA 3D Resources](https://nasa3d.arc.nasa.gov/) and save as `public/models/orion.stl`. The app falls back to a primitive model if the file isn't present.

## License

MIT
