"use client";

import { missionStages } from "../_lib/mission-data";
import { useMissionTime } from "../_hooks/useMissionTime";
import StageCard from "./StageCard";

export default function MissionTimeline() {
  const { metSeconds, phaseIndex, mounted } = useMissionTime();

  return (
    <section className="py-12 px-3 sm:py-20 sm:px-6" id="timeline">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
            Mission Timeline
          </h2>
          <p className="text-sm sm:text-base text-zinc-500 max-w-lg mx-auto">
            Ten days, eight critical phases, and 1.3 million miles of space travel
            — from launch pad to splashdown.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative pl-4 sm:pl-6">
          {/* Vertical line */}
          <div className="absolute left-0 top-6 bottom-6 w-px timeline-line opacity-30" />

          {/* Progress overlay */}
          {mounted && (
            <div
              className="absolute left-0 top-6 w-px timeline-line transition-all duration-1000"
              style={{
                height: `${Math.min(100, ((phaseIndex + 0.5) / missionStages.length) * 100)}%`,
              }}
            />
          )}

          {/* Stage cards */}
          <div className="space-y-3">
            {missionStages.map((stage, i) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={i}
                isActive={mounted && i === phaseIndex}
                isCompleted={mounted && metSeconds > stage.endMET}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
