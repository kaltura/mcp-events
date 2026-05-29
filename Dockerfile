# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY apps/ ./apps/
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && rm -rf ~/.npm
COPY --from=builder /app/dist ./dist
USER node

# Default: stdio transport (spawned by MCP client)
# Override to HTTP: docker run ... node dist/mcp-server/src/http.js
CMD ["node", "dist/mcp-server/src/stdio.js"]
