# 🤖 Kaltura Events MCP Server
A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for Kaltura Events Platform API.

## Table of Contents

- [Overview](#-overview)
  - [Tools](#tools)
  - [Resources](#resources)
- [Installation](#%EF%B8%8F-installation)
  - [Stdio Mode](#stdio-mode)
  <!-- - [HTTP Mode](#http-mode) # uncomment once auth-gateway is deployed..-->
- [Environment Variables](#%EF%B8%8F-environment-variables)

---

## ☰ Overview

MCP server for Kaltura's Event Platform API.


### Tools

| Domain | Tool | Description |
|--------|------|-------------|
| Events | `create-event` | Create a new virtual event with specified configuration |
| | `list-events` | Retrieve a list of events with filtering and pagination |
| | `update-event` | Modify existing event properties |
| | `delete-event` | Remove an event and its associated resources |
| | `duplicate-event` | Create a copy of an existing event with all its configurations |
| Sessions | `create-event-session` | Add a new session to an existing event |
| | `list-event-sessions` | Get all sessions for a specific event |
| Event Users | `invite-event-user` | Invite a user to an event with specified roles |
| | `list-event-users` | List users registered for an event with filtering |
| | `update-event-user` | Update an event user's profile and roles |
| | `delete-event-user` | Remove a user from an event |
| Session Participants | `add-session-participants` | Add speakers or moderators to a session |
| | `update-session-participants` | Update role, order, or visibility of existing session speakers |
| | `list-session-participants` | List speakers and moderators for a session |
| | `remove-session-participants` | Remove speakers or moderators from a session |
| Team Members | `create-team-member` | Create an account-level Event Platform team member |
| | `list-team-members` | List account-level team members |
| | `update-team-member` | Update a team member's profile or role |
| | `delete-team-member` | Remove a team member from the platform |



---

## 🗄️ Installation

### Stdio Mode

#### Claude Code CLI:

```bash
claude mcp add kaltura-events "docker -- run -i --rm -e KALTURA_KS ghcr.io/kaltura/mcp-events:latest" -s user
```
_Next time you open Claude make sure `KALTURA_KS` env var is **EXPORT'ed**, and that's it!_

<br/>

#### Manual / Claude Desktop
Add to `claude_desktop_config.json` and restart:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kaltura-events": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "KALTURA_KS", "ghcr.io/kaltura/mcp-events:latest"],
      "env": {}
    }
  }
}
```


---

<!-- Uncomment once auth-gateway is deployed..

### HTTP Mode

_Before adding the MCP, manually start the server:_
  ```bash
  docker run -p 3000:3000 ghcr.io/kaltura/mcp-events:latest node dist/apps/mcp-server/src/http.js
  ```

#### Claude Code CLI:

```bash
claude mcp add --transport http kaltura-events http://localhost:3000/mcp \
  --header "Authorization: KS \${KALTURA_KS}"
```
_Next time you open Claude make sure `KALTURA_KS` env var is **EXPORT'ed**, and that's it!_

#### Manual / Claude Desktop
Add to `claude_desktop_config.json` and restart:

```json
{
  "mcpServers": {
    "kaltura-events": {
      "type": "https",
      "url": "https://auth-gateway.kaltura.com"
    }
  }
}
``` 

-->


---

## ⚙️ Environment Variables

| Variable | Description | Default | Mode | Required |
|----------|-------------|---------|------|----------|
| `KALTURA_KS` | Kaltura Session token — passed at startup | — | stdio | yes |
| `KALTURA_ENV` | API environment: `NVP` (North America, default), `EU` (European region, IRP), `DE` (German region, FRP) | `NVP` | both | no |
| `KALTURA_PUBLIC_API` | Custom API base URL (overrides `KALTURA_ENV`) | — | both | no |
| `KALTURA_MCP_SERVER_PORT` | Port the HTTP server listens on | `3000` | http | no |

---

Made with ❤️ by Kaltura.
