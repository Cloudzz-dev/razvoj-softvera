"use client";

import { RoadmapView } from "@/components/features/roadmap/RoadmapView";

export default function PublicRoadmapPage() {
    return (
        <div className="min-h-screen pt-20 pb-10 px-4 md:px-8 max-w-7xl mx-auto">
            <RoadmapView readOnly={true} />
        </div>
    );
}
