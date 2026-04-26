"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicApiClient = exports.PublicAPIClient = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const config_1 = require("../config/config");
/**
 * API client for Public API
 */
class PublicAPIClient {
    constructor() {
        this.paths = Object.freeze({
            event: {
                create: 'events/create',
                list: 'events/list',
                update: 'events/update',
                delete: 'events/delete',
            },
            session: {
                create: 'sessions/create',
                list: 'sessions/list',
                speakerList: 'sessions/speakerList',
            },
        });
        this.baseUrl = config_1.config.urls.publicApi;
        this.ks = config_1.config.ks;
        (0, node_assert_1.default)(this.ks, 'Error: KS (Kaltura Session) is not set. API calls may fail.');
    }
    /**
     * Create a new event
     */
    async createEvent(params) {
        const response = await fetch(`${this.baseUrl}/${this.paths.event.create}`, {
            method: 'POST',
            headers: this.getHeaders,
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'createEvent');
        }
        return await response.text();
    }
    /**
     * List events with filtering and pagination
     */
    async listEvents(params) {
        const response = await fetch(`${this.baseUrl}/${this.paths.event.list}`, {
            method: 'POST',
            headers: this.getHeaders,
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'listEvents');
        }
        return await response.json();
    }
    /**
     * Update an existing event
     */
    async updateEvent(params) {
        const response = await fetch(`${this.baseUrl}/${this.paths.event.update}`, {
            method: 'POST',
            headers: this.getHeaders,
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'updateEvent');
        }
        return await response.text();
    }
    /**
     * Delete an event
     */
    async deleteEvent(id) {
        const response = await fetch(`${this.baseUrl}/${this.paths.event.delete}`, {
            method: 'POST',
            headers: this.getHeaders,
            body: JSON.stringify({ id }),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'deleteEvent');
        }
        return await response.text();
    }
    /**
     * List event session speakers
     */
    async listSessionSpeakers(eventId, sessionId) {
        const response = await fetch(`${this.baseUrl}/${this.paths.session.speakerList}`, {
            method: 'POST',
            headers: this.getHeaders,
            body: JSON.stringify({ eventId, sessionId }),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'listSessions');
        }
        return await response.text();
    }
    /**
     * List sessions for a given event
     */
    async listSessions(eventId) {
        const response = await fetch(`${this.baseUrl}/${this.paths.session.list}`, {
            method: 'POST',
            headers: this.getHeaders,
            body: JSON.stringify({ eventId }),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'listSessions');
        }
        return await response.text();
    }
    async createSession(eventId, session) {
        const response = await fetch(`${this.baseUrl}/${this.paths.session.create}`, {
            method: 'POST',
            headers: this.getHeaders,
            body: JSON.stringify({ eventId, session }),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'createSession');
        }
        return await response.text();
    }
    /**
     * Handle API response errors consistently
     * @param response The fetch response object
     * @param callerName Name of the calling function for better error context
     * @throws Error with detailed information about the failure
     */
    async handleResponseError(response, callerName) {
        const kalturaSession = response.headers.get('x-kaltura-session');
        const traceId = response.headers.get('x-traceid');
        let body = '';
        try {
            body = await response.text();
        }
        catch (e) { }
        throw new Error(`Failed to ${callerName}: ${response.status} ${response.statusText}\nx-traceId: ${traceId}\nx-kaltura-session: ${kalturaSession}\n${body}`);
    }
    /**
     * Get common headers for API requests
     */
    get getHeaders() {
        return {
            Authorization: `Bearer ${this.ks}`,
            'Content-Type': 'application/json',
            'X-Kaltura-Client-Tag': 'mcp-events-pa-client',
        };
    }
}
exports.PublicAPIClient = PublicAPIClient;
// Export a singleton instance
exports.publicApiClient = new PublicAPIClient();
