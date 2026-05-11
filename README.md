# Kaltura Events MCP Server

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the Kaltura Event Platform API. Enables AI assistants to create, manage, and interact with Kaltura virtual events through a standardized tool interface.

---

## Table of Contents

- [Overview](#overview)
- [Tools](#tools)
- [Resources](#resources)
- [Running the MCP Server](#running-the-mcp-server)
  - [Installation](#installation)
  - [Server Configuration](#server-configuration)
    - [Environment Variables](#environment-variables)
    - [API Environments](#api-environments)
- [Connecting Your Agent](#connecting-your-agent)
  - [Claude Desktop](#claude-desktop)
  - [Claude Code](#claude-code)

---

## Overview

The Kaltura Events MCP Server exposes Kaltura's Event Platform API as MCP tools and resources, allowing any MCP-compatible AI agent to manage virtual events programmatically.

**Key capabilities:**

- Create, update, and delete virtual events
- Manage event sessions and resources
- Access event templates and timezone information
- Per-connection authentication with Kaltura Session (KS) isolation
- Multiple transport protocols: `stdio`, `SSE`, and Streamable HTTP

---

## Tools

| Tool | Description |
|------|-------------|
| `create-event` | Create a new virtual event with specified configuration |
| `list-events` | Retrieve a list of events with filtering and pagination |
| `update-event` | Modify existing event properties |
| `delete-event` | Remove an event and its associated resources |
| `create-event-session` | Add a new session to an existing event |
| `list-event-sessions` | Get all sessions for a specific event |

---

## Resources

| Resource | Description |
|----------|-------------|
| `events` | Access information about specific Kaltura events |
| `preset-templates` | Browse available preset templates for event creation |

---

## Running the MCP Server

Before connecting any agent, you may need to build and start the MCP server locally.

### Installation

**Prerequisites**

- Node.js 22 or later
- A valid Kaltura Session (KS) with appropriate permissions

```bash
# Clone the repository
git clone https://github.com/kaltura/mcp-events.git
cd mcp-events

# Install dependencies and build
npm install
npm run build

# Start the MCP server in stdio mode
npm run start:stdio

# OR start the MCP server in Streamable HTTP mode
# (required for Claude Desktop, VS Code, and remote agents)
npm run start:http
```

Once the server is running, proceed to [Connecting Your Agent](#connecting-your-agent).

---

### Server Configuration

#### Environment Variables
__can be set in a `mcp-events/.env` file or directly in the shell__

| Variable | Description | Default |
|----------|-------------|---------|
| `KALTURA_ENV` | API environment (`NVP`, `EU`, `DE`) | `NVP` |
| `KALTURA_SERVER_PORT` | Port the MCP server listens on (HTTP mode) | `3000` |
| `KALTURA_KS` | Kaltura Session token (Local stdio mode only) | — |
| `KALTURA_PUBLIC_API` | Custom Public API base URL (overrides `KALTURA_ENV`) | — |

#### API Environments

| Environment | Region |
|-------------|--------|
| `NVP` | North America (default) |
| `EU` | European region (IRP) |
| `DE` | German region (FRP) |

---

## Connecting Your Agent

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
  [-s user|project|local]
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

Made with care by the [Kaltura](https://kaltura.com) team.
