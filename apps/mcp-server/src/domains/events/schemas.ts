import { z } from 'zod'
import { PresetTemplates } from '../../resources/presetTemplates'
import { SupportedTimeZones } from '../../resources/timeZones'

const templateIdEnum = z
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  .enum(PresetTemplates.map((template) => template.templateId))
  .describe(
    'default ids: no session: tm0000, with interactive room: tm1000, with Live Webcast: tm2000, simulated live session: tm3000, room broadcasting to live webcast: tm4000',
  )
const ObjectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')

export const CreateEventDto = z.object({
  templateId: z
    .union([templateIdEnum, ObjectId])
    .describe("Kaltura Event Template ID. Example: '507f1f77bcf86cd799439011'"),
  name: z.string().describe("Event Name. Example: 'Virtual Town hall 2025'"),
  description: z.string().optional().describe("Event Description. Example: 'Annual company-wide update'"),
  startDate: z.string().datetime().describe("Event Start Date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
  endDate: z.string().datetime().describe("Event End Date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
  timezone: z
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .enum(SupportedTimeZones)
    .describe(
      "Event Timezone. Example: 'America/New_York'. Accepting the Official time zone database version 2022f",
    ),
})

export const DeleteEventDto = z.object({
  id: z.number().describe('Event ID. Example: 98765'),
})

export const ListEventFilterDto = z.object({
  idIn: z.array(z.number()).optional().describe('Filter for events with ids in the provided array.'),
  templateIdIn: z
    .array(z.union([templateIdEnum, ObjectId]))
    .optional()
    .describe('Filter for events with template ids in the provided array.'),
  searchTerm: z
    .string()
    .optional()
    .describe("Filter for events including the search term provided (by Name). Example: 'Town hall'"),
  startDateGreaterThanOrEqual: z
    .string()
    .datetime()
    .optional()
    .describe("Filter for events with start date >= the provided value. Example: '2025-01-01T00:00:00Z'"),
  startDateLessOrEqualThan: z
    .string()
    .datetime()
    .optional()
    .describe('Filter for events with start date <= the provided value.'),
  endDateGreaterThanOrEqual: z
    .string()
    .datetime()
    .optional()
    .describe('Filter for events with end date >= the provided value.'),
  endDateLessOrEqualThan: z
    .string()
    .datetime()
    .optional()
    .describe("Filter for events with end date <= the provided value. Example: '2025-12-31T23:59:59Z'"),
  labels: z
    .array(z.string())
    .optional()
    .describe(
      "Filter for events with labels matching any of the provided array items. Example: ['all-hands', 'q2']",
    ),
})
export type TListEventFilterDto = z.infer<typeof ListEventFilterDto>

export const PagerDto = z.object({
  offset: z.number().default(0).describe('Page index. Default: 0. Example: 0'),
  limit: z.number().min(1).max(15).default(15).describe('Page size. Default: 30. Example: 10'),
})

export const EventOrderBy = z
  .enum(['+name', '-name', '+createdAt', '-createdAt', '+startDate', '-startDate'])
  .describe(
    "Sort order. '+name' A-Z by name, '-name' Z-A by name, '+createdAt' oldest first, '-createdAt' newest first, '+startDate' earliest start first, '-startDate' latest start first.",
  )

export const ListEventDto = z.object({
  filter: ListEventFilterDto.optional().describe('Filter information.'),
  pager: PagerDto.optional().describe('Pagination information.'),
  orderBy: EventOrderBy.optional(),
})

export const DuplicateEventDto = z.object({
  sourceEventId: z.number().describe('(Required) Source Event ID to duplicate from. Example: 98765'),
  name: z.string().describe("(Required) Name for the new (duplicated) event. Example: 'Virtual Townhall 2025 Copy'"),
  timezone: z
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .enum(SupportedTimeZones)
    .describe("(Required) Timezone for the new event. Example: 'America/New_York'"),
  description: z.string().optional().describe('Description for the new event.'),
  startDate: z
    .string()
    .datetime()
    .optional()
    .describe("New event start date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
  endDate: z
    .string()
    .datetime()
    .optional()
    .describe("New event end date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
  duplicateUsers: z
    .object({
      roles: z
        .array(z.enum(['Speaker', 'Moderator', 'EventTeam']))
        .describe("User roles to copy to the new event. Example: ['Speaker', 'Moderator']"),
      skipEmail: z.boolean().describe('Skip sending invitation emails to the duplicated users.'),
    })
    .optional()
    .describe('Optionally copy event users of the specified roles to the new event.'),
})

export const UpdateEventDto = z.object({
  id: z.number().describe('Event ID. Example: 98765'),
  name: z.string().optional().describe("Event name. Example: 'Updated Virtual Town hall'"),
  description: z.string().optional().describe("Event description. Example: 'Updated description'"),
  startDate: z
    .string()
    .datetime()
    .optional()
    .describe("Event start date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
  endDate: z
    .string()
    .datetime()
    .optional()
    .describe("Event end date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
  doorsOpenDate: z
    .string()
    .datetime()
    .optional()
    .describe("Event doors open date (ISO 8601). Example: '2025-05-01T13:30:00Z'"),
  timezone: z.string().optional().describe("Event timezone. Example: 'America/New_York'"),
  labels: z.array(z.string()).optional().describe("Event labels. Example: ['all-hands', 'q2']"),
  logoEntryId: z.string().optional().describe("Event logo entry id. Example: '1_xextzqk8'"),
  bannerEntryId: z.string().optional().describe("Event banner id. Example: '1_p3im68oa'"),
})
