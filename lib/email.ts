import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

// Lazy initialization to avoid build-time errors when env var is not available
let resend: Resend | null = null;

function getResend(): Resend {
    if (!resend) {
        const apiKey = env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error("RESEND_API_KEY environment variable is not set");
        }
        resend = new Resend(apiKey);
    }
    return resend;
}

interface SendVerificationEmailParams {
    to: string;
    name: string;
    code: string;
}

export async function sendVerificationEmail({ to, name, code }: SendVerificationEmailParams) {
    const formattedCode = code.split("").join(" ");

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your DFDS.io account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <img src="https://startit.cloudzz.dev/start-it-favicon.png" alt="DFDS.io" width="48" height="48" style="border-radius: 12px; margin-bottom: 16px;">
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">DFDS.io</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 40px 30px 40px;">
                            <p style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0;">
                                Hi ${name}! 👋
                            </p>
                            <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                                Thanks for signing up for DFDS.io! Use the code below to verify your email address.
                            </p>
                            
                            <!-- Verification Code Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background: linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(79, 70, 229, 0.05) 100%); border: 2px solid rgba(99, 102, 241, 0.4); border-radius: 12px; padding: 24px;">
                                        <p style="color: #a5b4fc; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">
                                            Verification Code
                                        </p>
                                        <p style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                                            ${formattedCode}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #71717a; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
                                This code expires in <strong style="color: #a1a1aa;">24 hours</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="color: #52525b; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                If you didn't create an account on DFDS.io, you can safely ignore this email.
                            </p>
                            <p style="color: #3f3f46; font-size: 11px; margin: 16px 0 0 0; text-align: center;">
                                DFDS.io • Where Innovation Meets Capital
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    const { data, error } = await getResend().emails.send({
        from: "DFDS.io <noreply@verify.cloudzz.dev>",
        to,
        subject: "Verify your DFDS.io account",
        html,
    });

    if (error) {
        console.error("Failed to send verification email:", error);
        throw new Error("Failed to send verification email");
    }

    return data;
}

export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

interface SendTeamInviteEmailParams {
    to: string;
    inviterName: string;
    startupName: string;
    token: string;
}

export async function sendTeamInviteEmail({ to, inviterName, startupName, token }: SendTeamInviteEmailParams) {
    const inviteUrl = `${env.NEXTAUTH_URL || "https://dfds"}/invite/${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been invited to join ${startupName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
                    
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <img src="https://startit.cloudzz.dev/start-it-favicon.png" alt="DFDS.io" width="48" height="48" style="border-radius: 12px; margin-bottom: 16px;">
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">Team Invitation</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 20px 40px 30px 40px;">
                            <p style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0;">
                                You've been invited! 🎉
                            </p>
                            <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                                <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join <strong style="color: #a5b4fc;">${startupName}</strong> on DFDS.io.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #71717a; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
                                This invitation expires in <strong style="color: #a1a1aa;">7 days</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="color: #52525b; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                If you didn't expect this invitation, you can safely ignore this email.
                            </p>
                            <p style="color: #3f3f46; font-size: 11px; margin: 16px 0 0 0; text-align: center;">
                                DFDS.io • Where Innovation Meets Capital
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    const { data, error } = await getResend().emails.send({
        from: "DFDS.io <noreply@verify.cloudzz.dev>",
        to,
        subject: `${inviterName} invited you to join ${startupName}`,
        html,
    });

    if (error) {
        console.error("Failed to send team invite email:", error);
        throw new Error("Failed to send team invite email");
    }

    return data;
}

interface SendPasswordResetEmailParams {
    to: string;
    name: string;
    resetUrl: string;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: SendPasswordResetEmailParams) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your DFDS.io password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
                    
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <img src="https://startit.cloudzz.dev/start-it-favicon.png" alt="DFDS.io" width="48" height="48" style="border-radius: 12px; margin-bottom: 16px;">
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">Password Reset</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 20px 40px 30px 40px;">
                            <p style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0;">
                                Hi ${name}! 👋
                            </p>
                            <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                                We received a request to reset your password. Click the button below to choose a new one.
                            </p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #71717a; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
                                If you didn't request this, you can safely ignore this email. This link will expire in <strong style="color: #a1a1aa;">1 hour</strong>.
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="color: #52525b; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                                DFDS.io • Where Innovation Meets Capital
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

    const { data, error } = await getResend().emails.send({
        from: "DFDS.io <noreply@verify.cloudzz.dev>",
        to,
        subject: "Reset your DFDS.io password",
        html,
    });

    if (error) {
        console.error("Failed to send password reset email:", error);
        throw new Error("Failed to send password reset email");
    }

    return data;
}
