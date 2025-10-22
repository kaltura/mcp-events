
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

The MCP server can be configured through a configuration file or environment variables.

### Configuration with JSON

You can configure the MCP server by providing a JSON configuration file. Example:

1. Create a configuration file (e.g., `mcp-config.json`):

```json
"Kaltura Events API": {
  "type": "stdio",
  "command": "node",
  "args": [
    "/home/john-doe/mcp-events/dist/index.js"
  ],
  "env": {
    "KALTURA_ENV": "NVP",
    "KALTURA_KS": "YOUR-KALTURA-SECRET_HERE" // Should be a user KS
  }
},
```

### 🌱 Environment Configuration

You can configure the MCP server using these environment variables:

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
