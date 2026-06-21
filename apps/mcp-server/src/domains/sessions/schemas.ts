import { z } from 'zod'

export enum SessionType {
  InteractiveRoom = 'MeetingEntry',
  SimuLive = 'SimuLive',
  LiveWebcast = 'LiveWebcast',
  DiyLiveWebcast = 'LiveKME',
  VirtualLearningRoom = 'VirtualLearningRoom',
  Invalid = 'Invalid',
}

export enum SessionVisibility {
  /**
   * In sites, if in related media.
   */
  published = 'published',
  /**
   * Only KMS.
   */
  unlisted = 'unlisted',
  /**
   * In Sites, if not in related media.
   */
  private = 'private',
}

export const ListSessionDto = z.object({
  eventId: z.number().describe('Event ID. Example: 98765'),
})

export const ListSessionSpeakersDto = z.object({
  eventId: z.number().describe('Event ID. Example: 98765'),
  sessionId: z
    .string()
    .describe("Session Entry ID (Belonging to the specified event). Example: '1_abcd1234'"),
})

export const CreateSessionDto = z.object({
  id: z.number().describe('Event ID. Example: 98765'),
  session: z.object({
    name: z.string().describe("Session Name. Example: 'Virtual Town hall 2025 - Session 1'"),
    type: z
      .nativeEnum(SessionType)
      .describe(
        "Session type. Allowed values: 'MeetingEntry' (Interactive Room — participants join with camera/mic), 'LiveWebcast' (one-way broadcast to large audience), 'SimuLive' (pre-recorded video broadcast as live), 'LiveKME' (DIY live webcast via Kaltura MediaEngine), 'VirtualLearningRoom' (educational session), 'Invalid' (placeholder, do not use).",
      ),
    description: z.string().describe("Session Description. Example: 'Session 1 description'"),
    startDate: z
      .string()
      .datetime()
      .describe("Session Start Date (ISO 8601). Example: '2025-05-01T14:00:00Z'"),
    endDate: z
      .string()
      .datetime()
      .describe("Session End Date (ISO 8601). Example: '2025-05-01T16:00:00Z'"),
    tags: z.array(z.string()).describe('Session tags. Example: ["tag1", "tag2"]').optional(),
    visibility: z
      .nativeEnum(SessionVisibility)
      .describe(
        "Controls session visibility. 'published': visible on the event site, accessible to any authenticated user. 'unlisted': not visible on the event site, but accessible via direct link to authenticated users. 'private': not visible on the event site, accessible only to the entry owner or co-editors. Default is 'published'.",
      )
      .optional(),
    isManualLive: z.boolean().optional(),
    imageUrlEntryId: z
      .string()
      .describe('Kaltura entry id for the session thumbnail image, example: 1_abcd1234')
      .optional(),
    sourceEntryId: z
      .string()
      .describe('For Simulive session types, the VOD entry, example: 1_abcd1234')
      .optional(),
  }),
})
export type TCreateSessionDto = z.infer<typeof CreateSessionDto>

export const UpdateSessionDto = z.object({
  eventId: z.number().describe('Event ID the session belongs to. Example: 98765'),
  sessionId: z.string().describe("Session Entry ID to update. Example: '0_4q5ie48b'"),
  name: z.string().describe("Session Name. Example: 'Updated Keynote'").optional(),
  description: z.string().describe("Session Description. Example: 'Updated description'").optional(),
  startDate: z
    .string()
    .datetime()
    .describe("Session Start Date (ISO 8601). Example: '2025-05-01T14:00:00Z'")
    .optional(),
  endDate: z
    .string()
    .datetime()
    .describe("Session End Date (ISO 8601). Example: '2025-05-01T16:00:00Z'")
    .optional(),
  tags: z.array(z.string()).describe('Session tags. Example: ["tag1", "tag2"]').optional(),
  visibility: z
    .nativeEnum(SessionVisibility)
    .describe(
      "Controls session visibility. 'published': visible on the event site, accessible to any authenticated user. 'unlisted': not visible on the event site, but accessible via direct link to authenticated users. 'private': not visible on the event site, accessible only to the entry owner or co-editors.",
    )
    .optional(),
})
export type TUpdateSessionDto = z.infer<typeof UpdateSessionDto>
