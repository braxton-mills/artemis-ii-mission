"use client";

import { useMissionTime, formatMET } from "../_hooks/useMissionTime";
import { missionStages } from "../_lib/mission-data";

export default function CountdownTimer() {
  const { met, phase, phaseIndex, isPreLaunch, isComplete, missionProgress, mounted } =
    useMissionTime();

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Timer display */}
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500 mb-4">
            Mission Elapsed Time
          </div>

          <div className="font-mono text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold timer-glow text-white mb-6 tabular-nums">
            {mounted ? formatMET(met) : (
              <span className="text-zinc-600">T+00:00:00</span>
            )}
          </div>

          {/* Current phase badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm">
            <span
              className={`w-2 h-2 rounded-full ${phase.bgColor} ${
                !isComplete && !isPreLaunch ? "animate-pulse" : ""
              }`}
            />
            <span className={`font-medium ${phase.color}`}>
              {isComplete
                ? "Mission Complete"
                : isPreLaunch
                  ? "Awaiting Launch"
                  : phase.name}
            </span>
          </div>

          {/* Phase progress bar */}
          <div className="mt-8">
            <div className="flex gap-1">
              {missionStages.map((stage, i) => {
                let segmentProgress = 0;
                if (i < phaseIndex) segmentProgress = 1;
                else if (i === phaseIndex) {
                  const metSec = met / 1000;
                  const duration = stage.endMET - stage.startMET;
                  segmentProgress = duration > 0
                    ? Math.max(0, Math.min(1, (metSec - stage.startMET) / duration))
                    : 0;
                }

                return (
                  <div key={stage.id} className="flex-1 group relative">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${segmentProgress * 100}%`,
                          background:
                            i === phaseIndex
                              ? "linear-gradient(90deg, #3b82f6, #8b5cf6)"
                              : segmentProgress === 1
                                ? "rgba(255,255,255,0.25)"
                                : "transparent",
                        }}
                      />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {stage.shortName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live stats */}
          {mounted && (
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">
                  Altitude
                </div>
                <div className="font-mono text-sm text-zinc-300">
                  {formatNumber(interpolateValue(phase.altitude, met / 1000, phase.startMET, phase.endMET))} km
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">
                  Velocity
                </div>
                <div className="font-mono text-sm text-zinc-300">
                  {interpolateValue(phase.velocity, met / 1000, phase.startMET, phase.endMET).toFixed(1)} km/s
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">
                  Distance from Earth
                </div>
                <div className="font-mono text-sm text-zinc-300">
                  {formatNumber(interpolateValue(
                    { start: phase.distanceFromEarth.start, peak: Math.max(phase.distanceFromEarth.start, phase.distanceFromEarth.end), end: phase.distanceFromEarth.end },
                    met / 1000,
                    phase.startMET,
                    phase.endMET
                  ))} km
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function interpolateValue(
  range: { start: number; peak: number; end: number },
  metSeconds: number,
  startMET: number,
  endMET: number
): number {
  const duration = endMET - startMET;
  if (duration <= 0) return range.start;
  const t = Math.max(0, Math.min(1, (metSeconds - startMET) / duration));

  // Go through peak in the middle
  if (t < 0.5) {
    const lt = t * 2;
    return range.start + (range.peak - range.start) * lt;
  } else {
    const lt = (t - 0.5) * 2;
    return range.peak + (range.end - range.peak) * lt;
  }
}

function formatNumber(n: number): string {
  if (n >= 1000) {
    return Math.round(n).toLocaleString();
  }
  return Math.round(n).toString();
}
