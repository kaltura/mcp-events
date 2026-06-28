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
- All scopes granted (trusted local environment)

**HTTP mode** (`apps/mcp-server/src/http.ts` → NestJS app):
- NestJS application with `McpController` at `POST /mcp`
- A **fresh `McpServer` + `StreamableHTTPServerTransport` is created per request** (stateless)
- Requests authenticated via JWT bearer token (see Auth section)
- `McpService` owns the per-request server lifecycle

### Request Flow (HTTP mode)
```
HTTP POST /mcp
  → BearerAuthMiddleware (mcp-auth) verifies JWT, populates req.auth
  → McpController.handleRequest()
  → extracts ks from req.auth.claims.ks, scopes from req.auth.scopes
  → McpService.handleRequest(ks, req, res, scopes)
  → new McpServer() + registerAllDomainTools() + registerAllDomainResources()
    (only tools/resources covered by the token's scopes are registered)
  → StreamableHTTPServerTransport handles the MCP protocol
```

### Key Abstractions

- **`PublicApiClient`** (`api/publicApiClient.ts`): NestJS `@Injectable()` service wrapping the Kaltura Events REST API. All methods accept a `ks` parameter — there is no shared session state. Headers are set per-request: `Authorization: Bearer <ks>`, `X-Kaltura-Client-Tag: mcp-events-pa-client`.
- **`registerAllDomainTools()`** / **`registerAllDomainResources()`** (`domains/index.ts`): Fan out to per-domain registration functions, passing `scopes`. Each domain only registers the tools its scopes permit.
- **`auth/`** (`auth/scopes.ts`, `auth/mcp-auth-setup.ts`, `auth/bearer-auth.middleware.ts`): Auth infrastructure — scope definitions, MCPAuth instance, JWT verification middleware.
- **`eventSchemas.ts`**: Zod schemas for all tool inputs. `templateIdEnum` is built from `PresetTemplates` at module load time. `SupportedTimeZones` drives the timezone enum.

### TypeScript Compilation
- Source: `apps/` → Output: `dist/` (maps to `dist/mcp-server/src/`)
- CommonJS modules, ES2020 target, NestJS decorators enabled (`emitDecoratorMetadata`, `experimentalDecorators`)
- `mcp-auth` is an ESM-only package loaded via Node 22's `require(esm)` support; the import in `auth/mcp-auth-setup.ts` carries a `@ts-expect-error TS1479` comment to suppress the TypeScript compile-time check.

### Configuration (`config/config.ts`)
Env var `KALTURA_PUBLIC_API` overrides everything; otherwise `KALTURA_ENV` selects the region:
- `NVP` (default): `events-api.nvp1.ovp.kaltura.com`
- `EU`: `events-api.irp2.ovp.kaltura.com`
- `DE`: `events-api.frp2.ovp.kaltura.com`

Additional env vars: `KALTURA_KS` (required for stdio), `KALTURA_SERVER_PORT` (default `3000`).

HTTP-mode-only env vars (all required):
- `MCP_SERVER_URL` — public URL of this MCP server; used as the OAuth protected resource identifier and the JWT `aud` claim value
- `AUTH_GATEWAY_JWT_SECRET` — symmetric HMAC secret for JWT verification
- `KALTURA_AUTH_GATEWAY_URL` — URL of the Kaltura Auth Gateway (default: `https://auth-gateway.kaltura.com/mcp-events`)

## Auth (HTTP mode)

The server implements [OAuth 2.0 Protected Resource Metadata (RFC 9728)](https://datatracker.ietf.org/doc/html/rfc9728) via the `mcp-auth` library.

**Discovery endpoint:** `GET /.well-known/oauth-protected-resource` (no auth required)  
Returns the resource identifier (`MCP_SERVER_URL`), supported scopes, and the auth gateway URL.

**Bearer auth:** Every `POST /mcp` request must carry `Authorization: Bearer <jwt>`.  
The JWT must include:
- `iss`: `KALTURA_AUTH_GATEWAY_URL`
- `aud`: `MCP_SERVER_URL`
- `sub`, `client_id`: required by mcp-auth
- `ks`: Kaltura Session (custom claim — passed to the Kaltura API)
- `scope`: space-separated granted scopes (e.g. `events:read events:write`)

**Scopes and tool visibility:** Tools are conditionally registered based on the JWT's `scope` claim. A token without `mcp:events:write` simply won't see write tools in `tools/list`. Two scopes are supported:
- `mcp:events:read` — enables all read/list tools across all domains
- `mcp:events:write` — enables all create/update/delete tools across all domains

## Agent Integration

**Stdio (recommended for local use):**
```json
{
  "command": "docker",
  "args": ["run", "-i", "--rm", "-e", "KALTURA_KS", "ghcr.io/kaltura/mcp-events:latest"],
  "env": { "KALTURA_KS": "your-kaltura-session" }
}
```

**HTTP (JWT bearer):**
```bash
claude mcp add --transport http kaltura-events http://localhost:3000/mcp \
  --header "Authorization: Bearer ${JWT_TOKEN}"
```
