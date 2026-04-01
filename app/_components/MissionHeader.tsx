export default function MissionHeader() {
  return (
    <header className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Subtle radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Mission badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass-card text-sm font-mono text-blue-300 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          NASA &middot; ARTEMIS PROGRAM
        </div>

        {/* Title */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-6 animate-fade-in-up-delay-1">
          <span className="bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            ARTEMIS
          </span>
          <br />
          <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent">
            II
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-4 animate-fade-in-up-delay-2">
          Humanity&apos;s return to the Moon.
        </p>
        <p className="text-sm sm:text-base text-zinc-500 max-w-xl mx-auto mb-12 animate-fade-in-up-delay-3">
          The first crewed lunar flyby since Apollo 17 in 1972 — four astronauts,
          ten days, and a quarter-million miles of space between Earth and the Moon.
        </p>

        {/* Scroll indicator */}
        <div className="animate-float">
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <span className="text-xs font-mono uppercase tracking-widest">
              Scroll to explore
            </span>
            <svg
              width="20"
              height="28"
              viewBox="0 0 20 28"
              fill="none"
              className="opacity-50"
            >
              <rect
                x="1"
                y="1"
                width="18"
                height="26"
                rx="9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="10" cy="9" r="2" fill="currentColor">
                <animate
                  attributeName="cy"
                  values="9;17;9"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1;0.3;1"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
