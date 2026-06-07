import { z } from 'zod'

export const EventUserRole = z
  .enum(['Attendees', 'Speaker', 'Moderator'])
  .describe(
    "Event-scoped user role. Attendees: registered participant, can view sessions. Speaker: can present in sessions (must also be added as session participant via add-session-participants). Moderator: can manage session chat and Q&A. Example: 'Speaker'",
  )

export const InviteEventUserDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  firstName: z.string().describe("First name. Example: 'Jane'"),
  lastName: z.string().describe("Last name. Example: 'Doe'"),
  email: z.string().email().describe("Email address. Example: 'jane@example.com'"),
  title: z.string().optional().describe("Job title. Example: 'VP Engineering'"),
  company: z.string().optional().describe("Company name. Example: 'Acme Corp'"),
  bio: z
    .string()
    .optional()
    .describe(
      "Bio / description shown on the user's profile. Example: 'Senior engineer with 10 years of cloud experience'",
    ),
  roles: z
    .array(EventUserRole)
    .optional()
    .describe(
      "Event roles to assign (default: ['Attendees']). Attendees: viewer. Speaker: presenter (must also be added to session via add-session-participants). Moderator: manages chat/Q&A. Example: ['Speaker']",
    ),
  imageUrlEntryId: z
    .string()
    .optional()
    .describe(
      "Kaltura entry ID of an already-uploaded profile image. Obtain by uploading an image to Kaltura first. Example: '1_p9ek1ngh'",
    ),
  skipEmail: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Set to true to suppress the invitation email. Useful for bulk imports or when the user will be notified through another channel. Default: false',
    ),
})

export const ListEventUsersDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  filter: z
    .object({
      searchTerm: z
        .string()
        .optional()
        .describe("Full-text search across first name, last name, and email. Example: 'jane'"),
      roles: z
        .array(EventUserRole)
        .optional()
        .describe("Filter to users with any of these roles. Example: ['Speaker', 'Moderator']"),
      idIn: z
        .array(z.string())
        .optional()
        .describe(
          "Filter to specific user IDs (hashed Kaltura user IDs). Example: ['1ef91ea60970881d430d4c6658eb8dba12a25e6083037b594a1871d129dd32b9']",
        ),
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
    .enum(['+createdAt', '-createdAt', '+fullName', '-fullName'])
    .optional()
    .describe(
      "Sort order. '+createdAt' oldest first, '-createdAt' newest first, '+fullName' A-Z, '-fullName' Z-A. Example: '-createdAt'",
    ),
})

export const UpdateEventUserDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  userId: z
    .string()
    .describe(
      "Hashed Kaltura user ID of the event user to update. Obtain from list-event-users. Example: '1ef91ea60970881d430d4c6658eb8dba12a25e6083037b594a1871d129dd32b9'",
    ),
  firstName: z.string().optional().describe("Updated first name. Example: 'Jane'"),
  lastName: z.string().optional().describe("Updated last name. Example: 'Doe'"),
  title: z.string().optional().describe("Updated job title. Example: 'VP Engineering'"),
  company: z.string().optional().describe("Updated company name. Example: 'Acme Corp'"),
  bio: z
    .string()
    .optional()
    .describe(
      "Updated bio shown on the user's profile. Example: 'Senior engineer with 10 years of cloud experience'",
    ),
  roles: z
    .array(EventUserRole)
    .optional()
    .describe(
      "IMPORTANT: replaces ALL current roles via diff — send every role you want the user to have, not just new ones. To add a role, include both existing and new roles. To remove a role, omit it. Example: ['Speaker', 'Moderator']",
    ),
  imageUrlEntryId: z
    .string()
    .optional()
    .describe("Kaltura entry ID of an already-uploaded profile image. Example: '1_p9ek1ngh'"),
})

export const DeleteEventUserDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  userId: z
    .string()
    .describe(
      "Hashed Kaltura user ID to remove from the event (removes all event roles and session assignments). Example: '1ef91ea60970881d430d4c6658eb8dba12a25e6083037b594a1871d129dd32b9'",
    ),
})
