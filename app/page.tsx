

import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CallToAction } from "@/components/landing/CallToAction";
import { ModernFooter } from "@/components/landing/ModernFooter";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white selection:bg-indigo-500/30">
      <HeroSection />
      <HowItWorks />
      <CallToAction />
      <ModernFooter />
    </main>
  );
}
