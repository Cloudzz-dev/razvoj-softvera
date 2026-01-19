import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sanitizeText } from "@/lib/sanitize";

import { ensureRateLimit } from "@/lib/api-security";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/email";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";

const DAILY_REGISTRATION_LIMIT = 99;
const DAILY_REGISTRATION_WARNING_THRESHOLD = 98;

/**
 * Get today's registration count
 */
async function getTodayRegistrationCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.user.count({
        where: {
            createdAt: {
                gte: today,
                lt: tomorrow,
            },
        },
    });
}

export async function POST(req: Request) {
    try {

        // Rate limiting
        const limit = await ensureRateLimit(req, "register");
        if (limit) return limit;

        // Check daily registration limit
        const todayCount = await getTodayRegistrationCount();

        if (todayCount >= DAILY_REGISTRATION_LIMIT) {
            console.warn(`[REGISTRATION_LIMIT] Daily limit of ${DAILY_REGISTRATION_LIMIT} registrations reached`);
            return NextResponse.json(
                {
                    error: "Registration temporarily unavailable. Daily limit reached. Please try again tomorrow.",
                    warning: "DAILY_LIMIT_REACHED"
                },
                { status: 503 }
            );
        }

        // Log warning if approaching limit
        if (todayCount >= DAILY_REGISTRATION_WARNING_THRESHOLD) {
            console.warn(`[REGISTRATION_WARNING] Approaching daily limit: ${todayCount}/${DAILY_REGISTRATION_LIMIT} registrations today`);
        }

        const body = await req.json();

        // Validate input with Zod
        const validatedData = registerSchema.parse(body);

        // Extract and sanitize fields
        const {
            name: rawName,
            email,
            password,
            role: userRole,
            location,
            skills,
            experience,
            availability,
            rate,
            firm,
            checkSize,
            focus,
            startupName,
            pitch,
            stage,
            websiteUrl
        } = validatedData;

        // Sanitize text inputs
        const name = sanitizeText(rawName);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: userRole,
            },
        });

        // Create profile with role-specific data
        const profileData: any = {
            userId: user.id,
            location: location || null,
        };

        if (userRole === "DEVELOPER") {
            profileData.skills = skills || [];
            profileData.experience = experience || null;
            profileData.availability = availability || null;
            profileData.rate = rate || null;
        } else if (userRole === "INVESTOR") {
            profileData.firm = firm || null;
            profileData.checkSize = checkSize || null;
            profileData.focus = focus || null;
            profileData.portfolio = 0; // Start with 0 investments
        }

        await prisma.profile.create({
            data: profileData,
        });

        // If founder, create startup
        if (userRole === "FOUNDER" && startupName && pitch) {
            await prisma.startup.create({
                data: {
                    name: startupName,
                    pitch,
                    stage: stage || "Pre-seed",
                    websiteUrl: websiteUrl || null,
                    logo: "🚀", // Default emoji
                    founderId: user.id,
                },
            });
        }

        // Check for pending team invites (Case-insensitive)
        const pendingInvites = await prisma.teamInvite.findMany({
            where: {
                email: email.toLowerCase(),
                status: "PENDING",
            },
            include: {
                team: {
                    include: {
                        startup: true
                    }
                }
            }
        });

        for (const invite of pendingInvites) {
            // Check if invite is expired
            if (new Date() > invite.expiresAt) {
                await prisma.teamInvite.update({
                    where: { id: invite.id },
                    data: { status: "EXPIRED" }
                });
                continue;
            }

            // check if user is already a member (defensive)
            const existingMembership = await prisma.teamMembership.findUnique({
                where: {
                    teamId_userId: {
                        teamId: invite.teamId,
                        userId: user.id
                    }
                }
            });

            if (!existingMembership) {
                // Create membership
                await prisma.teamMembership.create({
                    data: {
                        teamId: invite.teamId,
                        userId: user.id,
                        role: invite.role
                    }
                });

                // Update invite status
                await prisma.teamInvite.update({
                    where: { id: invite.id },
                    data: { status: "ACCEPTED" }
                });

                // Determine notification logic based on role
                const roleText = invite.role === "ADMIN" ? "Co-founder" : "Team Member";

                // Notify new user
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        type: "team_join",
                        title: `Welcome to ${invite.team.startup.name}!`,
                        message: `You have been added as a ${roleText}.`,
                        link: "/dashboard/startups",
                    }
                });

                // Notify team owner (founder)
                await prisma.notification.create({
                    data: {
                        userId: invite.team.startup.founderId,
                        type: "team_join",
                        title: "New team member",
                        message: `${user.name} joined your team at ${invite.team.startup.name}`,
                        link: "/dashboard/members",
                    },
                });
            }
        }

        // Create welcome activity
        await prisma.activity.create({
            data: {
                userId: user.id,
                type: "welcome",
                message: `Welcome to DFDS.io, ${user.name}! 🎉`,
                icon: "🚀",
            },
        });

        // Generate verification code and send email
        const verificationCode = generateVerificationCode();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verificationToken.create({
            data: {
                identifier: email.toLowerCase(),
                token: verificationCode,
                expires,
            },
        });

        // Send verification email (don't await to speed up response)
        sendVerificationEmail({
            to: email,
            name: name || "there",
            code: verificationCode,
        }).catch(err => console.error("Failed to send verification email:", err));

        return NextResponse.json({
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
            requiresVerification: true,
        });
    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.issues },
                { status: 400 }
            );
        }
        console.error("REGISTRATION_ERROR", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
