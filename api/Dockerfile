# ── Stage 1: Install dependencies ──────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production    # ci = clean install, exact versions from lock file

# ── Stage 2: Runtime ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: don't run as root inside the container
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodeuser

# Create necessary directories and set permissions
RUN mkdir -p logs uploads/resumes && chown -R nodeuser:nodejs logs uploads

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs src/ ./src/
COPY --chown=nodeuser:nodejs package.json ./

USER nodeuser
EXPOSE 5000
CMD ["node", "src/server.js"]