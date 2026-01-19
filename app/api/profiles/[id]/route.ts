import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                image: true,
                role: true,
                createdAt: true,
                profile: {
                    select: {
                        bio: true,
                        location: true,
                        avatarUrl: true,
                        skills: true,
                        githubUrl: true,
                        linkedinUrl: true,
                        twitterUrl: true,
                        websiteUrl: true,
                        experience: true,
                        availability: true,
                        rate: true,
                        firm: true,
                        checkSize: true,
                        portfolio: true,
                        focus: true,
                        projects: {
                            orderBy: { createdAt: "desc" },
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                url: true,
                                githubUrl: true,
                                imageUrl: true,
                                techStack: true,
                                featured: true,
                            },
                        },
                    },
                },
                startups: {
                    select: {
                        id: true,
                        name: true,
                        pitch: true,
                        stage: true,
                        logo: true,
                    },
                },
                _count: {
                    select: {
                        followers: true,
                        following: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching public profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}
