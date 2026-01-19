import { z } from "zod";

// Email validation
const emailSchema = z.string().email("Invalid email format").toLowerCase().trim();

// Password validation - min 8 chars, at least one letter and one number
const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number");

// Name validation
const nameSchema = z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim();

// Role validation
const roleSchema = z.enum(["DEVELOPER", "FOUNDER", "INVESTOR"]).optional().default("DEVELOPER");

// Registration schema
export const registerSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
    location: z.string().max(100).optional(),

    // Developer fields
    skills: z.array(z.string().max(50)).max(20).optional(),
    experience: z.string().max(50).optional(),
    availability: z.string().max(50).optional(),
    rate: z.string().max(50).optional(),

    // Investor fields
    firm: z.string().max(100).optional(),
    checkSize: z.string().max(50).optional(),
    focus: z.string().max(200).optional(),

    // Founder fields
    startupName: z.string().max(100).optional(),
    pitch: z.string().max(1000).optional(),
    stage: z.string().max(50).optional(),
    websiteUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
}).superRefine((data, ctx) => {
    // Role-specific validation logic
    if (data.role === "DEVELOPER") {
        if (!data.skills || data.skills.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least one skill is required for developers",
                path: ["skills"]
            });
        }
        if (!data.experience) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Experience level is required",
                path: ["experience"]
            });
        }
    } else if (data.role === "FOUNDER") {
        if (!data.startupName) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Startup name is required",
                path: ["startupName"]
            });
        }
        if (!data.pitch || data.pitch.length < 50) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Pitch must be at least 50 characters to be meaningful",
                path: ["pitch"]
            });
        }
    } else if (data.role === "INVESTOR") {
        if (!data.checkSize) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Check size range is required",
                path: ["checkSize"]
            });
        }
    }
});

// Message schema with XSS prevention
export const messageSchema = z.object({
    conversationId: z.string().cuid(),
    content: z
        .string()
        .min(1, "Message cannot be empty")
        .max(1000, "Message must be less than 1000 characters")
        .trim(),
});

// Payment schema
export const paymentSchema = z.object({
    amount: z.number().positive("Amount must be positive").max(1000000, "Amount too large"),
    recipientId: z.string().min(1),
    recipientName: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    provider: z.enum(["PAYPAL", "CRYPTO", "CARD"]),
    idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

// API Key creation schema
export const apiKeySchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(50, "Name must be less than 50 characters")
        .trim(),
    permissions: z
        .array(z.enum(["read", "write", "admin"]))
        .min(1, "At least one permission is required")
        .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
