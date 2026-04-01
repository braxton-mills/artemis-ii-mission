"use client";

import { useScrollProgress } from "../_hooks/useScrollProgress";

export default function ScrollProgress() {
  const { progress } = useScrollProgress();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px]">
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{
          width: `${progress * 100}%`,
          background:
            "linear-gradient(90deg, #f97316, #3b82f6, #8b5cf6, #22d3ee)",
        }}
      />
    </div>
  );
}
