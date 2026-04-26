"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
/**
 * Main entry point for the MCP server
 */
async function main() {
    try {
        await (0, server_1.startServer)();
    }
    catch (error) {
        // Silent error handling to avoid interfering with MCP protocol
        process.exit(1);
    }
}
// Start the application
main();
