"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSessionDto = exports.ListSessionDto = exports.UpdateEventDto = exports.ListEventDto = exports.EventOrderBy = exports.PagerDto = exports.ListEventFilterDto = exports.DeleteEventDto = exports.CreateEventDto = void 0;
const zod_1 = require("zod");
const presetTemplates_1 = require("../resources/presetTemplates");
const timeZones_1 = require("../resources/timeZones");
const templateIdEnum = zod_1.z
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .enum(presetTemplates_1.PresetTemplates.map((template) => template.templateId))
    .describe('default ids: no session: tm0000, with interactive room: tm1000, with Live Webcast: tm2000, simulated live session: tm3000, room broadcasting to live webcast: tm4000');
const ObjectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
exports.CreateEventDto = zod_1.z.object({
    templateId: zod_1.z
        .union([templateIdEnum, ObjectId])
        .describe("Kaltura Event Template ID. Example: '507f1f77bcf86cd799439011'"),
    name: zod_1.z.string().describe("Event Name. Example: 'Virtual Town hall 2025'"),
    description: zod_1.z.string().optional().describe("Event Description. Example: 'Annual company-wide update'"),
    startDate: zod_1.z.string().datetime().describe("Event Start Date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
    endDate: zod_1.z.string().datetime().describe("Event End Date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
    timezone: zod_1.z
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .enum(timeZones_1.SupportedTimeZones)
        .describe("Event Timezone. Example: 'America/New_York'. Accepting the Official time zone database version 2022f"),
});
exports.DeleteEventDto = zod_1.z.object({
    id: zod_1.z.number().describe('Event ID. Example: 98765'),
});
exports.ListEventFilterDto = zod_1.z.object({
    idIn: zod_1.z.array(zod_1.z.number()).optional().describe('Filter for events with ids in the provided array.'),
    searchTerm: zod_1.z
        .string()
        .optional()
        .describe("Filter for events including the search term provided (by Name). Example: 'Town hall'"),
    startDateGreaterThanOrEqual: zod_1.z
        .string()
        .datetime()
        .optional()
        .describe("Filter for events with start date >= the provided value. Example: '2025-01-01T00:00:00Z'"),
    startDateLessOrEqualThan: zod_1.z
        .string()
        .datetime()
        .optional()
        .describe('Filter for events with start date <= the provided value.'),
    endDateGreaterThanOrEqual: zod_1.z
        .string()
        .datetime()
        .optional()
        .describe('Filter for events with end date >= the provided value.'),
    endDateLessOrEqualThan: zod_1.z
        .string()
        .datetime()
        .optional()
        .describe("Filter for events with end date <= the provided value. Example: '2025-12-31T23:59:59Z'"),
    labels: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe("Filter for events with labels matching any of the provided array items. Example: ['all-hands', 'q2']"),
});
exports.PagerDto = zod_1.z.object({
    offset: zod_1.z.number().default(0).describe('Page index. Default: 0. Example: 0'),
    limit: zod_1.z.number().default(30).describe('Page size. Default: 30. Example: 10'),
});
exports.EventOrderBy = zod_1.z.enum(['+name', '-name', '+createdAt', '-createdAt', '+startDate', '-startDate']);
exports.ListEventDto = zod_1.z.object({
    filter: exports.ListEventFilterDto.optional().describe('Filter information.'),
    pager: exports.PagerDto.optional().describe('Pagination information.'),
    orderBy: exports.EventOrderBy.optional().describe("Order by field and direction. Example: '+name' for ascending, '-name' for descending"),
});
exports.UpdateEventDto = zod_1.z.object({
    id: zod_1.z.number().describe('Event ID. Example: 98765'),
    name: zod_1.z.string().optional().describe("Event name. Example: 'Updated Virtual Town hall'"),
    description: zod_1.z.string().optional().describe("Event description. Example: 'Updated description'"),
    startDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .describe("Event start date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
    endDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .describe("Event end date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
    doorsOpenDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .describe("Event doors open date (ISO 8601). Example: '2025-05-01T13:30:00Z'"),
    timezone: zod_1.z.string().optional().describe("Event timezone. Example: 'America/New_York'"),
    labels: zod_1.z.array(zod_1.z.string()).optional().describe("Event labels. Example: ['all-hands', 'q2']"),
    logoEntryId: zod_1.z.string().optional().describe("Event logo entry id. Example: '1_xextzqk8'"),
    bannerEntryId: zod_1.z.string().optional().describe("Event banner id. Example: '1_p3im68oa'"),
});
exports.ListSessionDto = zod_1.z.object({
    id: zod_1.z.number().describe('Event ID. Example: 98765'),
    filter: zod_1.z.object({
        tagsFilter: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe('Filter for sessions for the requested event optionally filter by session tags'),
    }),
});
exports.CreateSessionDto = zod_1.z.object({
    id: zod_1.z.number().describe('Event ID. Example: 98765'),
    session: zod_1.z.object({
        name: zod_1.z.string().describe("Session Name. Example: 'Virtual Town hall 2025 - Session 1'"),
        type: zod_1.z.enum(['MeetingEntry', 'SimuLive', 'LiveWebcast', 'LiveKME', 'VirtualLearningRoom']),
        description: zod_1.z.string().optional().describe("Session Description. Example: 'Session 1 description'"),
        startDate: zod_1.z
            .string()
            .datetime()
            .optional()
            .describe("Session Start Date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
        endDate: zod_1.z
            .string()
            .datetime()
            .optional()
            .describe("Session End Date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
        tags: zod_1.z.array(zod_1.z.string()).optional().describe('Session tags. Example: ["tag1", "tag2"]'),
        visibility: zod_1.z
            .enum(['published', 'unlisted', 'private'])
            .optional()
            .describe('Entry visibility. Example: "published"'),
        isManualLive: zod_1.z.boolean().optional(),
    }),
    imageUrlEntryId: zod_1.z.string().optional().describe('Image URL entry id. Example: "1_xextzqk8"'),
    sourceEntryId: zod_1.z.string().optional().describe('Source entry id. Example: "1_xextzqk8"'),
});
