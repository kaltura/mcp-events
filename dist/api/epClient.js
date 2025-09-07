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
exports.epClient = exports.EpClient = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const config_1 = require("../config/config");
const lru_cache_1 = require("lru-cache");
const utils_1 = require("../utils");
const EpEventIdCache = new lru_cache_1.LRUCache({
    max: 500,
    ttl: 60 * 60 * 24 * 1,
});
/**
 * API client for EP
 */
class EpClient {
    constructor() {
        this.paths = Object.freeze({
            authLoginKs: 'auth/loginKS',
            eventsList: 'events/list',
            sessionList: 'sessions/list',
            sessionCreate: 'sessions/create',
        });
        this.jwt = {
            token: '',
            /**
             * Epoch milliseconds
             **/
            exp: 0,
        };
        (0, node_assert_1.default)(config_1.config.ks, 'Error: KS (Kaltura Session) is not set. API calls may fail.');
        this.baseUrl = config_1.config.urls.epApi;
        this.ks = config_1.config.ks;
    }
    sessionList(kalturaEventId, tagsFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const epEventId = yield this.getEpEventId(kalturaEventId);
            const response = yield fetch(`${this.baseUrl}/${this.paths.sessionList}`, {
                method: 'POST',
                headers: yield this.getHeaders(epEventId),
                body: JSON.stringify({ filter: { tagsFilter } }),
            });
            if (!response.ok) {
                return this.handleResponseError(response, 'sessionList');
            }
            return yield response.json();
        });
    }
    sessionCreate(kalturaEventId, session, imageUrlEntryId, sourceEntryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const epEventId = yield this.getEpEventId(kalturaEventId);
            const body = (0, utils_1.removeEmptyProps)({
                session: Object.assign(Object.assign({}, session), { description: session.description || '' }),
                imageUrlEntryId,
                sourceEntryId,
            }, { removeEmptyString: false });
            const response = yield fetch(`${this.baseUrl}/${this.paths.sessionCreate}`, {
                method: 'POST',
                headers: yield this.getHeaders(epEventId),
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                return this.handleResponseError(response, 'sessionCreate');
            }
            return yield response.json();
        });
    }
    /**
     * Get EP event id from kaltura public id
     * Fetch from EP or get from cache.
     */
    getEpEventId(kalturaEventId) {
        return __awaiter(this, void 0, void 0, function* () {
            let epEventId = yield this.cacheGetEventId(kalturaEventId);
            if (epEventId) {
                return epEventId;
            }
            epEventId = yield this.fetchEpEventId(kalturaEventId);
            if (!epEventId) {
                throw new Error(`Event id not found in EP, kalturaEventId: ${kalturaEventId}`);
            }
            yield this.cacheSetEventId(kalturaEventId, epEventId);
            return epEventId;
        });
    }
    fetchEpEventId(kalturaEventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = { kalturaEventIdIn: [kalturaEventId] };
            const response = yield fetch(`${this.baseUrl}/${this.paths.eventsList}`, {
                method: 'POST',
                headers: yield this.getHeaders(),
                body: JSON.stringify({ filter }),
            });
            if (!response.ok) {
                return this.handleResponseError(response, 'fetchEpEventId');
            }
            const { events } = yield response.json();
            if (!events.length)
                return undefined;
            if (events.length > 1) {
                throw new Error('More than one event found with the same kaltura event id');
            }
            return events[0]._id;
        });
    }
    getJwt() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isValidJwt) {
                return this.jwt.token;
            }
            const jwt = yield this.fetchJwt(this.ks);
            this.jwt.token = jwt.token;
            this.jwt.exp = jwt.exp * 1000;
            return this.jwt.token;
        });
    }
    fetchJwt(ks) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.baseUrl}/${this.paths.authLoginKs}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ks }),
            });
            if (!response.ok) {
                return this.handleResponseError(response, 'fetchJwt');
            }
            return yield response.json();
        });
    }
    get isValidJwt() {
        const bufferExpiration = 5 * 60 * 1000;
        return !!this.jwt.token && this.jwt.exp > Date.now() + bufferExpiration;
    }
    cacheGetEventId(kalturaEventId) {
        return EpEventIdCache.get(kalturaEventId);
    }
    cacheSetEventId(kalturaEventId, epEventId) {
        EpEventIdCache.set(kalturaEventId, epEventId);
    }
    /**
     * Handle API response errors consistently
     * @param response The fetch response object
     * @param callerName Name of the calling function for better error context
     * @throws Error with detailed information about the failure
     */
    handleResponseError(response, callerName) {
        const traceid = response.headers.get('x-traceid');
        const epSession = response.headers.get('x-ep-session');
        throw new Error(`Failed to ${callerName}: ${response.status} ${response.statusText}\nx-traceid: ${traceid}\nx-ep-session: ${epSession}`);
    }
    /**
     * Get common headers for API requests
     */
    getHeaders(epEventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const jwt = yield this.getJwt();
            return (0, utils_1.removeEmptyProps)({
                Authorization: `Bearer ${jwt}`,
                'Content-Type': 'application/json',
                'x-eventId': epEventId,
            });
        });
    }
}
exports.EpClient = EpClient;
// Export a singleton instance
exports.epClient = new EpClient();
