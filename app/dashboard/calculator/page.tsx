import { Suspense } from 'react';
import { EquitySimulator } from '@/components/features/equity/EquitySimulator';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Equity Simulator | DFDS.io',
    description: 'Visualize startup equity dilution and funding rounds with our interactive calculator.',
};

export default function CalculatorPage() {
    return (
        <main className="min-h-screen bg-black text-white p-4 pt-24">
            <div className="container mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Startup Equity Simulator
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        Understand how funding rounds impact your ownership. interactive, precise, and shareable.
                    </p>
                </header>

                <Suspense fallback={<div className="text-center text-zinc-500 py-20">Loading Calculator...</div>}>
                    <EquitySimulator />
                </Suspense>
            </div>
        </main>
    );
}
