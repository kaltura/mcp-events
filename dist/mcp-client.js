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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Connecting to MCP server...');
        yield client.connect(transport);
        console.log('Connected to MCP server!');
        const tools = yield client.listTools();
        console.log('Tools:', tools);
        // Call a tool
        const result = yield client.callTool({
            name: 'example-tool',
            arguments: {
                arg1: 'value',
            },
        });
    });
}
main().catch(console.error);
