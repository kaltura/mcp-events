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
exports.registerPollTools = registerPollTools;
const pollSchemas_1 = require("../schemas/pollSchemas");
const cncApiClient_1 = require("../api/cncApiClient");
/**
 * Register poll-related tools with the MCP server
 */
function registerPollTools(server) {
    // Tool for creating polls
    server.tool('create-poll', 'Creates ', pollSchemas_1.CreatePollDto.shape, {
        title: 'Create a Kaltura Poll, associated with the provided contextId/session id (entry id  or channel id)',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ contextId, state, showResults, content, type, autoCloseMilliseconds, scheduling, isAcceptingMultipleVotes, visualization, trackWordFrequency, groupPoll, }) {
        try {
            const result = yield cncApiClient_1.cncApiClient.createPoll({
                contextId,
                state,
                showResults,
                content,
                type,
                autoCloseMilliseconds,
                scheduling,
                isAcceptingMultipleVotes,
                visualization,
                trackWordFrequency,
                groupPoll,
            });
            return {
                content: [{ type: 'text', text: result }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error creating poll: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }));
}
