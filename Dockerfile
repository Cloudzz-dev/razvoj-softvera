# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --ignore-scripts --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# Get dependencies and schema for generation
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY DFDS_Dokumentacija.md ./DFDS_Dokumentacija.md

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values for build time validation
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXTAUTH_SECRET="build_secret_placeholder_must_be_at_least_32_chars"
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

