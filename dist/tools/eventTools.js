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
exports.registerEventTools = registerEventTools;
const eventSchemas_1 = require("../schemas/eventSchemas");
const publicApiClient_1 = require("../api/publicApiClient");
const epClient_1 = require("../api/epClient");
/**
 * Register event-related tools with the MCP server
 */
function registerEventTools(server) {
    // Tool for creating events
    server.tool('create-event', 'Creates a new virtual event with provided configuration including name, start/end dates, templates, and timezone settings', eventSchemas_1.CreateEventDto.shape, {
        title: 'Create a Kaltura Event',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ name, templateId, startDate, endDate, timezone, description }) {
        try {
            const result = yield publicApiClient_1.publicApiClient.createEvent({
                name,
                templateId,
                startDate,
                endDate,
                timezone,
                description,
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
                        text: `Error creating event: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }));
    // Tool for listing events
    server.tool('list-events', 'get a list of available events', eventSchemas_1.ListEventDto.shape, {
        title: 'List Events',
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ filter, pager }) {
        try {
            const result = yield publicApiClient_1.publicApiClient.listEvents({ filter, pager });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error listing events: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }));
    // Tool for updating events
    server.tool('update-event', "Modifies an existing event's properties such as name, dates, banner, logo, and other configuration settings", eventSchemas_1.UpdateEventDto.shape, {
        title: 'Update an Event',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ id, name, description, startDate, endDate, doorsOpenDate, timezone, labels, logoEntryId, bannerEntryId, }) {
        try {
            const result = yield publicApiClient_1.publicApiClient.updateEvent({
                id,
                name,
                description,
                startDate,
                endDate,
                doorsOpenDate,
                timezone,
                labels,
                logoEntryId,
                bannerEntryId,
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
                        text: `Error updating event: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }));
    // Tool for deleting events
    server.tool('delete-event', 'Permanently removes an event by its ID, including all associated resources and configurations', eventSchemas_1.DeleteEventDto.shape, {
        title: 'Delete an Event',
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ id }) {
        try {
            const result = yield publicApiClient_1.publicApiClient.deleteEvent(id);
            return {
                content: [{ type: 'text', text: result }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error deleting event: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }));
    // Tool for listing an event sessions
    server.tool('list-event-sessions', 'Retrieves a list of sessions for a specific event', eventSchemas_1.ListSessionDto.shape, {
        title: 'List Event Sessions',
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
        readOnlyHint: true,
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ filter, id }) {
        try {
            const result = yield epClient_1.epClient.sessionList(id, filter === null || filter === void 0 ? void 0 : filter.tagsFilter);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error listing event sessions: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }));
    // Tool for creating an event session
    server.tool('create-event-session', 'Creates a new session for a specific event with provided configuration including name, description, start/end dates, and visibility settings', eventSchemas_1.CreateSessionDto.shape, {
        title: 'Create an Event Session',
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
        readOnlyHint: false,
    }, (_a) => __awaiter(this, [_a], void 0, function* ({ id, imageUrlEntryId, sourceEntryId, session }) {
        try {
            const result = yield epClient_1.epClient.sessionCreate(id, session, imageUrlEntryId, sourceEntryId);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error creating event session: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }));
}
