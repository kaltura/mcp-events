import { z } from 'zod'

export const EventUserRole = z
  .enum(['Attendees', 'Speaker', 'Moderator'])
  .describe("Event role. Example: 'Speaker'")

export const InviteEventUserDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  firstName: z.string().describe("First name. Example: 'Jane'"),
  lastName: z.string().describe("Last name. Example: 'Doe'"),
  email: z.string().email().describe("Email address. Example: 'jane@example.com'"),
  title: z.string().optional().describe("Job title. Example: 'VP Engineering'"),
  company: z.string().optional().describe("Company name. Example: 'Acme Corp'"),
  bio: z.string().optional().describe('Bio / description'),
  roles: z
    .array(EventUserRole)
    .optional()
    .describe("Event roles to assign (default: ['Attendees']). Example: ['Speaker']"),
  imageUrlEntryId: z
    .string()
    .optional()
    .describe("Kaltura entry ID of uploaded profile image. Example: '1_p9ek1ngh'"),
  skipEmail: z.boolean().optional().default(false).describe('Skip sending invitation email'),
})

export const ListEventUsersDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  filter: z
    .object({
      searchTerm: z.string().optional().describe('Search across name and email'),
      roles: z.array(EventUserRole).optional().describe("Filter by roles. Example: ['Speaker']"),
      idIn: z.array(z.string()).optional().describe('Filter by user IDs'),
    })
    .optional()
    .describe('Filter options'),
  pager: z
    .object({
      offset: z.number().default(0).describe('Offset (0-based). Default: 0'),
      limit: z.number().default(30).describe('Page size. Default: 30'),
    })
    .optional()
    .describe('Pagination options'),
  orderBy: z
    .string()
    .optional()
    .describe("Sort order: +createdAt, -createdAt, +fullName, -fullName. Example: '-createdAt'"),
})

export const UpdateEventUserDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  userId: z.string().describe('User ID to update'),
  firstName: z.string().optional().describe('First name'),
  lastName: z.string().optional().describe('Last name'),
  title: z.string().optional().describe('Job title'),
  company: z.string().optional().describe('Company'),
  bio: z.string().optional().describe('Bio'),
  roles: z
    .array(EventUserRole)
    .optional()
    .describe(
      "Roles to assign. Replaces the user's current roles via diff — send all desired roles, not just new ones. Example: ['Speaker']",
    ),
  imageUrlEntryId: z.string().optional().describe("Profile image entry ID. Example: '1_p9ek1ngh'"),
})

export const DeleteEventUserDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  userId: z.string().describe('User ID to remove from event'),
})
