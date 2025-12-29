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
ENV HOSTNAME=0.0.0.0

# Copy necessary files for monorepo
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package*.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

# Copy built packages
COPY --from=builder /app/packages ./packages

# Create data directory
RUN mkdir -p /app/apps/web/.bosdb-data

EXPOSE 3000

# Use npm start from the web workspace
WORKDIR /app/apps/web
CMD ["npm", "run", "start"]
