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
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const eventSchemas_1 = require("./eventSchemas");
const dotenv = require("dotenv");
dotenv.config();
const ks = process.env.KS; // Load the 'ks' variable from the environment
const base_url = "https://events-api.nvq2.ovp.kaltura.com/api/v1/event";
const kaltura_base_url = "https://api.nvq2.ovp.kaltura.com/api_v3";
// Create an MCP server
const server = new mcp_js_1.McpServer({
    name: "Demo",
    version: "1.0.0"
});
// Async tool with external API call
server.tool("create-event", eventSchemas_1.CreateEventDto.shape, (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, templateId, startDate, endDate, timezone, description }) {
    const response = yield fetch(`${base_url}/create`, {
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
    const data = yield response.text();
    return {
        content: [{ type: "text", text: data }]
    };
}));
// Tool for listing events
server.tool("list-event", eventSchemas_1.ListEventDto.shape, (_a) => __awaiter(void 0, [_a], void 0, function* ({ filter, pager }) {
    const response = yield fetch(`${base_url}/list`, {
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
    const data = yield response.json();
    return {
        content: [{ type: "text", text: JSON.stringify(data) }]
    };
}));
// Tool for updating an event
server.tool("update-event", eventSchemas_1.UpdateEventDto.shape, (_a) => __awaiter(void 0, [_a], void 0, function* ({ id, name, description, startDate, endDate, doorsOpenDate, timezone, labels, logoEntryId, bannerEntryId }) {
    const response = yield fetch(`${base_url}/update`, {
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
    const data = yield response.text();
    return {
        content: [{ type: "text", text: data }]
    };
}));
// Start receiving messages on stdin and sending messages on stdout
const transport = new stdio_js_1.StdioServerTransport();
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield server.connect(transport);
}))();
