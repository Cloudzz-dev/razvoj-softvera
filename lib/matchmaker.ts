/**
 * THE UNICORN MATCHING ENGINE (PROTOTYPE)
 * 
 * Demonstrates the transition from "Wrapper" (vibes) to "Proprietary" (Math).
 * Logic:
 * 1. Founders and Investors are represented as high-dimensional vectors.
 * 2. Vectors are derived from structured data (focus, check size, skills) + unstructured text (bio, pitch).
 * 3. We use Cosine Similarity to find the "angle" between a Founder and an Investor.
 *    - 1.0 = Perfect Alignment (Same direction)
 *    - 0.0 = Orthogonal (Unrelated)
 *    - -1.0 = Opposite (Active mismatch)
 */

export interface VectorProfile {
    id: string;
    type: 'INVESTOR' | 'STARTUP';
    embedding: number[]; // e.g. 1536-dimensional vector from OpenAI
    metadata: Record<string, any>;
}

export interface MatchResult {
    targetId: string;
    score: number; // 0.0 to 1.0 compatibility score
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string[];
}

export class Matchmaker {

    /**
     * Executes the Vector Search via Database RPC.
     * In production, this calls Supabase's `match_investors` PostgreSQL function.
     */
    private async fetchMatchesFromDB(sourceEmbedding: number[]): Promise<any[]> {
        // SIMULATION: In a real app, this would be:
        // const { data, error } = await supabase.rpc('match_investors', {
        //    query_embedding: sourceEmbedding,
        //    match_threshold: 0.5,
        //    match_count: 10
        // });

        console.log(`[MATCHMAKER] RPC Call: 'match_investors' with embedding length ${sourceEmbedding.length}`);

        // Return structured mock data for now, as if it came from pgvector
        return [
            { id: "inv_1", similarity: 0.89, metadata: { name: "Marko Vukov", focus: "SaaS", stage: "Pre-seed" } },
            { id: "inv_2", similarity: 0.76, metadata: { name: "Crypto Fund X", focus: "Web3", stage: "Seed" } },
            { id: "inv_3", similarity: 0.45, metadata: { name: "Conservative Capital", focus: "Retail", stage: "Series A" } }
        ];
    }

    /**
     * Finds the best investor matches for a given profile using Vector Search.
     */
    async findMatches(sourceProfile: VectorProfile): Promise<MatchResult[]> {
        console.log(`[MATCHMAKER] Initiating semantic search for: ${sourceProfile.id}`);

        // 1. Perform Vector Search (RPC -> pgvector)
        const rawMatches = await this.fetchMatchesFromDB(sourceProfile.embedding);

        // 2. Hydrate & Rank Results
        const results: MatchResult[] = rawMatches.map(match => {
            const reasons: string[] = [];

            // Post-processing logic on top of cosine similarity
            if (match.similarity > 0.85) reasons.push("Strong Semantic Overlap");
            if (sourceProfile.metadata.stage === match.metadata.stage) reasons.push("Stage Fit");

            return {
                targetId: match.id,
                score: match.similarity,
                confidence: match.similarity > 0.8 ? 'HIGH' : 'MEDIUM',
                reasoning: reasons
            };
        });

        // 3. Sort by final score
        return results
            .filter(r => r.score > 0.6)
            .sort((a, b) => b.score - a.score);
    }
}
