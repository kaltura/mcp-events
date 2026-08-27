# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build
npm run build          # tsc → dist/

# Run (requires dist/ to exist)
npm run start:stdio    # stdio transport (uses KALTURA_KS from .env)
npm run start:http     # HTTP transport (requires _MCP_SERVER_URL + _AUTH_GATEWAY_URL)

# Dev/debug
npm run inspect:stdio  # MCP Inspector UI for stdio mode
npm run inspect:http   # MCP Inspector UI for HTTP mode (server must be running)

# Lint
npm run lint           # eslint

# Lint + format check
npx prettier --check .
```

No test suite exists yet (`npm test` exits with an error).

Node version is pinned in `.nvmrc`. Run `nvm use` before installing.

## Architecture

The server has **two runtime modes** sharing the same tool/resource logic:

- **Stdio** (`stdio.ts` → `server.ts`): single-process, trusted — `KALTURA_KS` is read from env and all scopes are granted. Used for local/Claude Desktop usage.
- **HTTP** (`http.ts` → NestJS `AppModule`): multi-tenant, OAuth-protected — a fresh `McpServer` is spun up per request (stateless). The `BearerAuthMiddleware` verifies JWT bearer tokens via `mcp-auth`, which fetches JWKS from the auth gateway. The KS is extracted from a custom `ks` claim in the verified JWT, and scopes are extracted from the token's scope claim.

### Key files

| File                                                 | Role                                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/mcp-server/src/server.ts`                      | Stdio bootstrap — creates `McpServer`, registers tools/resources, connects stdio transport                                                                   |
| `apps/mcp-server/src/http.ts`                        | HTTP bootstrap — NestJS app factory, CORS, RFC 9728 protected resource metadata                                                                              |
| `apps/mcp-server/src/mcp.service.ts`                 | Stateless per-request MCP handler (HTTP mode)                                                                                                                |
| `apps/mcp-server/src/mcp.controller.ts`              | NestJS controller at `/mcp` — extracts `ks` and `scopes` from `req.auth`                                                                                     |
| `apps/mcp-server/src/auth/bearer-auth.middleware.ts` | NestJS middleware wrapping `mcp-auth` JWT verification                                                                                                       |
| `apps/mcp-server/src/auth/mcp-auth-setup.ts`         | `MCPAuth` instance + `createBearerAuthMiddleware()` — manually supplies auth server metadata because the Kaltura Auth Gateway has no OIDC discovery endpoint |
| `apps/mcp-server/src/auth/scopes.ts`                 | Two scopes: `mcp:events:read` / `mcp:events:write`                                                                                                           |
| `apps/mcp-server/src/domains/index.ts`               | Aggregates all domain `registerXxxTools` / `registerXxxResources` calls                                                                                      |
| `apps/mcp-server/src/api/publicApiClient.ts`         | All Kaltura REST API calls; used as a NestJS injectable                                                                                                      |
| `apps/mcp-server/src/config/config.ts`               | Env-var config; selects API base URL by `KALTURA_ENV` (`NVP`/`EU`/`DE`) or `KALTURA_PUBLIC_API`                                                              |

### Adding a new domain

Each domain lives under `apps/mcp-server/src/domains/<name>/` with three files:

- `schemas.ts` — Zod schemas for tool input DTOs
- `tools.ts` — `registerXxxTools(server, ks, publicApiClient, scopes)` — gates write tools behind `mcp:events:write` and read tools behind `mcp:events:read` using `hasScopes()`
- `resources.ts` — `registerXxxResources(...)` if the domain exposes MCP resources

Then export the register functions from `domains/index.ts`.

### Scope enforcement

Tools are registered conditionally at server-init time based on the granted scopes (not enforced per-call). `hasScopes(granted, required)` in `auth/scope-check.ts` handles this. In stdio mode all scopes are granted unconditionally.

## Environment variables

Copy `.env.template` to `.env`. Required vars depend on mode:

| Var                  | Required for                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KALTURA_KS`         | Stdio mode (and HTTP dev shortcut)                                                                                                                                                                 |
| `_MCP_SERVER_URL`    | HTTP mode — becomes the OAuth resource identifier                                                                                                                                                  |
| `_AUTH_GATEWAY_URL`  | HTTP mode — JWKS + token endpoint base URL                                                                                                                                                         |
| `KALTURA_ENV`        | Both — selects region (`NVP`/`EU`/`DE`); defaults to `NVP`                                                                                                                                         |
| `KALTURA_PUBLIC_API` | Both — overrides `KALTURA_ENV` with a custom API URL                                                                                                                                               |
| `_AUTH_DEBUG`        | HTTP mode — set to `1`/`true` to include verbose JWT rejection cause/detail in logs and the client response, for diagnosing OAuth issues. Defaults to off; never leave enabled in production.     |

