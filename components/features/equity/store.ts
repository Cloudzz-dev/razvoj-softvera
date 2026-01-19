import { create } from 'zustand';
import { calculatePostMoney, calculateInvestorOwnership, calculateSharePrice, calculateNewShares, BPS_SCALE } from '@/lib/math/dilution';

interface EquityState {
    // Inputs
    preMoneyValuation: number;     // in USD
    investmentAmount: number;      // in USD
    founderOwnership: number;      // in BPS (e.g. 10000 = 100%)
    employeePool: number;          // in BPS

    // Derived / Calculated (Computed on demand or stored if expensive)
    postMoneyValuation: number;
    investorOwnership: number;     // in BPS
    founderDilutedOwnership: number; // in BPS

    // Actions
    setPreMoneyValuation: (amount: number) => void;
    setInvestmentAmount: (amount: number) => void;
    setFounderOwnership: (bps: number) => void;
    reset: () => void;
}

export const useEquityStore = create<EquityState>((set, get) => ({
    // Initial State defaults
    preMoneyValuation: 5000000, // $5M
    investmentAmount: 500000,   // $500k
    founderOwnership: 10000,    // 100% initially owned by founders (simplified for demo)
    employeePool: 0,            // 0% initially

    postMoneyValuation: 5500000,
    investorOwnership: 909,      // ~9.09%
    founderDilutedOwnership: 9091, // ~90.91%

    setPreMoneyValuation: (amount) => {
        const safeAmount = Math.floor(amount);
        const { investmentAmount, founderOwnership } = get();
        const postMoney = calculatePostMoney(safeAmount, investmentAmount);
        const invOwnership = calculateInvestorOwnership(investmentAmount, postMoney);
        const diluted = Math.round((founderOwnership * (BPS_SCALE - invOwnership)) / BPS_SCALE);

        set({
            preMoneyValuation: safeAmount,
            postMoneyValuation: postMoney,
            investorOwnership: invOwnership,
            founderDilutedOwnership: diluted
        });
    },

    setInvestmentAmount: (amount) => {
        const safeAmount = Math.floor(amount);
        const { preMoneyValuation, founderOwnership } = get();
        const postMoney = calculatePostMoney(preMoneyValuation, safeAmount);
        const invOwnership = calculateInvestorOwnership(safeAmount, postMoney);
        const diluted = Math.round((founderOwnership * (BPS_SCALE - invOwnership)) / BPS_SCALE);

        set({
            investmentAmount: safeAmount,
            postMoneyValuation: postMoney,
            investorOwnership: invOwnership,
            founderDilutedOwnership: diluted
        });
    },

    setFounderOwnership: (bps) => {
        // This acts as resetting the "Initial State" of founders before this round
        const { investmentAmount, postMoneyValuation } = get();
        const invOwnership = calculateInvestorOwnership(investmentAmount, postMoneyValuation);
        const diluted = Math.round((bps * (BPS_SCALE - invOwnership)) / BPS_SCALE);

        set({
            founderOwnership: bps,
            founderDilutedOwnership: diluted
        });
    },

    reset: () => {
        set({
            preMoneyValuation: 5000000,
            investmentAmount: 500000,
            founderOwnership: 10000,
            employeePool: 0,
            postMoneyValuation: 5500000,
            investorOwnership: 909,
            founderDilutedOwnership: 9091
        });
    }
}));
