

import { HeroContent } from "@/components/landing/HeroContent";
import { NetworkPulse } from "@/components/landing/NetworkPulse";
import { ModernFooter } from "@/components/landing/ModernFooter";
import Beams from "@/components/ui/Beams";
import { DynamicIsland } from "@/components/ui/DynamicIsland";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-black text-white selection:bg-indigo-500/30 relative overflow-y-auto lg:overflow-hidden">
      {/* Fixed Background */}
      <div className="fixed inset-0 z-0 pointer-events-none w-full h-full">
        <Beams
          beamWidth={3}
          beamHeight={30}
          beamNumber={20}
          lightColor="#C0C0C0" // Silver
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={30}
        />
      </div>

      {/* Floating Navbar */}
      <DynamicIsland />

      {/* Main Split Layout */}
      <div className="relative z-10 w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 px-6 md:px-12 lg:px-24 items-center py-24 lg:py-0">
        {/* Left Side: Hero Content */}
        <div className="flex flex-col justify-center h-full">
          <HeroContent />
        </div>

        {/* Right Side: Network Pulse */}
        <div className="flex flex-col justify-center h-full pb-12 lg:pb-0">
          <NetworkPulse />
        </div>
      </div>

      {/* Footer: Full on Mobile, Compact on Desktop */}
      <div className="relative z-20 w-full lg:absolute lg:bottom-0">
        <div className="lg:hidden">
            <ModernFooter />
        </div>
        <div className="hidden lg:block">
            <ModernFooter compact />
        </div>
      </div>
    </main>
  );
}
