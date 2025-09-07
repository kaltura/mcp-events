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
exports.registerEventResources = registerEventResources;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const publicApiClient_1 = require("../api/publicApiClient");
const node_assert_1 = __importDefault(require("node:assert"));
const presetTemplates_1 = require("./presetTemplates");
/**
 * Register event-related tools with the MCP server
 */
function registerEventResources(server) {
    // Dynamic resource with parameters
    server.registerResource('events', new mcp_js_1.ResourceTemplate('events://{eventId}/info', { list: undefined }), {
        title: 'Kaltura Event Information',
        description: 'Provides information about a specific Kaltura event',
    }, (uri_1, _a) => __awaiter(this, [uri_1, _a], void 0, function* (uri, { eventId }) {
        try {
            (0, node_assert_1.default)(typeof Number(eventId) === 'number', `eventId must be a number, received: ${typeof eventId}`);
            const result = yield publicApiClient_1.publicApiClient.listEvents({
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
    }));
    server.registerResource('preset-templates', 'preset-templates://all', {
        title: 'Kaltura Preset Templates',
        description: 'Provides a list of all available Kaltura preset templates',
        mimeType: 'text/plain',
    }, (uri) => __awaiter(this, void 0, void 0, function* () {
        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(presetTemplates_1.PresetTemplates, null, 2),
                },
            ],
        };
    }));
}
