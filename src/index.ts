import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CreateEventDto, ListEventDto, UpdateEventDto, DeleteEventDto } from "./eventSchemas";
import * as dotenv from "dotenv";
dotenv.config();

const ks = process.env.KS; // Load the 'ks' variable from the environment


const base_url="https://events-api.nvq2.ovp.kaltura.com/api/v1/event"
const kaltura_base_url="https://api.nvq2.ovp.kaltura.com/api_v3"

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

// Async tool with external API call
server.tool(
    "create-event",
    CreateEventDto.shape,
    async ({ name, templateId, startDate, endDate, timezone, description }) => {
      const response = await fetch(`${base_url}/create`,{
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ks}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          templateId,
          startDate,
          endDate,
          timezone,
          description
        })
      });
      const data = await response.text();
      return {
        content: [{ type: "text", text: data }]
      };
    }
);

// Tool for listing events
server.tool(
  "list-event",
  ListEventDto.shape,
  async ({ filter, pager }) => {
    const response = await fetch(`${base_url}/list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ks}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter,
        pager
      })
    });
    const data = await response.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data) }]
    };
  }
);

// Tool for updating an event
server.tool(
  "update-event",
  UpdateEventDto.shape,
  async ({ id, name, description, startDate, endDate, doorsOpenDate, timezone, labels, logoEntryId, bannerEntryId }) => {
    const response = await fetch(`${base_url}/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ks}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        name,
        description,
        startDate,
        endDate,
        doorsOpenDate,
        timezone,
        labels,
        logoEntryId,
        bannerEntryId
      })
    });
    const data = await response.text();
    return {
      content: [{ type: "text", text: data }]
    };
  }
);

// Tool for deleting an event
server.tool(
  "delete-event",
  DeleteEventDto.shape,
  async ({ id }) => {
    const response = await fetch(`${base_url}/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ks}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });
    const data = await response.text();
    return {
      content: [{ type: "text", text: data }]
    };
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
(async () => {
  await server.connect(transport);
})();