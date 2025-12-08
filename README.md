
# 🎉 Kaltura Events MCP

A Model Context Protocol (MCP) server for working with the Kaltura Event Platform API. This server provides tools and resources for creating, managing, and interacting with Kaltura virtual events.

---

## Overview

This MCP server provides an interface for AI assistants to interact with the Kaltura Events Platform. It enables:

- Creating, updating, and deleting virtual events
- Managing event sessions and resources
- Accessing event templates and timezone information

---

## Features

###  Tools

- **create-event**: Create a new virtual event with specified configuration
- **list-events**: Retrieve a list of available events with filtering and pagination
- **update-event**: Modify existing event properties
- **delete-event**: Remove an event and its resources
- **list-event-sessions**: Get all sessions for a specific event
- **create-event-session**: Add a new session to an existing event

### Resources

- **events**: Access information about specific Kaltura events
- **preset-templates**: Browse available preset templates for event creation

---

##  Prerequisites

- Node.js 22+
- Access to Kaltura Event Platform APIs
- Valid Kaltura Session (KS) for authentication

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/kaltura/mcp-events.git
cd mcp-events
npm install
```

---

## ⚙️ Configuration & Running

### Configuration your agent

You can configure you agent to use the Kaltura Events MCP server by adding a new tool configuration.
This differs depending on the agent you use, so Claude Code, VS Code Copilot, etc. would have different ways to add the MCP server.

- JSON config example (standart should work for most agents):

  ```json
  {
    "mcpServers": {
      "Kaltura Events API": {
        "transport": "stdio",
        "command": "node",
        "args": [
          "/home/john-doe/mcp-events/dist/index.js"
        ],
        "env": {
          "KALTURA_ENV": "NVP",
          "KALTURA_KS": "YOUR-KALTURA-SECRET_HERE" // Should be a user KS
        }
      }
    }
  }

  ```

### VS Code - Copilot | Adding the MCP config
#### Create or Locate `mcp.json`

You can configure MCP at either the user or workspace level:

- **User-level configuration**  
  Create or locate a `mcp.json` file (with the above json config) in your user settings directory:  
  - Linux/macOS: `~/.vscode/mcp.json`  
  - Windows: `%APPDATA%\Code\User\mcp.json`

- **Workspace-level configuration**  
  For project-specific settings, create a `.vscode` folder in your project's root directory, then add a `mcp.json` file (with the above config) inside it:
  - Example: `your_project/.vscode/mcp.json`

### Claude Code | Adding the MCP config
- **carete a file `~/.claude/mcp.json`** with the above configuration
- **add the mcp config:**

  ```bash
  claude --mcp-config ~/.claude/mcp.json
  ```

### 🌱 Environment Configuration

These are the environment variables:

- `KALTURA_ENV`: The environment to use  
  - `NVP` (default)
  - `EU` 
  - `DE`

- `KS`: Your Kaltura Session key **containing a user**

---

## 🌍 API Environments

The MCP server supports multiple Kaltura API environments (regions):

- **NVP** (Production): Default environment
- **EU**: European region deployment (IRP)
- **DE**: German region deployment (FRP)

For custom environment URLs, use these environment variables:

- `KALTURA_PUBLIC_API`
- `KALTURA_EP_API`
- `KALTURA_BE_API`
