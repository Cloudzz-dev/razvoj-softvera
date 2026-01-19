import Paywall from "@/components/demo/Paywall";

export default function PaywallDemoPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold text-white mb-8">x402 Protocol Demo</h1>
            <Paywall />
        </div>
    );
}
