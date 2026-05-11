<table border="0" cellpadding="0" cellspacing="0">
<tr>
<td valign="middle"><svg width="50" height="50" viewBox="0 0 850.39 850.39" xmlns="http://www.w3.org/2000/svg">
 <path fill="#fa374b" d="M425.19,243.7c-19.25,0-34.85-19.28-34.85-38.53V40c0-19.25,15.6-38.52,34.85-38.52S460.05,20.75,460.05,40V205.17C460.05,224.42,444.45,243.7,425.19,243.7Z"/>
 <path fill="#ffcd00" d="M296.86,296.86c-13.62,13.61-38.28,11-51.89-2.6L128.17,177.47c-13.61-13.61-16.2-38.28-2.59-51.89s38.28-11,51.89,2.6L294.26,245C307.87,258.58,310.47,283.24,296.86,296.86Z"/>
 <path fill="#b4dc00" d="M243.7,425.2c0,19.25-19.28,34.85-38.53,34.85H40c-19.25,0-38.53-15.6-38.53-34.85S20.75,390.34,40,390.34H205.17C224.42,390.34,243.7,406,243.7,425.2Z"/>
 <path fill="#41beff" d="M296.86,553.54c13.61,13.61,11,38.27-2.6,51.89L177.47,722.22c-13.61,13.61-38.28,16.2-51.89,2.59s-11-38.27,2.59-51.89L245,556.13C258.58,542.52,283.24,539.92,296.86,553.54Z"/>
 <path fill="#006efa" d="M425.19,606.7c19.26,0,34.86,19.27,34.86,38.52V810.39c0,19.25-15.6,38.53-34.86,38.53s-34.85-19.28-34.85-38.53V645.22C390.34,626,405.94,606.7,425.19,606.7Z"/>
 <path fill="#fa0" d="M553.53,553.54c13.62-13.62,38.28-11,51.89,2.59l116.8,116.79c13.61,13.62,16.2,38.28,2.59,51.89s-38.28,11-51.89-2.59L556.13,605.43C542.52,591.81,539.92,567.15,553.53,553.54Z"/>
 <path fill="#00a078" d="M606.69,425.2c0-19.25,19.28-34.86,38.53-34.86H810.39c19.25,0,38.53,15.61,38.53,34.86s-19.28,34.85-38.53,34.85H645.22C626,460.05,606.69,444.45,606.69,425.2Z"/>
 <path fill="#3cd2af" d="M553.53,296.86c-13.61-13.62-11-38.28,2.6-51.89L672.92,128.18c13.61-13.62,38.28-16.21,51.89-2.6s11,38.28-2.59,51.89L605.42,294.26C591.81,307.88,567.15,310.47,553.53,296.86Z"/>
 <circle fill="#282828" cx="425.19" cy="425.2" r="56.03"/>
</svg></td>
<td valign="middle"><h1>Kaltura Events MCP Server</h1></td>
</tr>
</table>
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
