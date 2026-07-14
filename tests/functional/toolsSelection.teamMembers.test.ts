import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { faker } from '@faker-js/faker'
import {
  assertCalledTools,
  assertJudgmentCorrect,
  getExamplesArr,
  lastToolInput,
} from './helpers/generalHelpers'
import { AgentResult, runAgent } from './mcpAgent'
import { checkConnections } from './fixtures'
import { config } from './config'

type TeamMemberInfo = {
  email: string
  firstName: string
  lastName: string
  role: string
  id?: string
}

const ROLE_NAME = 'ContentManager'

function generateTeamMemberInfo(): TeamMemberInfo {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    firstName: firstName,
    lastName: lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
    role: ROLE_NAME,
  }
}

function createTeamMemberAddPrompt(teamMemberInfo: TeamMemberInfo): string {
  return (
    'Add a team member with the following information: ' +
    `email: ${teamMemberInfo.email}, first name: ${teamMemberInfo.firstName}, last name: ${teamMemberInfo.lastName}, role: ${teamMemberInfo.role}. ` +
    `That means: ${teamMemberInfo.firstName} ${teamMemberInfo.lastName} will have platform-wide access to manage event content across all events in my account, ` +
    `this is not limited to a single event, ${teamMemberInfo.role} role allows managing event content but cannot create events or manage the team.`
  )
}

async function createTeamMember(teamMemberInfo: TeamMemberInfo): Promise<string> {
  const response = await fetch(`${config.KALTURA_PUBLIC_API}/team-members/create`, {
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

async function deleteTeamMember(id: string | undefined): Promise<void> {
  if (!id) return
  const response = await fetch(`${config.KALTURA_PUBLIC_API}/team-members/delete`, {
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

async function listTeamMembers(): Promise<TeamMemberInfo[]> {
  const response = await fetch(`${config.KALTURA_PUBLIC_API}/team-members/list`, {
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

function checkTeamMemberInfo(result: AgentResult, teamMemberInfo: TeamMemberInfo): void {
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

function createTeamMemberUpdatePrompt(teamMemberInfo: TeamMemberInfo): string {
  return `Rename the team member '${teamMemberInfo.firstName} ${teamMemberInfo.lastName}' to 'Bla Bla' in the Kaltura Events platform`
}

describe('Tools Selection for team members operations', { concurrency: true }, () => {
  before(async () => {
    await checkConnections()
  })

  test('create a team member', async () => {
    const examples = getExamplesArr('create-team-member.txt')
    const expectedTools = ['create-team-member']
    const teamMemberInfo = generateTeamMemberInfo()
    const prompt = createTeamMemberAddPrompt(teamMemberInfo)
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools, true)
    checkTeamMemberInfo(result, teamMemberInfo)

    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('list team members', async () => {
    const examples = getExamplesArr('list-team-members.txt')
    const expectedTools = ['list-team-members']
    const prompt = `List all team members with the role ${ROLE_NAME} on the Event Platform`
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools, true)
    assert.deepEqual(lastToolInput(result), {}, 'Invalid tool call arguments')
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('update a team member', async () => {
    // const examples = getExamplesArr('update-team-members.txt')
    const expectedTools = ['list-team-members', 'update-team-member']
    const teamMemberInfo = generateTeamMemberInfo()
    await createTeamMember(teamMemberInfo)
    const isTeamMemberCreated = (await listTeamMembers()).some((tm) => tm.email === teamMemberInfo.email)
    assert.ok(isTeamMemberCreated, 'Team member was not created successfully')
    const prompt = createTeamMemberUpdatePrompt(teamMemberInfo)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
  })

  test('delete a team member', async () => {
    const examples = getExamplesArr('delete-team-member.txt')
    const expectedTools = ['list-team-members', 'delete-team-member']
    const teamMemberInfo = generateTeamMemberInfo()
    await createTeamMember(teamMemberInfo)
    const isTeamMemberCreated = (await listTeamMembers()).some((tm) => tm.email === teamMemberInfo.email)
    assert.ok(isTeamMemberCreated, 'Team member was not created successfully')
    const prompt = `Delete the team member '${teamMemberInfo.firstName} ${teamMemberInfo.lastName}' with the email ${teamMemberInfo.email} in the Kaltura Events platform`
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  after(async () => {
    const teamMembers = (await listTeamMembers()).filter((tm) => tm.role === ROLE_NAME)
    await Promise.all(teamMembers.map((tm) => deleteTeamMember(tm.id)))
  })
})
