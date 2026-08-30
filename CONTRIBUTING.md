# Contributing - Local Development Setup

## Running the Server Locally

### Container Setup

#### 1. Build the Docker Image
```bash
docker build -t kaltura-events-local .
```

#### 2. Run the Container

**Linux:**
```bash
docker run -i --rm --network host \
  -e _AUTH_GATEWAY_URL=http://localhost:3001 \
  -e _MCP_SERVER_URL=http://localhost:3000 \
  -e KALTURA_PUBLIC_API=https://events-api.nvq2.ovp.kaltura.com/api/v1 \
  kaltura-events-local node dist/mcp-server/src/http.js
```

**Windows / macOS:**

No access to machine localhost, so need to use `host.docker.internal` instead.
```bash
docker run -i --rm -p 3000:3000 \
  -e _AUTH_GATEWAY_URL=http://host.docker.internal:3001 \
  -e _MCP_SERVER_URL=http://localhost:3000 \
  -e KALTURA_PUBLIC_API=https://events-api.nvq2.ovp.kaltura.com/api/v1 \
  kaltura-events-local node dist/mcp-server/src/http.js
```


### Local Setup

#### 1. Start the Server
```bash
node --env-file=".env" ./dist/mcp-server/src/http.js
```

## Register with Claude
```bash
claude mcp add -t http kaltura-events-local http://localhost:3000/mcp
```