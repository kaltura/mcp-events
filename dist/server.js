"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield server.connect(transport);
            return server;
        }
        catch (error) {
            console.error('Failed to start MCP server:', error);
            throw error;
        }
    });
}
