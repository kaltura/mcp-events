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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runClient = runClient;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const config_1 = require("./config/config");
const path_1 = __importDefault(require("path"));
/**
 * Example client for testing the MCP server
 */
function runClient() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a transport that connects to the server
        const serverPath = path_1.default.join(process.cwd(), 'dist', 'index.js');
        const transport = new stdio_js_1.StdioClientTransport({
            command: 'node',
            args: [serverPath],
        });
        // Create a client
        const client = new index_js_1.Client({
            name: config_1.config.client.name,
            version: config_1.config.client.version,
        });
        try {
            yield client.connect(transport);
            // List available tools
            const tools = yield client.listTools();
            // Example: Create an event
            const createResult = yield client.callTool({
                name: 'create-event',
                arguments: {
                    templateId: 'example-template-123',
                    name: 'Test Event',
                    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                    endDate: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 25 hours
                    timezone: 'America/New_York',
                    description: 'This is a test event created by the MCP client',
                },
            });
            // Example: List events
            const listResult = yield client.callTool({
                name: 'list-events',
                arguments: {
                    filter: {
                        searchTerm: 'Test',
                    },
                    pager: {
                        offset: 0,
                        limit: 10,
                    },
                },
            });
            return client;
        }
        catch (error) {
            throw error;
        }
    });
}
// Run the client if this file is executed directly
if (require.main === module) {
    runClient().catch(console.error);
}
