import { z } from 'zod';

/**
 * Environment Variable Schema
 * 
 * Defines the required format and presence for all environment variables.
 * Using zod ensures that we fail fast if the configuration is invalid.
 */
const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET should be at least 32 characters for security"),

  // Security
  CSRF_SECRET: z.string().min(32).optional(),

  // OAuth Providers
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // External Services
  RESEND_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

  // Infrastructure
  REDIS_URL: z.string().url().optional(),

  // Pusher/Soketi (Real-time messaging)
  PUSHER_HOST: z.string().optional(),
  PUSHER_PORT: z.string().optional(),
  SOKETI_DEFAULT_APP_ID: z.string().optional(),
  SOKETI_DEFAULT_APP_SECRET: z.string().optional(),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_HOST: z.string().optional(),
  NEXT_PUBLIC_PUSHER_PORT: z.string().optional(),

  // Crypto Payments
  WALLET_ADDRESS: z.string().optional(),

  // Internal API Key (for service-to-service auth)
  INTERNAL_API_KEY: z.string().min(32).optional(),

  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Validate and export environment variables
 */
const getProcessEnv = () => ({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: (process.env.NEXTAUTH_URL?.startsWith('http') ? process.env.NEXTAUTH_URL : (process.env.NEXTAUTH_URL ? `https://${process.env.NEXTAUTH_URL}` : undefined)) || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  CSRF_SECRET: process.env.CSRF_SECRET,
  GITHUB_ID: process.env.GITHUB_ID,
  GITHUB_SECRET: process.env.GITHUB_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  REDIS_URL: process.env.REDIS_URL,
  PUSHER_HOST: process.env.PUSHER_HOST,
  PUSHER_PORT: process.env.PUSHER_PORT,
  SOKETI_DEFAULT_APP_ID: process.env.SOKETI_DEFAULT_APP_ID,
  SOKETI_DEFAULT_APP_SECRET: process.env.SOKETI_DEFAULT_APP_SECRET,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_HOST: process.env.NEXT_PUBLIC_PUSHER_HOST,
  NEXT_PUBLIC_PUSHER_PORT: process.env.NEXT_PUBLIC_PUSHER_PORT,
  WALLET_ADDRESS: process.env.WALLET_ADDRESS,
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

export const validateEnv = () => {
  // Skip full validation on client to prevent exposing secrets or errors
  // BUT: Run check in test environment (JSDOM defines window) to ensure tests work
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    return true;
  }

  const parsed = envSchema.safeParse(getProcessEnv());

  if (!parsed.success) {
    const errors = parsed.error.issues.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n');
    console.error(`❌ Invalid environment configuration:\n${errors}`);

    if (process.env.NODE_ENV === 'production') {
      throw new Error("Invalid environment configuration. Application cannot start in production.");
    }
    return false;
  }
  return true;
};

// Create a proxied env object that validates on first access
// This avoids throwing during build time if some vars are missing,
// but ensures safety during runtime.
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop: keyof z.infer<typeof envSchema>) {
    // Client-side safety: If on client, only allow NEXT_PUBLIC_ access regardless of other checks
    // (Though technically ReferenceError handles most, this is a safety net)
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      if (typeof prop === 'string' && !prop.startsWith('NEXT_PUBLIC_')) {
        // Ideally we might log a warning or return undefined, but to prevent crash loops:
        return undefined;
      }
    }

    // Granular validation: only validate the specific property being accessed
    const rawValue = getProcessEnv()[prop];
    const propertySchema = envSchema.shape[prop as keyof typeof envSchema.shape];

    if (!propertySchema) {
      // If property is not in schema, just return raw value or undefined
      return rawValue;
    }

    const result = propertySchema.safeParse(rawValue);

    // Special handling for optional external services to avoid crashes
    if (!result.success) {
      const isOptional = propertySchema instanceof z.ZodOptional;
      if (isOptional) return undefined;

      // In production, we ONLY throw if it's a required variable (not optional) and missing
      if (process.env.NODE_ENV === 'production') {
        // Check if value is truly required (not optional)
        const isOptional = propertySchema instanceof z.ZodOptional;

        if (!isOptional && (rawValue === undefined || rawValue === "")) {
          throw new Error(`Environment variable validation failed for ${String(prop)}. It is required but missing or invalid.`);
        }
      }

      // Fallback to raw value in non-production or for optional values
      return rawValue;
    }

    return result.data;
  }
});