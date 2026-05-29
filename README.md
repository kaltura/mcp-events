# 🤖 Kaltura Events MCP Server
A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the Kaltura Event Platform API.

## Table of Contents

- [Overview](#-overview)
- [Installation](#%EF%B8%8F-installation)
  - [Docker — stdio](#docker--stdio)
  - [Docker — HTTP](#docker--http)
- [Environment Variables](#-environment-variables)

---

## ☰ Overview

The Kaltura Events MCP Server exposes Kaltura's Event Platform API as MCP tools and resources, allowing any MCP-compatible AI agent to manage virtual events programmatically.

**Key capabilities:**

- Create, update, and delete virtual events
- Manage event sessions and resources
- Access event templates and timezone information
- Per-connection authentication with Kaltura Session (KS) isolation
- Multiple transport protocols: `stdio` and Streamable HTTP


Tools

  | Tool | Description |
  |------|-------------|
  | `create-event` | Create a new virtual event with specified configuration |
  | `list-events` | Retrieve a list of events with filtering and pagination |
  | `update-event` | Modify existing event properties |
  | `delete-event` | Remove an event and its associated resources |
  | `create-event-session` | Add a new session to an existing event |
  | `list-event-sessions` | Get all sessions for a specific event |


Resources

  | Resource | Description |
  |----------|-------------|
  | `events` | Access information about specific Kaltura events |
  | `preset-templates` | Browse available preset templates for event creation |


---

## 🗄️ Installation

**(Current Prerequisite) Build the image locally:**

```bash
git clone https://github.com/kaltura/mcp-events.git
cd mcp-events
docker build -t kaltura-mcp-events .
```

### Docker — stdio

The MCP client spawns the container on demand. `KALTURA_KS` is passed from your local environment into the container at startup.


**Adding via Claude Code** — CLI:

```bash
claude mcp add kaltura-events docker -- run -i --rm -e KALTURA_KS kaltura-mcp-events
```

**Adding via Claude Desktop** — add to `claude_desktop_config.json` and restart:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kaltura-events": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "KALTURA_KS", "kaltura-mcp-events"],
      "env": {
        "KALTURA_KS": "${KALTURA_KS}"
      }
    }
  }
}
```


---

### Docker — HTTP

The container runs as a persistent server. `KALTURA_KS` is **not** set on the container — it is sent per-request in the `Authorization` header by the client.

**Manually Start the Server**:

```bash
docker run -p 3000:3000 kaltura-mcp-events node dist/mcp-server/src/http.js
```
**Adding via Claude Code** — CLI:

```bash
claude mcp add --transport http kaltura-events http://localhost:3000/mcp \
  --header "Authorization: KS ${KALTURA_KS}"
```

**Adding via Claude Desktop** — add to `claude_desktop_config.json` and restart:

```json
{
  "mcpServers": {
    "kaltura-events": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "KS ${KALTURA_KS}"
      }
    }
  }
}
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KALTURA_KS` | Kaltura Session token — passed at startup (stdio or HTTP) or per-request via `Authorization` header (HTTP only) | — |
| `KALTURA_ENV` | API environment: `NVP`, `EU`, `DE` | `NVP` |
| `KALTURA_SERVER_PORT` | Port the HTTP server listens on | `3000` |
| `KALTURA_PUBLIC_API` | Custom API base URL (overrides `KALTURA_ENV`) | — |

| `KALTURA_ENV` value | Region |
|---------------------|--------|
| `NVP` | North America (default) |
| `EU` | European region (IRP) |
| `DE` | German region (FRP) |

---

Made with ❤️ by Kaltura.
