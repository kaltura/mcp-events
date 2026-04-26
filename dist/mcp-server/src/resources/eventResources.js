"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventResources = registerEventResources;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const node_assert_1 = __importDefault(require("node:assert"));
const presetTemplates_1 = require("./presetTemplates");
/**
 * Register event-related resources with the MCP server
 * @param server MCP Server instance
 * @param ks Kaltura Session for this connection (captured in closure)
 * @param publicApiClient Public API client instance
 */
function registerEventResources(server, ks, publicApiClient) {
    // Dynamic resource with parameters
    server.registerResource('events', new mcp_js_1.ResourceTemplate('events://{eventId}/info', { list: undefined }), {
        title: 'Kaltura Event Information',
        description: 'Provides information about a specific Kaltura event',
    }, async (uri, { eventId }) => {
        try {
            (0, node_assert_1.default)(typeof Number(eventId) === 'number', `eventId must be a number, received: ${typeof eventId}`);
            const result = await publicApiClient.listEvents(ks, {
                filter: { idIn: [Number(eventId)] },
                pager: { limit: 1, offset: 0 },
            });
            (0, node_assert_1.default)(result.totalCount, `event ${eventId} not found!`);
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify(result.events[0], null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: `Error getting event: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
    server.registerResource('preset-templates', 'preset-templates://all', {
        title: 'Kaltura Preset Templates',
        description: 'Provides a list of all available Kaltura preset templates',
        mimeType: 'text/plain',
    }, async (uri) => {
        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(presetTemplates_1.PresetTemplates, null, 2),
                },
            ],
        };
    });
}
