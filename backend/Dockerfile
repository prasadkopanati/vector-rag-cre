# Build for linux/amd64 (Cloud Run target). When building on Apple Silicon run:
#   docker buildx build --platform linux/amd64 -t IMAGE_NAME .
# This ensures native LanceDB bindings match the Cloud Run runtime.

# --- Build stage ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --- Production stage ---
FROM node:20-slim AS runner
WORKDIR /app

# LanceDB data directory — populated at startup from GCS snapshot in production
RUN mkdir -p /data/lancedb

# Copy compiled JS and full node_modules (LanceDB has native .node binaries
# that must come from the same build environment)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/index.js"]
