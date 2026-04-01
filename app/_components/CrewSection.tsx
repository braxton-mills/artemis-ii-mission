import { crew } from "../_lib/mission-data";
import CrewCard from "./CrewCard";

export default function CrewSection() {
  return (
    <section className="py-20 px-6" id="crew">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            The Crew
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Four astronauts chosen to ride the most powerful rocket ever built
            farther from Earth than any human in over 50 years.
          </p>
        </div>

        {/* Crew grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {crew.map((member) => (
            <CrewCard key={member.name} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
