# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for the Kaltura Events Platform API. It exposes tools and resources that allow AI assistants to create, manage, and interact with Kaltura virtual events.

## Development Commands

### Build and Run
- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- **Start**: `npm run start` - Runs the MCP server with environment variables from `.env`
- **Inspect**: `npm run inspect` - Runs the MCP inspector for debugging/testing
- **Lint**: `npm run lint` - Runs ESLint on TypeScript files

### Testing the MCP Server
Use the MCP inspector to test the server locally:
```bash
npm run inspect
```

## Architecture

### MCP Server Structure
The server follows the standard MCP SDK pattern:

1. **Entry Points** (`src/stdio.ts`, `src/http.ts`): Launch the server in stdio or HTTP mode
2. **Server Setup** (`src/server.ts`): Initializes McpServer, registers tools and resources, connects to stdio transport
3. **Tools** (`src/tools/eventTools.ts`): Registers MCP tools for event operations (create, list, update, delete events and sessions)
4. **Resources** (`src/resources/`): Registers MCP resources for event info, templates, and timezones
5. **API Client** (`src/api/publicApiClient.ts`): Handles all HTTP communication with Kaltura Public API

### Configuration
Environment-based config (`src/config/config.ts`) supports three Kaltura regions:
- **NVP** (default): Production environment
- **EU**: European region (IRP)
- **DE**: German region (FRP)
- **Custom**: Via `KALTURA_PUBLIC_API` env var

Required environment variables:
- `KALTURA_KS`: Kaltura Session token (must contain a user)
- `KALTURA_ENV`: Environment selector (NVP/EU/DE)
- `KALTURA_PUBLIC_API`: Custom API URL (optional)

### Key Files
- **publicApiClient.ts**: Singleton API client with methods for all Kaltura Events API endpoints
- **eventSchemas.ts**: Zod schemas for input validation
- **eventTools.ts**: Tool registration with validation and error handling
- **eventResources.ts**: Resource endpoints for events and templates

## Important Notes

### API Client Pattern
- The `PublicAPIClient` is instantiated as a singleton (`publicApiClient`)
- All API methods are async and return promises
- Error handling includes trace IDs and Kaltura session info from response headers
- The client automatically adds Authorization bearer token, Content-Type, and X-Kaltura-Client-Tag headers

### MCP Tools vs Resources
- **Tools**: Perform actions (create, update, delete) - registered with `server.tool()`
- **Resources**: Read-only data access - registered with `server.registerResource()`

### TypeScript Configuration
- Compiles to CommonJS (not ESM)
- Target: ES2020
- Output directory: `dist/`
- Source directory: `src/`

## Agent Integration

The MCP server communicates over stdio transport. Agents configure it by pointing to the compiled entry point:

```json
{
  "command": "node",
  "args": ["/path/to/dist/mcp-server/src/stdio.js"],
  "env": {
    "KALTURA_ENV": "NVP",
    "KALTURA_KS": "your-kaltura-session"
  }
}
```
