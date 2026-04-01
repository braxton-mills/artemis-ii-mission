"use client";

import { useState, useEffect } from "react";
import {
  T_ZERO,
  MISSION_DURATION_SECONDS,
  missionStages,
  type MissionStage,
} from "../_lib/mission-data";

export interface MissionTimeState {
  met: number; // milliseconds from T-0 (negative = pre-launch)
  metSeconds: number;
  phase: MissionStage;
  phaseIndex: number;
  isPreLaunch: boolean;
  isComplete: boolean;
  missionProgress: number; // 0-1 across entire mission
  mounted: boolean;
}

function getMET(): number {
  return Date.now() - T_ZERO.getTime();
}

function getPhaseIndex(metSeconds: number): number {
  for (let i = missionStages.length - 1; i >= 0; i--) {
    if (metSeconds >= missionStages[i].startMET) return i;
  }
  return 0;
}

export function useMissionTime(): MissionTimeState {
  const [met, setMet] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMet(getMET());
    setMounted(true);

    const id = setInterval(() => {
      setMet(getMET());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const metSeconds = met / 1000;
  const phaseIndex = getPhaseIndex(metSeconds);

  return {
    met,
    metSeconds,
    phase: missionStages[phaseIndex],
    phaseIndex,
    isPreLaunch: met < 0,
    isComplete: metSeconds > MISSION_DURATION_SECONDS,
    missionProgress: Math.max(
      0,
      Math.min(1, metSeconds / MISSION_DURATION_SECONDS)
    ),
    mounted,
  };
}

export function formatMET(metMs: number): string {
  const negative = metMs < 0;
  const abs = Math.abs(metMs);
  const totalSeconds = Math.floor(abs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const prefix = negative ? "T\u2212" : "T+";
  const pad = (n: number) => String(n).padStart(2, "0");

  if (days > 0) {
    return `${prefix}${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${prefix}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
