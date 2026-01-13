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

* **create-event**: Create a new virtual event with specified configuration
* **list-events**: Retrieve a list of available events with filtering and pagination
* **update-event**: Modify existing event properties
* **delete-event**: Remove an event and its resources
* **list-event**-sessions: Get all sessions for a specific event
* **list-session**-sepakers: Get all speakers for a specific event session
* **create-event**-session: Add a new session to an existing event

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

```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KALTURA_ENV` | API environment (`NVP`, `EU`, `DE`) | `NVP` |
| `KALTURA_KS` | Kaltura Session (stdio mode only) | - |
| `KALTURA_SERVER_PORT` | Server port (remote mode) | `3000` |

### For custom API endpoints (instead of using `KALTURA_ENV`)
| Variable | Description | Default |
|----------|-------------|---------|
| `KALTURA_PUBLIC_API` | Custom Public API URL | - |
| `KALTURA_BE_API` | Custom BE API URL | - |

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


## 🔗 Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Kaltura Event Platform API Documentation](https://developer.kaltura.com/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

---

**Made with ❤️ by the Kaltura Team**
