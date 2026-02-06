
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

export const DEMO_TRANSACTIONS = [
    {
        id: "tx_1",
        amount: 5000,
        netAmount: 4875,
        serviceFee: 125,
        status: "COMPLETED",
        type: "INCOMING",
        senderId: "inv_1",
        receiverId: "demo_user",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        sender: { name: "Acme VC Fund", email: "invest@acme.vc" },
        receiver: { name: "Demo User", email: "demo@cloudzz.dev" }
    },
    {
        id: "tx_2",
        amount: 1200,
        netAmount: 1200, // Outgoing doesn't show netAmount usually, but for consistency
        serviceFee: 0,
        status: "COMPLETED",
        type: "OUTGOING",
        senderId: "demo_user",
        receiverId: "dev_1",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        sender: { name: "Demo User", email: "demo@cloudzz.dev" },
        receiver: { name: "Sarah Engineer", email: "sarah@dev.co" }
    },
    {
        id: "tx_3",
        amount: 250,
        netAmount: 243.75,
        serviceFee: 6.25,
        status: "COMPLETED",
        type: "INCOMING",
        senderId: "user_5",
        receiverId: "demo_user",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
        sender: { name: "John Doe", email: "john@example.com" },
        receiver: { name: "Demo User", email: "demo@cloudzz.dev" }
    }
];

export const DEMO_TEAM_MEMBERS = [
    {
        id: "mem_1",
        name: "Alex Rivera",
        email: "alex@cloudzz.dev",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        platformRole: "DEVELOPER",
        startupRole: "CTO",
        joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
        isActive: true
    },
    {
        id: "mem_2",
        name: "Jessica Chen",
        email: "jessica@cloudzz.dev",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
        platformRole: "FOUNDER",
        startupRole: "Product Lead",
        joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
        isActive: true
    },
    {
        id: "mem_3",
        name: "David Kim",
        email: "david@cloudzz.dev",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        platformRole: "DEVELOPER",
        startupRole: "Frontend Engineer",
        joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
        isActive: true
    }
];
