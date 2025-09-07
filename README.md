# Kaltura Events MCP

A Model Context Protocol (MCP) server for working with the Kaltura Event Platform API. This server provides tools and resources for creating, managing, and interacting with Kaltura virtual events.

## Overview

This MCP server provides an interface for AI assistants to interact with Kaltura Events Platform. It enables:

- Creating, updating, and deleting virtual events
- Managing event sessions and resources
- Accessing event templates and timezone information

## Features

### Tools

- **create-event**: Create a new virtual event with specified configuration
- **list-events**: Retrieve a list of available events with filtering and pagination
- **update-event**: Modify existing event properties
- **delete-event**: Remove an event and its resources
- **list-event-sessions**: Get all sessions for a specific event
- **create-event-session**: Add a new session to an existing event

### Resources

- **events**: Access information about specific Kaltura events
- **preset-templates**: Browse available preset templates for event creation

## Prerequisites

- Node.js 22+
- Access to Kaltura Event Platform APIs
- Valid Kaltura Session (KS) for authentication

## Installation

Clone the repository:
   ```bash
   git clone https://github.com/kaltura/mcp-events.git
   cd mcp-events
   ```

## Configuration / Running

The MCP server can be configured through the use of a configuration file or environment variables.

### Configuration with JSON

You can configure the MCP server by providing a JSON configuration file. Here's an example of how to set it up:

1. Create a configuration file (e.g., `mcp-config.json`):

```json
  "Kaltura Events API": {
    "type": "stdio",
    "command": "node",
    "args": [
      "/home/john-doe/dev/mcp-events/dist/index.js"
    ],
    "env": {
      "KALTURA_ENV":"NVP",
      "KALTURA_KS": "YOUR-KALTURA-SECRET_HERE" // Should be a user KS
    }
  },
```

### Environment Configuration

You can also configure the MCP server using environment variables:

- `ENV`: The environment to use (NVP, NVQ, EU, DE), default is NVP.
- `KS`: Your Kaltura Session key __containing a user.__

## API Environments

The MCP server supports multiple Kaltura API environments:

- **NVP** (Production): Default environment (_Default_)
- **NVQ** (QA): Testing environment (Testing Env)
- **EU**: European region deployment (IRP)
- **DE**: German region deployment (FRP)
