

import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CallToAction } from "@/components/landing/CallToAction";
import { ModernFooter } from "@/components/landing/ModernFooter";
import Beams from "@/components/ui/Beams";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white selection:bg-indigo-500/30 relative">
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
      <div className="relative z-10 w-full flex flex-col items-center">
        <HeroSection />
        <HowItWorks />
        <CallToAction />
        <ModernFooter />
      </div>
    </main>
  );
}
