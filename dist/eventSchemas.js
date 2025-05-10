"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEventDto = exports.ListEventDto = exports.PagerDto = exports.ListEventFilterDto = exports.DeleteEventDto = exports.CreateEventDto = void 0;
const zod_1 = require("zod");
exports.CreateEventDto = zod_1.z.object({
    templateId: zod_1.z.string().describe("Kaltura Event Template ID. Example: '507f1f77bcf86cd799439011'"),
    name: zod_1.z.string().describe("Event Name. Example: 'Virtual Townhall 2025'"),
    description: zod_1.z.string().optional().describe("Event Description. Example: 'Annual company-wide update'"),
    startDate: zod_1.z.string().datetime().describe("Event Start Date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
    endDate: zod_1.z.string().datetime().describe("Event End Date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
    timezone: zod_1.z.string().describe("Event Timezone. Example: 'America/New_York'"),
});
exports.DeleteEventDto = zod_1.z.object({
    id: zod_1.z.number().describe("Event ID. Example: 98765"),
});
exports.ListEventFilterDto = zod_1.z.object({
    idIn: zod_1.z.array(zod_1.z.string()).optional().describe("Filter for events with ids in the provided array."),
    searchTerm: zod_1.z.string().optional().describe("Filter for events including the search term provided (by Name). Example: 'townhall'"),
    startDateGreaterThanOrEqual: zod_1.z.string().datetime().optional().describe("Filter for events with start date >= the provided value. Example: '2025-01-01T00:00:00Z'"),
    startDateLessThanOrEqual: zod_1.z.string().datetime().optional().describe("Filter for events with start date <= the provided value."),
    endDateGreaterThanOrEqual: zod_1.z.string().datetime().optional().describe("Filter for events with end date >= the provided value."),
    endDateLessThanOrEqual: zod_1.z.string().datetime().optional().describe("Filter for events with end date <= the provided value. Example: '2025-12-31T23:59:59Z'"),
});
exports.PagerDto = zod_1.z.object({
    offset: zod_1.z.number().default(0).describe("Page index. Default: 0. Example: 0"),
    limit: zod_1.z.number().default(30).describe("Page size. Default: 30. Example: 10"),
});
exports.ListEventDto = zod_1.z.object({
    filter: exports.ListEventFilterDto.optional().describe("Filter information."),
    pager: exports.PagerDto.optional().describe("Pagination information."),
});
exports.UpdateEventDto = zod_1.z.object({
    id: zod_1.z.number().describe("Event ID. Example: 98765"),
    name: zod_1.z.string().optional().describe("Event name. Example: 'Updated Virtual Townhall'"),
    description: zod_1.z.string().optional().describe("Event description. Example: 'Updated description'"),
    startDate: zod_1.z.string().datetime().optional().describe("Event start date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
    endDate: zod_1.z.string().datetime().optional().describe("Event end date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
    doorsOpenDate: zod_1.z.string().datetime().optional().describe("Event doors open date (ISO 8601). Example: '2025-05-01T13:30:00Z'"),
    timezone: zod_1.z.string().optional().describe("Event timezone. Example: 'America/New_York'"),
    labels: zod_1.z.array(zod_1.z.string()).optional().describe("Event labels. Example: ['all-hands', 'q2']"),
    logoEntryId: zod_1.z.string().optional().describe("Event logo entry id. Example: '1_xextzqk8'"),
    bannerEntryId: zod_1.z.string().optional().describe("Event banner id. Example: '1_p3im68oa'"),
});
