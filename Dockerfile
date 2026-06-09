# ─────────────────────────────────────────────────────────────────────────
# Multi-stage build: Dependencies + Build + Runtime
# ─────────────────────────────────────────────────────────────────────────

# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# ─────────────────────────────────────────────────────────────────────────
# Stage 2: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────
# Stage 3: Runtime
FROM node:20-alpine

WORKDIR /app

# Add tini for proper signal handling
RUN apk add --no-cache tini

# Set environment to production
ENV NODE_ENV=production

# Copy production dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy Prisma schema from builder
COPY --from=builder /app/prisma ./prisma

# Copy package files
COPY package.json package-lock.json ./

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["npm", "start"]
