import { AgentResult, config, lastToolInput } from '../../../lib'
import assert from 'node:assert/strict'
import { appConfig } from '../../config'
import { randomFirstName, randomPerson } from '../helpers/fakeData'

type TeamMemberInfo = {
  email: string
  firstName: string
  lastName: string
  role: string
  id?: string
}
export const ROLE_NAME = 'ContentManager'

export function generateTeamMemberInfo(): TeamMemberInfo {
  const { firstName, lastName } = randomPerson()
  return {
    firstName: firstName,
    lastName: lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
    role: ROLE_NAME,
  }
}

export function createTeamMemberAddPrompt(teamMemberInfo: TeamMemberInfo): string {
  return (
    'Add a team member with the following information: ' +
    `email: ${teamMemberInfo.email}, first name: ${teamMemberInfo.firstName}, last name: ${teamMemberInfo.lastName}, role: ${teamMemberInfo.role}. ` +
    // eslint-disable-next-line max-len
    `That means: ${teamMemberInfo.firstName} ${teamMemberInfo.lastName} will have platform-wide access to manage event content across all events in my account, ` +
    `this is not limited to a single event, ${teamMemberInfo.role} role allows managing event content but cannot create events or manage the team, ` +
    "this is a permanent account role (not a temporary event invitation). Don't ask any additional info."
  )
}

export async function createTeamMember(teamMemberInfo: TeamMemberInfo): Promise<string> {
  const response = await fetch(`${appConfig.KALTURA_PUBLIC_API}/team-members/create`, {
    method: 'POST',
    headers: {
      Authorization: `ks ${config.KALTURA_KS}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(teamMemberInfo),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Failed to create team member: ${response.status} ${text}`)
  }
  const json = JSON.parse(text) as { teamMember?: { id?: string } }
  if (!json.teamMember?.id) {
    throw new Error(`Invalid response on creating team member: ${text}`)
  }
  return json.teamMember.id
}

export async function deleteTeamMember(id: string | undefined): Promise<void> {
  if (!id) return
  const response = await fetch(`${appConfig.KALTURA_PUBLIC_API}/team-members/delete`, {
    method: 'POST',
    headers: {
      Authorization: `ks ${config.KALTURA_KS}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to delete team member: ${response.status} ${text}`)
  }
}

export async function listTeamMembers(): Promise<TeamMemberInfo[]> {
  const response = await fetch(`${appConfig.KALTURA_PUBLIC_API}/team-members/list`, {
    method: 'POST',
    headers: {
      Authorization: `ks ${config.KALTURA_KS}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Failed to list team members: ${response.status} ${text}`)
  }
  const json = JSON.parse(text) as { teamMembers?: TeamMemberInfo[] }
  return json.teamMembers ?? []
}

export function checkTeamMemberInfo(result: AgentResult, teamMemberInfo: TeamMemberInfo): void {
  const args = lastToolInput(result)

  assert.equal(args.email, teamMemberInfo.email, 'Expected final response to include team member email')
  assert.equal(
    args.firstName,
    teamMemberInfo.firstName,
    'Expected tool input to include team member first name',
  )
  assert.equal(args.lastName, teamMemberInfo.lastName, 'Expected tool input to include team member last name')
  assert.equal(args.role, teamMemberInfo.role, 'Expected tool input to include team member role')
}

export function createTeamMemberUpdatePrompt(teamMemberInfo: TeamMemberInfo): string {
  return `Rename the team member '${teamMemberInfo.firstName} ${teamMemberInfo.lastName}' to 'Bla Bla' in the Kaltura Events platform`
}

export function createPromptForAllToolsCall(teamMemberInfo: TeamMemberInfo): string {
  return (
    createTeamMemberAddPrompt(teamMemberInfo) +
    ` Change the first name of the team member to ${randomFirstName()}.` +
    `Check the first name has been updated. Then delete the team member.`
  )
}
