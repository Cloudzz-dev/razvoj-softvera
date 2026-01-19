# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies (uses local prisma from package.json, not global)
RUN npm ci --ignore-scripts

# Generate Prisma client in deps stage where network is available
RUN npx prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client using LOCAL prisma (not npx which may use global)
# We run this again to ensure everything is correct, but it should use the cached engine
RUN ./node_modules/.bin/prisma generate

# Build the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_SECRET="build_secret_placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
RUN npm run build

# Stage 3: Runner (production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl procps

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3753

ENV PORT=3753
ENV HOSTNAME="0.0.0.0"

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3753/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]

