"use client";

import { useState, useRef, useEffect } from "react";
import type { MissionStage } from "../_lib/mission-data";
import { formatMET } from "../_hooks/useMissionTime";

const stageIcons: Record<string, string> = {
  countdown: "\u23F3",
  rocket: "\uD83D\uDE80",
  orbit: "\uD83D\uDEF0\uFE0F",
  proximity: "\uD83D\uDD2D",
  signal: "\uD83D\uDCE1",
  burn: "\u26A1",
  coast: "\uD83C\uDF11",
  moon: "\uD83C\uDF15",
  return: "\uD83C\uDF0D",
  parachute: "\uD83E\uDE82",
};

interface StageCardProps {
  stage: MissionStage;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
}

export default function StageCard({
  stage,
  index,
  isActive,
  isCompleted,
}: StageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const duration = stage.endMET - stage.startMET;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const durationStr =
    hours >= 24
      ? `${(duration / 86400).toFixed(1)}d`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-5 sm:top-6 -translate-x-1/2 z-10">
        <div
          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 transition-colors ${
            isActive
              ? `${stage.bgColor} border-white shadow-lg`
              : isCompleted
                ? `${stage.bgColor} border-white/20`
                : "bg-zinc-800 border-zinc-700"
          }`}
        >
          {isActive && (
            <div
              className={`absolute inset-0 rounded-full ${stage.bgColor} animate-ping opacity-30`}
            />
          )}
        </div>
      </div>

      {/* Card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`ml-4 sm:ml-8 w-full text-left glass-card glass-card-hover rounded-xl p-3 sm:p-5 transition-all duration-300 cursor-pointer ${
          isActive ? "ring-1 ring-blue-500/20" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-base sm:text-xl flex-shrink-0" role="img" aria-label={stage.icon}>
              {stageIcons[stage.icon] || "\u2B50"}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-sm sm:text-base font-semibold ${
                    isActive || isCompleted ? "text-white" : "text-zinc-400"
                  }`}
                >
                  {stage.name}
                </h3>
                {isActive && (
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-600">
                  {formatMET(stage.startMET * 1000)} → {formatMET(stage.endMET * 1000)}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-mono ${stage.color}`}>
                  {durationStr}
                </span>
              </div>
            </div>
          </div>

          <svg
            className={`w-4 h-4 text-zinc-600 transition-transform duration-300 flex-shrink-0 mt-0.5 ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Description — always visible */}
        <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-zinc-500 leading-relaxed">
          {stage.description}
        </p>

        {/* Expanded details */}
        <div
          className={`grid transition-all duration-300 ${
            expanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-white/5 pt-3">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3 sm:mb-4">
                {stage.details}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                <TelemetryItem
                  label="Peak Alt."
                  value={`${stage.altitude.peak.toLocaleString()} km`}
                />
                <TelemetryItem
                  label="Peak Vel."
                  value={`${stage.velocity.peak} km/s`}
                />
                <TelemetryItem
                  label="Dist. Start"
                  value={`${stage.distanceFromEarth.start.toLocaleString()} km`}
                />
                <TelemetryItem
                  label="Dist. End"
                  value={`${stage.distanceFromEarth.end.toLocaleString()} km`}
                />
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

function TelemetryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] rounded-lg p-2 sm:p-2.5">
      <div className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-zinc-600 mb-0.5">
        {label}
      </div>
      <div className="text-[10px] sm:text-xs font-mono text-zinc-300 break-all">{value}</div>
    </div>
  );
}
