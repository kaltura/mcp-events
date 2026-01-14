# 🎉 Kaltura Events MCP Server

A production-ready Model Context Protocol (MCP) server for the Kaltura Event Platform API. This server provides AI assistants with tools and resources for creating, managing, and interacting with Kaltura virtual events.

---

**Key Capabilities:**
- 🎯 Create, update, and delete virtual events
- 📅 Manage event sessions and resources
- 🔧 Access event templates and timezone information
- 🔐 Per-connection authentication with Kaltura Session isolation
- 🌐 Multiple transport protocols (stdio, SSE, Streamable HTTP)

---

###  Tools

- **create-event**: Create a new virtual event with specified configuration
- **list-events**: Retrieve a list of available events with filtering and pagination
- **update-event**: Modify existing event properties
- **delete-event**: Remove an event and its resources
- **create-event-session**: Add a new session to an existing event
- **list-event-sessions**: Get all sessions for a specific event

## 🚀 Transport Modes

### Local stdio
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
* **list-event-sessions**-sessions: Get all sessions for a specific event
* **create-event-session**-session: Add a new session to an existing event

---

## 📚 Available Resources

- **events**: Access information about specific Kaltura events
- **preset-templates**: Browse available preset templates for event creation

---

## 📦 Installation

### Prerequisites

- Node.js 22+ (required for dependencies)
- Valid Kaltura Session (KS) with appropriate permissions

### Setup

```bash
# Clone the repository
git clone https://github.com/kaltura/mcp-events.git
cd mcp-events

# Install dependencies & build
npm install
npm run build

# Run local stdio mode
npm run start:stdio
# Run streamable http 
npm run start:http
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KALTURA_ENV` | API environment (`NVP`, `EU`, `DE`) | `NVP` |
| `KALTURA_SERVER_PORT` | Server port (remote mode) | `3000` |
| `KALTURA_KS` | Kaltura Session for STDIO only | - |

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

**Made with ❤️ by the Kaltura Team**
