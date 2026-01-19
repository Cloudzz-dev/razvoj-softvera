import React from 'react';
import { useEquityStore } from './store';
import { formatCurrency } from '@/lib/math/dilution';

export function SimulatorControls() {
    const {
        preMoneyValuation,
        investmentAmount,
        setPreMoneyValuation,
        setInvestmentAmount
    } = useEquityStore();

    return (
        <div className="space-y-8 p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
            {/* Pre-Money Valuation Control */}
            <div className="space-y-4">
                <div className="flex justify-between items-center text-white">
                    <label htmlFor="pre-money-slider" className="font-semibold text-lg">
                        Valuation Cap (Pre-Money)
                    </label>
                    <span className="font-mono text-indigo-400 text-xl font-medium">
                        {formatCurrency(preMoneyValuation)}
                    </span>
                </div>
                <input
                    id="pre-money-slider"
                    type="range"
                    min="1000000"
                    max="20000000"
                    step="100000"
                    value={preMoneyValuation}
                    onChange={(e) => setPreMoneyValuation(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    aria-label="Adjust Pre-Money Valuation"
                />
                <div className="flex justify-between text-xs text-zinc-500 px-1">
                    <span>$1M</span>
                    <span>$10M</span>
                    <span>$20M</span>
                </div>
            </div>

            {/* Investment Amount Control */}
            <div className="space-y-4">
                <div className="flex justify-between items-center text-white">
                    <label htmlFor="investment-slider" className="font-semibold text-lg">
                        Investment Amount
                    </label>
                    <span className="font-mono text-emerald-400 text-xl font-medium">
                        {formatCurrency(investmentAmount)}
                    </span>
                </div>
                <input
                    id="investment-slider"
                    type="range"
                    min="10000"
                    max="5000000"
                    step="10000"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    aria-label="Adjust Investment Amount"
                />
                <div className="flex justify-between text-xs text-zinc-500 px-1">
                    <span>$10k</span>
                    <span>$2.5M</span>
                    <span>$5M</span>
                </div>
            </div>
        </div>
    );
}
