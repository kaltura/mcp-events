# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for the Kaltura Events Platform API. It exposes tools and resources that allow AI assistants to create, manage, and interact with Kaltura virtual events.

## Development Commands

```bash
npm run build          # Compile TypeScript → dist/
npm run start:stdio    # Run stdio server (reads .env)
npm run start:http     # Run HTTP/NestJS server (reads .env)
npm run inspect:stdio  # MCP Inspector against stdio server
npm run inspect:http   # MCP Inspector against running HTTP server
npm run lint           # ESLint
```

There are no automated tests (`npm test` exits with an error).

## Architecture

### Two Transport Modes

The server runs in two distinct modes with different entry points:

**Stdio mode** (`apps/mcp-server/src/stdio.ts` → `server.ts`):
- Single `McpServer` instance per process, connected via `StdioServerTransport`
- `KALTURA_KS` must be set as an environment variable at startup
- Used for local Claude Desktop / Claude Code integrations

**HTTP mode** (`apps/mcp-server/src/http.ts` → NestJS app):
- NestJS application with `McpController` at `POST /mcp`
- A **fresh `McpServer` + `StreamableHTTPServerTransport` is created per request** (stateless)
- KS is read from the `Authorization` header on each request (`ks <KS>` or `bearer <KS>`)
- `McpService` owns the per-request server lifecycle

### Request Flow (HTTP mode)
```
HTTP POST /mcp
  → McpController.handleRequest()
  → getKsFromRequest() extracts KS from Authorization header
  → McpService.handleRequest(ks, req, res)
  → new McpServer() + registerEventTools() + registerEventResources()
  → StreamableHTTPServerTransport handles the MCP protocol
```

### Key Abstractions

- **`PublicApiClient`** (`api/publicApiClient.ts`): NestJS `@Injectable()` service wrapping the Kaltura Events REST API. All methods accept a `ks` parameter — there is no shared session state. Headers are set per-request: `Authorization: Bearer <ks>`, `X-Kaltura-Client-Tag: mcp-events-pa-client`.
- **`registerEventTools()`** / **`registerEventResources()`**: Pure functions that attach tools/resources to any `McpServer` instance, capturing `ks` and `publicApiClient` in closures.
- **`eventSchemas.ts`**: Zod schemas for all tool inputs. `templateIdEnum` is built from `PresetTemplates` at module load time. `SupportedTimeZones` drives the timezone enum.

### TypeScript Compilation
- Source: `apps/` → Output: `dist/` (maps to `dist/mcp-server/src/`)
- CommonJS modules, ES2020 target, NestJS decorators enabled (`emitDecoratorMetadata`, `experimentalDecorators`)

### Configuration (`config/config.ts`)
Env var `KALTURA_PUBLIC_API` overrides everything; otherwise `KALTURA_ENV` selects the region:
- `NVP` (default): `events-api.nvp1.ovp.kaltura.com`
- `EU`: `events-api.irp2.ovp.kaltura.com`
- `DE`: `events-api.frp2.ovp.kaltura.com`

Additional env vars: `KALTURA_KS` (required for stdio, per-request for HTTP), `KALTURA_SERVER_PORT` (default `3000`).

## Agent Integration

**Stdio (recommended for local use):**
```json
{
  "command": "docker",
  "args": ["run", "-i", "--rm", "-e", "KALTURA_KS", "ghcr.io/kaltura/mcp-events:latest"],
  "env": { "KALTURA_KS": "your-kaltura-session" }
}
```

**HTTP:**
```bash
claude mcp add --transport http kaltura-events http://localhost:3000/mcp \
  --header "Authorization: KS ${KALTURA_KS}"
```
