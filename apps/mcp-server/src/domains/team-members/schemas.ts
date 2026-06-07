import { z } from 'zod'

export const TeamMemberRole = z
  .enum(['Admin', 'Organizer', 'ContentManager'])
  .describe("Team member Event Platform role. Example: 'Organizer'")

export const CreateTeamMemberDto = z.object({
  email: z.string().email().describe("Team member email. Example: 'john@company.com'"),
  role: TeamMemberRole,
  firstName: z.string().describe("Team member first name. Example: 'John'"),
  lastName: z.string().describe("Team member last name. Example: 'Doe'"),
})

export const UpdateTeamMemberDto = z.object({
  id: z.string().describe("Team member Kaltura id. Example: 'e3b0c44298fc1c149'"),
  firstName: z.string().optional().describe("Team member first name. Example: 'John'"),
  lastName: z.string().optional().describe("Team member last name. Example: 'Doe'"),
  role: TeamMemberRole.optional(),
  disabled: z
    .boolean()
    .optional()
    .describe('Whether the team member is disabled for Event Platform login. Example: false'),
})

export const DeleteTeamMemberDto = z.object({
  id: z.string().describe("Team member Kaltura id. Example: 'e3b0c44298fc1c149'"),
})

export const ListTeamMembersDto = z.object({
  pager: z
    .object({
      offset: z.number().default(0).describe('Page index. Default: 0. Example: 0'),
      limit: z.number().default(30).describe('Page size. Default: 30. Example: 10'),
    })
    .optional()
    .describe('Pagination information.'),
})
