import { z } from 'zod'

const roleDescription =
  "Account-level role on the Event Platform. Admin: full platform access including billing and team management. Organizer: can create and fully manage events. ContentManager: can manage event content but cannot create events or manage team. Example: 'Organizer'"

export const TeamMemberRole = z.enum(['Admin', 'Organizer', 'ContentManager'])

export const CreateTeamMemberDto = z.object({
  email: z.string().email().describe("Team member email. Example: 'john@company.com'"),
  role: TeamMemberRole.describe(roleDescription),
  firstName: z.string().describe("Team member first name. Example: 'John'"),
  lastName: z.string().describe("Team member last name. Example: 'Doe'"),
})

export const UpdateTeamMemberDto = z.object({
  id: z.string().describe("Team member Kaltura id. Example: 'e3b0c44298fc1c149'"),
  firstName: z.string().optional().describe("Team member first name. Example: 'John'"),
  lastName: z.string().optional().describe("Team member last name. Example: 'Doe'"),
  role: TeamMemberRole.optional().describe(roleDescription),
  disabled: z
    .boolean()
    .optional()
    .describe(
      'Whether the team member is disabled for Event Platform login. Set to true to suspend access. Example: false',
    ),
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
