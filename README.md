<h1>🤖 Kaltura Events MCP Server</h1>
<p>A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the Kaltura Event Platform API.</p>



## Table of Contents

- [Overview](#-overview)
- [Tools](#tools)
- [Resources](#resources)
- [Running the MCP Server](#️-running-the-mcp-server)
  - [Installation](#installation)
  - [Server Configuration](#server-configuration)
    - [Environment Variables](#environment-variables)
    - [API Environments](#api-environments)
- [Connecting Your Client](#-connecting-your-client)
  - [Claude Desktop](#claude-desktop)
  - [Claude Code](#claude-code)

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


## 🗄️ Running the MCP Server

Before connecting any agent, you may need to build and start the MCP server locally.

### Installation

**Prerequisites**

- Node.js 22 or later

```bash
# Clone the repository
git clone https://github.com/kaltura/mcp-events.git
cd mcp-events

# Install dependencies and build
npm install
npm run build

# Start the MCP server in Local stdio mode
# (Requires a Kaltura Session token "KS", see Server Configuration below)
npm run start:stdio

# OR start the MCP server in Streamable HTTP mode
# (For remote agents)
npm run start:http
```

Once the server is running, proceed to [Connecting Your Client](#-connecting-your-client).

---

### Server Configuration

#### Environment Variables
__can be set in a `mcp-events/.env` file or directly in the shell__

| Variable | Description | Default |
|----------|-------------|---------|
| `KALTURA_ENV` | **[Optional]** API environment (`NVP`, `EU`, `DE`) | `NVP` |
| `KALTURA_SERVER_PORT` | **[Optional]** Port the MCP server listens on (HTTP mode) | `3000` |
| `KALTURA_PUBLIC_API` | **[Optional]** Custom Public API base URL (overrides `KALTURA_ENV`) | — |
| `KALTURA_KS` | **[Optional][For Server Stdio Only]** Kaltura Session token for API authentication | — |
#### API Environments

| Environment | Region |
|-------------|--------|
| `NVP` | North America (default) |
| `EU` | European region (IRP) |
| `DE` | German region (FRP) |

## 👩🏻‍💻 Connecting Your Client

All examples below assume the MCP server is already running locally on port `3000`. Set the `KALTURA_KS` environment variable in your shell, or substitute your session token directly in the config.

### Claude Desktop

Add the following to your Claude Desktop config file and restart the application.

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kaltura-events": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "KS ${KALTURA_KS}"
      },
    }
  }
}
```

### Claude Code

**Option 1 — CLI:**

```bash
claude mcp add --transport http kaltura-events http://localhost:3000/mcp \
  --header 'Authorization: KS ${KALTURA_KS}' \
  [-s <user|project|local>]
```

**Option 2 — Manual config (`~/.claude.json`):**

```json
{
  "mcpServers": {
    "kaltura-events": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "KS ${KALTURA_KS}"
      },
    }
  }
}
```



---

Made with ❤️ by Kaltura
