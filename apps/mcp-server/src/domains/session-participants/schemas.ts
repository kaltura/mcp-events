import { z } from 'zod'

const SpeakerInputDto = z.object({
  userId: z
    .string()
    .describe(
      "Hashed Kaltura user ID of the event user to add as speaker. User must already have the Speaker role on the event (via invite-event-user or update-event-user). Obtain the ID from list-event-users. Example: '1ef91ea60970881d430d4c6658eb8dba12a25e6083037b594a1871d129dd32b9'",
    ),
  order: z
    .number()
    .optional()
    .default(0)
    .describe('Display order on the session page (0-based, lower = appears first). Example: 1'),
  isHidden: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Set to true to hide this speaker from the public session page (still active in the session). Default: false',
    ),
  role: z
    .enum(['simpleSpeaker', 'advancedSpeaker'])
    .optional()
    .default('simpleSpeaker')
    .describe(
      "Speaker sub-role controlling in-session capabilities. simpleSpeaker: standard presenter (camera, mic, screen share). advancedSpeaker: elevated permissions (can manage other speakers, access backstage controls). Default: 'simpleSpeaker'",
    ),
})

export const AddSessionParticipantsDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
  speakers: z
    .array(SpeakerInputDto)
    .optional()
    .describe(
      'Speakers to add to this session (max 10). Users must already have the Speaker role on the event.',
    ),
  moderatorIds: z
    .array(z.string())
    .optional()
    .describe(
      "Hashed Kaltura user IDs of moderators to add to this session (max 10). Users must already have the Moderator role on the event. Moderators can manage chat, Q&A, and attendee interactions. Example: ['def789abc012def789abc012def789abc012def789abc012def789abc012def7']",
    ),
})

export const RemoveSessionParticipantsDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
  speakerIds: z
    .array(z.string())
    .optional()
    .describe(
      "Hashed Kaltura user IDs of speakers to remove from this session (max 10). Does not remove the user's event-level Speaker role. Example: ['1ef91ea60970881d430d4c6658eb8dba12a25e6083037b594a1871d129dd32b9']",
    ),
  moderatorIds: z
    .array(z.string())
    .optional()
    .describe(
      "Hashed Kaltura user IDs of moderators to remove from this session (max 10). Does not remove the user's event-level Moderator role. Example: ['abc123def456abc123def456abc123def456abc123def456abc123def456abc1']",
    ),
})

export const ListSessionParticipantsDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
})
