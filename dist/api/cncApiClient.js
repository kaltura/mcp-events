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
exports.cncApiClient = exports.CncAPIClient = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const config_1 = require("../config/config");
/**
 * API client for Cnc API
 */
class CncAPIClient {
    constructor() {
        this.paths = Object.freeze({
            create: 'polls/create',
            update: 'polls/update',
            delete: 'polls/remove',
            list: 'polls/moderatorList',
        });
        this.baseUrl = config_1.config.urls.cncApi;
        this.ks = config_1.config.ks;
        (0, node_assert_1.default)(this.ks, 'Error: KS (Kaltura Session) is not set. API calls may fail.');
    }
    /**
     * Create a new poll
     */
    createPoll(poll) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseUrl}/${this.paths.create}`, {
                method: 'POST',
                headers: this.getHeaders,
                body: JSON.stringify({ poll }),
            });
            if (!response.ok) {
                this.handleResponseError(response, 'createPoll');
            }
            const text = yield response.text();
            if (text.includes('KalturaAPIException')) {
                this.handleResponseError(response, 'createPoll', text);
            }
            return text;
        });
    }
    /**
     * Handle API response errors consistently
     * @param response The fetch response object
     * @param callerName Name of the calling function for better error context
     * @throws Error with detailed information about the failure
     */
    handleResponseError(response, callerName, error = '') {
        const kalturaSession = response.headers.get('x-kaltura-session');
        const traceId = response.headers.get('x-traceid');
        throw new Error(`Failed to ${callerName}: ${error} ${response.status} ${response.statusText}\nx-traceId: ${traceId}\nx-kaltura-session: ${kalturaSession}`);
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
exports.CncAPIClient = CncAPIClient;
// Export a singleton instance
exports.cncApiClient = new CncAPIClient();
