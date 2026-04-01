import MissionHeader from "./_components/MissionHeader";
import CountdownTimer from "./_components/CountdownTimer";
import MissionScene from "./_components/MissionScene";
import MissionTimeline from "./_components/MissionTimeline";
import CrewSection from "./_components/CrewSection";
import WhyThisMission from "./_components/WhyThisMission";
import Glossary from "./_components/Glossary";
import StarField from "./_components/StarField";
import ScrollProgress from "./_components/ScrollProgress";

export default function Page() {
  return (
    <>
      <ScrollProgress />
      <StarField />

      <div className="relative z-10">
        <MissionHeader />

        {/* Divider */}
        <div className="flex justify-center">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
        </div>

        <CountdownTimer />
        <MissionScene />
        <MissionTimeline />

        {/* Divider */}
        <div className="flex justify-center py-8">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />
        </div>

        <CrewSection />

        {/* Divider */}
        <div className="flex justify-center py-8">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />
        </div>

        <WhyThisMission />

        {/* Divider */}
        <div className="flex justify-center py-8">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
        </div>

        <Glossary />

        {/* Footer */}
        <footer className="py-16 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <p className="text-xs font-mono text-zinc-700 leading-relaxed">
              This is an educational visualization of the Artemis II mission.
              Data is approximate and based on publicly available NASA mission
              profiles. Not affiliated with NASA.
            </p>
            <div className="mt-6 flex justify-center gap-4 text-xs font-mono text-zinc-600">
              <span>Artemis II</span>
              <span className="text-zinc-800">&middot;</span>
              <span>NASA</span>
              <span className="text-zinc-800">&middot;</span>
              <span>To The Moon</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
