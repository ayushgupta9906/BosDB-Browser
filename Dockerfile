# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/core/package*.json ./packages/core/
COPY packages/db-adapters/package*.json ./packages/db-adapters/
COPY packages/security/package*.json ./packages/security/
COPY packages/utils/package*.json ./packages/utils/
COPY packages/version-control/package*.json ./packages/version-control/

RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built application
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Create data directory
RUN mkdir -p /app/apps/web/.bosdb-data

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

EXPOSE ${PORT}

CMD ["node", "apps/web/server.js"]

