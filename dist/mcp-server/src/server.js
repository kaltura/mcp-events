"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const config_1 = require("./config/config");
const eventTools_1 = require("./tools/eventTools");
const eventResources_1 = require("./resources/eventResources");
const publicApiClient_1 = require("./api/publicApiClient");
/**
 * Initialize and start the MCP server (stdio mode for local development)
 * Uses KALTURA_KS environment variable for authentication
 */
async function startServer() {
    try {
        // Get KS from environment (required for stdio mode)
        const ks = config_1.config.kaltura.ks;
        if (!ks) {
            throw new Error('KALTURA_KS environment variable is required for stdio mode. ' +
                'Set it in .env file or provide it when starting the server.');
        }
        // Create API client instance
        const publicApiClient = new publicApiClient_1.PublicApiClient();
        // Create an MCP server with configuration
        const server = new mcp_js_1.McpServer({
            name: config_1.config.server.name,
            version: config_1.config.server.version,
        });
        // Register all tools with KS from environment
        (0, eventTools_1.registerEventTools)(server, ks, publicApiClient);
        // Register all resources with KS from environment
        (0, eventResources_1.registerEventResources)(server, ks, publicApiClient);
        // Create a transport for communication
        const transport = new stdio_js_1.StdioServerTransport();
        // Connect the server to the transport
        await server.connect(transport);
        console.error('MCP Server started in stdio mode (KS provided)');
        return server;
    }
    catch (error) {
        console.error('Failed to start MCP server:', error);
        throw error;
    }
}
