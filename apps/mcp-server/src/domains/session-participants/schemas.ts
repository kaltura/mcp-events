import { z } from 'zod'

const SpeakerInputDto = z.object({
  userId: z.string().describe('Event user ID (from event-users/invite)'),
  order: z.number().default(0).optional().describe('Display order (default 0)'),
  isHidden: z.boolean().default(false).optional().describe('Whether speaker is hidden (default false)'),
  role: z
    .enum(['simpleSpeaker', 'advancedSpeaker'])
    .default('simpleSpeaker')
    .optional()
    .describe("Speaker sub-role (default: 'simpleSpeaker')"),
})

export const AddSessionParticipantsDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
  speakers: z
    .array(SpeakerInputDto)
    .optional()
    .describe('Speakers to add (max 10)'),
  moderatorIds: z
    .array(z.string())
    .optional()
    .describe("Moderator user IDs to add (max 10). Example: ['def789abc012def789abc012def789abc012def789abc012def789abc012def7']"),
})

export const RemoveSessionParticipantsDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
  speakerIds: z
    .array(z.string())
    .optional()
    .describe("Speaker user IDs to remove (max 10). Example: ['1ef91ea60970881d430d4c6658eb8dba12a25e6083037b594a1871d129dd32b9']"),
  moderatorIds: z
    .array(z.string())
    .optional()
    .describe("Moderator user IDs to remove (max 10). Example: ['abc123def456abc123def456abc123def456abc123def456abc123def456abc1']"),
})

export const ListSessionParticipantsDto = z.object({
  eventId: z.number().describe('Kaltura event ID. Example: 98765'),
  sessionId: z.string().describe("Session entry ID. Example: '0_syswy6uj'"),
})
