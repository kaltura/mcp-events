# 🎉 Kaltura Events MCP Server

A production-ready Model Context Protocol (MCP) server for the Kaltura Event Platform API. This server provides AI assistants with tools and resources for creating, managing, and interacting with Kaltura virtual events.

---

## 🌟 Overview

This MCP server enables AI assistants to interact seamlessly with the Kaltura Events Platform through the standardized Model Context Protocol. It provides a secure, multi-tenant architecture supporting both local and remote deployments.

**Key Capabilities:**
- 🎯 Create, update, and delete virtual events
- 📅 Manage event sessions and resources
- 🔧 Access event templates and timezone information
- 🔐 Per-connection authentication with Kaltura Session isolation
- 🌐 Multiple transport protocols (stdio, SSE, Streamable HTTP)

---

## 🚀 Transport Modes

### Local Development (stdio)
Best for: Local testing with Claude Desktop, VS Code Copilot, or other desktop AI assistants.

```json
{
  "transport": "stdio",
  "command": "node",
  "args": ["/path/to/mcp-events/dist/index.js"],
  "env": {
    "KALTURA_ENV": "NVP",
    "KALTURA_KS": "your-ks-here"
  }
}
```

### Remote Deployment (SSE)
Best for: Production HTTPS deployments, legacy MCP clients.

**Endpoint:** `https://your-domain.com/mcp/events`

```bash
# Connect with Authorization header
curl -N -H "Authorization: ks YOUR_KS" https://your-domain.com/mcp/events
```

### Remote Deployment (Streamable HTTP)
Best for: Modern MCP clients, improved performance.

**Endpoint:** `https://your-domain.com/mcp/streamable`

```bash
# Single endpoint handles all requests
curl -X POST \
  -H "Authorization: ks YOUR_KS" \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize",...}' \
  https://your-domain.com/mcp/streamable
```

---

## 🛠️ Available Tools

| Tool | Description | Capabilities |
|------|-------------|--------------|
| `create-event` | Create a new virtual event | Name, dates, templates, timezone configuration |
| `list-events` | Retrieve available events | Filtering, pagination support |
| `update-event` | Modify event properties | Name, dates, banner, logo, labels |
| `delete-event` | Remove an event | Permanently deletes event and resources |
| `list-event-sessions` | Get event sessions | Filter by tags |
| `create-event-session` | Add session to event | Configure session details, visibility |

---

## 📚 Available Resources

- **events**: Access information about specific Kaltura events
- **preset-templates**: Browse available preset templates for event creation

---

## 📦 Installation

### Prerequisites

- Node.js 18+ (required for dependencies)
- Access to Kaltura Event Platform APIs
- Valid Kaltura Session (KS) with appropriate permissions

### Setup

```bash
# Clone the repository
git clone https://github.com/kaltura/mcp-events.git
cd mcp-events

# Install dependencies
npm install

# Build the project
npm run build

# For local stdio mode
node dist/index.js

# For remote HTTP/HTTPS mode
npm start  # Starts NestJS server on port 3000
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KALTURA_ENV` | API environment (`NVP`, `EU`, `DE`) | `NVP` |
| `KALTURA_KS` | Kaltura Session (stdio mode only) | - |
| `KALTURA_SERVER_PORT` | Server port (remote mode) | `3000` |
| `KALTURA_PUBLIC_API` | Custom Public API URL | Auto-configured |
| `KALTURA_EP_API` | Custom EP API URL | Auto-configured |
| `KALTURA_BE_API` | Custom BE API URL | Auto-configured |

### API Environments

- **NVP** (Production): Default North America environment
- **EU**: European region deployment (IRP)
- **DE**: German region deployment (FRP)

---

## 🔐 Authentication & Security

### Multi-Tenant Architecture

Each connection creates an isolated MCP server instance with its own Kaltura Session:
- ✅ No cross-tenant data leakage
- ✅ Per-connection KS validation
- ✅ Secure session management

### Authentication Methods

**stdio mode** (local):
```bash
export KALTURA_KS="your-ks-here"
node dist/index.js
```

**Remote mode** (HTTP/HTTPS):
```bash
# Authorization header (company standard)
Authorization: ks YOUR_KS
# or
Authorization: bearer YOUR_KS
```

---

## 💻 Integration Examples

### Claude Desktop

```json
{
  "mcpServers": {
    "kaltura-events": {
      "command": "/path/to/node",
      "args": ["/path/to/mcp-events/dist/index.js"],
      "env": {
        "KALTURA_ENV": "NVP",
        "KALTURA_KS": "your-ks-here"
      }
    }
  }
}
```

Configuration file location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code CLI

```bash
claude mcp add-json kaltura-events '{
  "transport":"stdio",
  "command":"node",
  "args":["~/mcp-events/dist/index.js"],
  "env":{"KALTURA_ENV":"NVP","KALTURA_KS":"your-ks"}
}'
```

### VS Code Copilot

Create `.vscode/mcp.json` in your project:

```json
{
  "mcpServers": {
    "kaltura-events": {
      "transport": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/mcp-events/dist/index.js"],
      "env": {
        "KALTURA_ENV": "NVP",
        "KALTURA_KS": "your-ks-here"
      }
    }
  }
}
```

### Remote HTTPS Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const transport = new SSEClientTransport(
  new URL('https://your-domain.com/mcp/events'),
  {
    headers: {
      'Authorization': 'ks YOUR_KS_HERE'
    }
  }
);

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, { capabilities: {} });

await client.connect(transport);
```

---

## 🧪 Testing

### Using MCP Inspector

```bash
# Start the inspector
npx @modelcontextprotocol/inspector

# Connect to SSE endpoint
URL: http://localhost:3000/mcp/events
Transport: SSE
Bearer Token: your-ks-here

# Or connect to Streamable HTTP endpoint
URL: http://localhost:3000/mcp/streamable
Transport: Streamable HTTP
Bearer Token: your-ks-here
```

### Using curl

```bash
# Test SSE connection
curl -N -H "Authorization: ks YOUR_KS" http://localhost:3000/mcp/events

# Test Streamable HTTP
curl -X POST \
  -H "Authorization: ks YOUR_KS" \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  http://localhost:3000/mcp/streamable
```

---

## 🏗️ Architecture

### Transport Layer

```
MCP Server
├── stdio transport (StdioServerTransport)
│   └── For local AI assistants
│
├── SSE transport (SSEServerTransport)
│   ├── GET /mcp/events - Stream connection
│   └── POST /mcp/events - Client messages
│
└── Streamable HTTP transport (StreamableHTTPServerTransport)
    └── ALL /mcp/streamable - Unified endpoint
```

### Per-Connection Isolation

```typescript
// Each connection gets:
- Unique sessionId
- Isolated MCP server instance
- Captured KS in closure
- Independent tool/resource handlers
```

---

## 📝 Development

### Project Structure

```
mcp-events/
├── apps/mcp-server/
│   ├── src/
│   │   ├── api/           # API clients (PublicAPI, EP)
│   │   ├── config/        # Configuration management
│   │   ├── health/        # Health check endpoint
│   │   ├── resources/     # MCP resources
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── tools/         # MCP tools implementation
│   │   ├── utils/         # Helper utilities
│   │   ├── app.module.ts  # NestJS module
│   │   ├── mcp.controller.ts  # HTTP endpoints
│   │   ├── mcp.service.ts     # Core MCP logic
│   │   ├── main.ts        # NestJS bootstrap
│   │   └── server.ts      # stdio entry point
│   └── dist/              # Compiled output
└── README.md
```

### Running in Development

```bash
# Build and watch
npm run build -- --watch

# Start server (remote mode)
npm start

# Start with specific port
KALTURA_SERVER_PORT=4000 npm start
```

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing patterns
- All tests pass
- Documentation is updated
- Commit messages are descriptive

---

## 📄 License

[Add your license information here]

---

## 🔗 Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Kaltura Event Platform API Documentation](https://developer.kaltura.com/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

---

**Made with ❤️ by the Kaltura Team**
