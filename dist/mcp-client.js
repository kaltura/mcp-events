"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const transport = new stdio_js_1.StdioClientTransport({
    command: 'node',
    args: ['/Users/tomgabay/Desktop/kaltura/mcp-events/dist/index.js'],
});
const client = new index_js_1.Client({
    name: 'example-client',
    version: '1.0.0',
});
async function main() {
    console.log('Connecting to MCP server...');
    await client.connect(transport);
    console.log('Connected to MCP server!');
    const tools = await client.listTools();
    console.log('Tools:', tools);
    // Call a tool
    const result = await client.callTool({
        name: 'example-tool',
        arguments: {
            arg1: 'value',
        },
    });
}
main().catch(console.error);
