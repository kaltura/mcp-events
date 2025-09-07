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
exports.eventsApi = exports.EventsApi = void 0;
const config_1 = require("../config/config");
/**
 * API client for Kaltura Events
 */
class EventsApi {
    constructor() {
        this.baseUrl = config_1.config.urls.eventsApi;
        this.ks = config_1.config.ks;
        if (!this.ks) {
            console.error('Error: KS (Kaltura Session) is not set. API calls may fail.');
        }
    }
    /**
     * Create a new event
     */
    createEvent(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseUrl}/create`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(params),
            });
            if (!response.ok) {
                throw new Error(`Failed to create event: ${response.status} ${response.statusText}`);
            }
            return yield response.text();
        });
    }
    /**
     * List events with filtering and pagination
     */
    listEvents(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseUrl}/list`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(params),
            });
            if (!response.ok) {
                throw new Error(`Failed to list events: ${response.status} ${response.statusText}`);
            }
            return yield response.json();
        });
    }
    /**
     * Update an existing event
     */
    updateEvent(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseUrl}/update`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(params),
            });
            if (!response.ok) {
                throw new Error(`Failed to update event: ${response.status} ${response.statusText}`);
            }
            return yield response.text();
        });
    }
    /**
     * Delete an event
     */
    deleteEvent(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseUrl}/delete`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ id }),
            });
            if (!response.ok) {
                throw new Error(`Failed to delete event: ${response.status} ${response.statusText}`);
            }
            return yield response.text();
        });
    }
    /**
     * Get common headers for API requests
     */
    getHeaders() {
        return {
            Authorization: `Bearer ${this.ks}`,
            'Content-Type': 'application/json',
        };
    }
}
exports.EventsApi = EventsApi;
// Export a singleton instance
exports.eventsApi = new EventsApi();
