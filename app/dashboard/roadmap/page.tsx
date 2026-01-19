"use client";

import { RoadmapView } from "@/components/features/roadmap/RoadmapView";

export default function DashboardRoadmapPage() {
    return (
        <div className="container mx-auto">
            <RoadmapView readOnly={false} />
        </div>
    );
}
