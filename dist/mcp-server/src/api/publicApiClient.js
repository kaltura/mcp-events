"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("../config/config");
/**
 * API client for Public API
 * Injectable service that accepts KS per request
 */
let PublicApiClient = class PublicApiClient {
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
        this.baseUrl = config_1.config.kaltura.urls.publicApi;
    }
    /**
     * Create a new event
     * @param ks Kaltura Session for this request
     */
    async createEvent(ks, params) {
        const response = await fetch(`${this.baseUrl}/${this.paths.event.create}`, {
            method: 'POST',
            headers: this.getHeaders(ks),
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'createEvent');
        }
        return await response.text();
    }
    /**
     * List events with filtering and pagination
     * @param ks Kaltura Session for this request
     */
    async listEvents(ks, params) {
        const response = await fetch(`${this.baseUrl}/${this.paths.event.list}`, {
            method: 'POST',
            headers: this.getHeaders(ks),
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'listEvents');
        }
        return await response.json();
    }
    /**
     * Update an existing event
     * @param ks Kaltura Session for this request
     */
    async updateEvent(ks, params) {
        const response = await fetch(`${this.baseUrl}/${this.paths.event.update}`, {
            method: 'POST',
            headers: this.getHeaders(ks),
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'updateEvent');
        }
        return await response.text();
    }
    /**
     * Delete an event
     * @param ks Kaltura Session for this request
     */
    async deleteEvent(ks, id) {
        const response = await fetch(`${this.baseUrl}/${this.paths.event.delete}`, {
            method: 'POST',
            headers: this.getHeaders(ks),
            body: JSON.stringify({ id }),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'deleteEvent');
        }
        return await response.text();
    }
    /**
     * List sessions for a specific event
     * @param ks Kaltura Session for this request
     * @param eventId The ID of the event to list sessions for
     * @returns The list of sessions as a string
     */
    async listSessions(ks, eventId) {
        const response = await fetch(`${this.baseUrl}/${this.paths.session.list}`, {
            method: 'POST',
            headers: this.getHeaders(ks),
            body: JSON.stringify({ eventId }),
        });
        if (!response.ok) {
            await this.handleResponseError(response, 'listSessions');
        }
        return await response.text();
    }
    /**
     * Create a new session for an event
     * @param ks Kaltura Session for this request
     * @param eventId The ID of the event to which the session belongs
     * @param session The session details to create
     * @returns The ID of the created session as a string
     */
    async createSession(ks, eventId, session) {
        const response = await fetch(`${this.baseUrl}/${this.paths.session.create}`, {
            method: 'POST',
            headers: this.getHeaders(ks),
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
     * @param ks Kaltura Session for this request
     */
    getHeaders(ks) {
        return {
            Authorization: `Bearer ${ks}`,
            'Content-Type': 'application/json',
            'X-Kaltura-Client-Tag': 'mcp-events-pa-client',
        };
    }
};
exports.PublicApiClient = PublicApiClient;
exports.PublicApiClient = PublicApiClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PublicApiClient);
