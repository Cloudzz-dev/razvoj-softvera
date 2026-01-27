import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0B]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]" />
      <GlassCard className="max-w-md w-full text-center p-12">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-6">Page Not Found</h2>
        <p className="text-zinc-400 mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" passHref>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-6">
            Go Home
          </Button>
        </Link>
      </GlassCard>
    </div>
  );
}
