# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your Next.js project. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` (recommended for Next.js 16+)
- **Server-side tracking** via `posthog-node` for backend event capture
- **Reverse proxy configuration** in `next.config.mjs` to avoid tracking blockers
- **User identification** on login and signup for cross-session tracking
- **PostHog reset on logout** to properly handle user sessions
- **Error tracking** with `posthog.captureException()` for key user flows
- **12 custom events** covering signup, activation, engagement, and conversion funnels

## Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `user_signed_up` | User successfully created an account (developer, founder, or investor) | `app/join/page.tsx` |
| `user_signed_in` | User successfully logged in via email/password credentials | `app/login/page.tsx` |
| `user_signed_out` | User signed out of the application | `components/dashboard/UserNav.tsx` |
| `login_failed` | User login attempt failed due to invalid credentials | `app/login/page.tsx` |
| `password_reset_requested` | User requested a password reset email | `app/login/page.tsx` |
| `email_verified` | User successfully verified their email address | `app/verify-email/VerifyEmailContent.tsx` |
| `payment_sent` | User successfully sent a payment to another user | `components/payments/PaymentModal.tsx` |
| `message_sent` | User sent a message in a conversation | `components/messaging/ConversationView.tsx` |
| `discover_search_performed` | User searched for startups, developers, or investors on the discover page | `app/discover/page.tsx` |
| `profile_viewed` | User viewed another user's public profile page | `app/profile/[id]/page.tsx` |
| `cta_clicked` | User clicked a call-to-action button to join or go to dashboard | `components/landing/CallToAction.tsx` |
| `ai_assistant_query_sent` | User submitted a query to the AI assistant | `components/ai/AiAssistant.tsx` |
| `contact_email_clicked` | User clicked the email link on the contact page | `app/contact/page.tsx` |
| `cookie_consent_accepted` | User accepted the cookie consent banner | `components/ui/CookieConsent.tsx` |

## Files Created/Modified

### New Files
- `instrumentation-client.ts` - Client-side PostHog initialization for Next.js 16+
- `lib/posthog-server.ts` - Server-side PostHog client for backend tracking

### Modified Files
- `next.config.mjs` - Added reverse proxy rewrites for PostHog
- `components/providers/PostHogProvider.tsx` - Simplified to work with instrumentation-client.ts
- `components/dashboard/UserNav.tsx` - Added logout tracking and PostHog reset
- All event files listed in the table above

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- **Analytics basics**: https://eu.posthog.com/project/110198/dashboard/466502

### Insights
- **Signup to Activation Funnel**: https://eu.posthog.com/project/110198/insights/usaRuV8U
  - Tracks user journey from signup through email verification to first login
- **Key User Actions Over Time**: https://eu.posthog.com/project/110198/insights/6VvjrSS9
  - Tracks core user engagement actions including messages sent, payments, and AI assistant usage
- **CTA Conversion Rate**: https://eu.posthog.com/project/110198/insights/LUzlm9BS
  - Tracks call-to-action button clicks on the landing page by type
- **User Discovery Activity**: https://eu.posthog.com/project/110198/insights/fXeeZzJG
  - Tracks profile views and discover page searches
- **User Signups by Role**: https://eu.posthog.com/project/110198/insights/wFhSjSQZ
  - Breakdown of new user signups by role type (Developer, Founder, Investor)

## Environment Variables

Your PostHog environment variables are already configured in `.env`:
```
NEXT_PUBLIC_POSTHOG_KEY=phc_xguqfYb1pmDlyoZM55qsjyXroIkg2yICeYooK6qIKnw
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

## Additional Notes

- Automatic pageview and pageleave tracking is enabled via the `defaults: '2025-05-24'` configuration
- Error tracking is enabled via `capture_exceptions: true`
- The reverse proxy routes all PostHog requests through `/ingest` to avoid ad blockers
- User identification happens on login and signup, using email as the distinct ID
- The `posthog.reset()` function is called on logout to properly separate user sessions
