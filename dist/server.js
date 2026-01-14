"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const config_1 = require("./config/config");
const eventTools_1 = require("./tools/eventTools");
const eventResources_1 = require("./resources/eventResources");
/**
 * Initialize and start the MCP server
 */
async function startServer() {
    try {
        // Create an MCP server with configuration
        const server = new mcp_js_1.McpServer({
            name: config_1.config.server.name,
            version: config_1.config.server.version,
        });
        // Register all tools
        (0, eventTools_1.registerEventTools)(server);
        // Register all resources
        (0, eventResources_1.registerEventResources)(server);
        // Create a transport for communication
        const transport = new stdio_js_1.StdioServerTransport();
        // Connect the server to the transport
        await server.connect(transport);
        return server;
    }
    catch (error) {
        console.error('Failed to start MCP server:', error);
        throw error;
    }
}
