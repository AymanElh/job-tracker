# ── Stage 1: Install & Build ────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Next.js standalone mode bundles only what's needed
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: Runner ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextuser

# Copy only the standalone output — not all node_modules
COPY --from=builder --chown=nextuser:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextuser:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextuser:nodejs /app/public ./public

USER nextuser
EXPOSE 3000
CMD ["node", "server.js"]