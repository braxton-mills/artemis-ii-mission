const milestones = [
  {
    label: "First crewed flight beyond low Earth orbit since 1972",
    detail:
      "Artemis II sends four astronauts farther from Earth than any human has traveled in over 50 years, validating that Orion can keep a crew alive in deep space.",
  },
  {
    label: "Full shakedown of Orion's life-support systems",
    detail:
      "The 10-day mission tests the Environmental Control and Life Support System under real deep-space conditions — radiation, thermal extremes, and communications delays — that cannot be replicated in Earth orbit.",
  },
  {
    label: "First crewed test of the Space Launch System",
    detail:
      "SLS is the most powerful rocket ever flown. Artemis II proves its ascent, staging, and abort systems work with a crew aboard before committing to lunar-surface missions.",
  },
  {
    label: "Manual piloting in deep space",
    detail:
      "During proximity operations, the pilot hand-flies Orion around the spent ICPS stage — the first manual piloting of a deep-space vehicle since Apollo and a key rehearsal for future Gateway docking.",
  },
  {
    label: "Navigation and communication via the Deep Space Network",
    detail:
      "The crew tests voice, video, and telemetry links at lunar distances through NASA's Deep Space Network, validating the infrastructure that all future Artemis missions depend on.",
  },
  {
    label: "Fastest crewed re-entry in history",
    detail:
      "Returning at roughly 40,000 km/h, Orion's heat shield endures temperatures up to 2,760 °C during a skip re-entry — proving the thermal protection system before astronauts ride it down from the lunar surface.",
  },
];

export default function WhyThisMission() {
  return (
    <section className="py-20 px-6" id="why">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Why Artemis II Matters
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Before anyone can land on the Moon, every system has to work with
            humans on board. Artemis II is the proving flight — the
            mission that turns hardware into a trusted spacecraft.
          </p>
        </div>

        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-5 flex gap-4 items-start"
            >
              <span className="text-xs font-mono text-zinc-600 mt-0.5 flex-shrink-0 w-5 text-right">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white leading-snug">
                  {m.label}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
                  {m.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
