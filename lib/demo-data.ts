
export const DEMO_FOUNDER_STATS = {
    companyName: "Cloudzz Demo",
    raised: "$5M",
    stage: "Series A",
    teamSize: 12,
    activeUsers: 8432, // Matches the graph trend roughly or just a static number
    burnRate: 60000,
    runway: "12 months",
};

// Helper to generate consistent fake trend data
function generateTrendData(days: number, startValue: number, growthRate: number) {
    const data = [];
    let currentValue = startValue;
    const now = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Add some random accumulation/noise
        const change = currentValue * (Math.random() * growthRate);
        currentValue += change;

        data.push({
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: Math.round(currentValue)
        });
    }
    return data;
}

export const DEMO_GROWTH_DATA = {
    active_users: generateTrendData(30, 1000, 0.05), // Start at 1000, grow ~5%
    revenue: generateTrendData(30, 5000, 0.02), // Start at 5000, grow ~2%
    users: [], // Not used in FounderDashboard currently but good to have signature match
    connections: []
};
