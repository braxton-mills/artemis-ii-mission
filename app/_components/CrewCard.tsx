import Image from "next/image";
import type { CrewMember } from "../_lib/mission-data";

const crewImages: Record<string, string> = {
  "Reid Wiseman": "/images/reid_wiseman.jpg",
  "Victor Glover": "/images/victor_glover.jpg",
  "Christina Koch": "/images/christina_koch.jpg",
  "Jeremy Hansen": "/images/jeremy_hansen.jpg",
};

const roleColors: Record<string, string> = {
  Commander: "from-amber-500 to-orange-600",
  Pilot: "from-blue-500 to-cyan-500",
  "Mission Specialist 1": "from-purple-500 to-pink-500",
  "Mission Specialist 2": "from-emerald-500 to-teal-500",
};

export default function CrewCard({ member }: { member: CrewMember }) {
  const gradient = roleColors[member.role] || "from-zinc-500 to-zinc-600";
  const imageSrc = crewImages[member.name];

  return (
    <div className="glass-card glass-card-hover rounded-xl p-6 transition-all duration-300 group">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-4">
        {imageSrc ? (
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src={imageSrc}
              alt={member.name}
              width={160}
              height={160}
              className="w-full h-full object-cover object-top"
            />
          </div>
        ) : (
          <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 group-hover:scale-105 transition-transform`}
          >
            {member.initials}
          </div>
        )}
        <div>
          <h3 className="text-white font-semibold text-lg">{member.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">{member.role}</span>
            <span className="text-zinc-700">&middot;</span>
            <span className="text-xs font-mono text-zinc-500">{member.agency}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed">{member.bio}</p>

      <div className="mt-4 flex flex-col gap-1">
        <span className="text-xs text-zinc-600 font-mono">
          {member.nationality}
        </span>
        {member.alma.map((school) => (
          <span key={school} className="text-[11px] text-zinc-500">
            {school}
          </span>
        ))}
      </div>
    </div>
  );
}
