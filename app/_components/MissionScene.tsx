"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useMissionTime, formatMET } from "../_hooks/useMissionTime";
import {
  missionStages,
  MISSION_DURATION_SECONDS,
} from "../_lib/mission-data";
import type { CameraMode } from "./Scene3D";

const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="h-full rounded-2xl glass-card flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-zinc-600">
          Loading 3D Scene...
        </p>
      </div>
    </div>
  ),
});

export default function MissionScene() {
  const mission = useMissionTime();
  const [mode, setMode] = useState<"live" | "manual">("live");
  const [manualProgress, setManualProgress] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>("overview");

  const activeProgress =
    mode === "live" ? mission.missionProgress : manualProgress;

  // Compute phase index for manual progress
  const activePhaseIndex = useMemo(() => {
    if (mode === "live") return mission.phaseIndex;
    const metSeconds = manualProgress * MISSION_DURATION_SECONDS;
    for (let i = missionStages.length - 1; i >= 0; i--) {
      if (metSeconds >= missionStages[i].startMET) return i;
    }
    return 0;
  }, [mode, manualProgress, mission.phaseIndex]);

  const activePhase = missionStages[activePhaseIndex];

  // MET display for manual mode
  const activeMET = useMemo(() => {
    if (mode === "live") return mission.met;
    return manualProgress * MISSION_DURATION_SECONDS * 1000;
  }, [mode, manualProgress, mission.met]);

  const activeDay = useMemo(() => {
    const metSec =
      mode === "live"
        ? mission.metSeconds
        : manualProgress * MISSION_DURATION_SECONDS;
    return Math.max(1, Math.ceil(metSec / 86400));
  }, [mode, manualProgress, mission.metSeconds]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setManualProgress(val);
      if (mode === "live") setMode("manual");
    },
    [mode]
  );

  const handleGoLive = useCallback(() => {
    setMode("live");
  }, []);

  const handleCameraMode = useCallback((m: CameraMode) => {
    setCameraMode(m);
  }, []);

  const cameraModes: { mode: CameraMode; label: string }[] = [
    { mode: "follow", label: "Follow Orion" },
    { mode: "earth", label: "Earth" },
    { mode: "moon", label: "Moon" },
    { mode: "overview", label: "Overview" },
  ];

  return (
    <section className="py-12 px-6" id="3d-view">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Mission Trajectory
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Interactive 3D visualization of the free-return trajectory
            around the Moon. Drag to rotate, scroll to zoom, right-click
            to pan.
          </p>
        </div>

        {/* Container with overlay controls */}
        <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden glass-card">
          {/* Top bar: camera modes + live toggle */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center gap-2">
            {/* Live button */}
            <button
              onClick={handleGoLive}
              className={`
                px-3 py-1.5 rounded-full text-[11px] font-mono font-bold
                backdrop-blur-md border transition-all duration-300 select-none
                ${
                  mode === "live"
                    ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              LIVE
            </button>

            <div className="w-px h-5 bg-white/10" />

            {/* Camera mode buttons */}
            {cameraModes.map(({ mode: m, label }) => (
              <button
                key={m}
                onClick={() => handleCameraMode(m)}
                className={`
                  px-3 py-1.5 rounded-full text-[11px] font-mono
                  backdrop-blur-md border transition-all duration-200 select-none
                  ${
                    cameraMode === m
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 3D Canvas */}
          <Scene3D
            missionProgress={activeProgress}
            phaseIndex={activePhaseIndex}
            cameraMode={cameraMode}
            onCameraModeChange={setCameraMode}
          />

          {/* Bottom: Timeline */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-4 pt-6 bg-gradient-to-t from-black/60 to-transparent">
            <input
              type="range"
              min={0}
              max={1}
              step={0.0001}
              value={activeProgress}
              onChange={handleSliderChange}
              className="timeline-slider w-full"
            />
            <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-zinc-500">
              <span>{formatMET(activeMET)}</span>
              <span className={activePhase.color}>{activePhase.shortName}</span>
              <span>Day {activeDay}/10</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs font-mono text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gradient-to-r from-orange-500 via-blue-500 to-purple-500 rounded" />
            <span>Traveled path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500/20 rounded border-dashed" />
            <span>Remaining path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Orion</span>
          </div>
        </div>
      </div>
    </section>
  );
}
