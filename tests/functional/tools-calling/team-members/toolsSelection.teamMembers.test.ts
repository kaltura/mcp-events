import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { assertCalledTools, assertJudgmentCorrect, getExamplesArr, lastToolInput } from '../../generalHelpers'
import { runAgent } from '../../mcpAgent'
import { checkConnections } from '../../fixtures'
import {
  checkTeamMemberInfo,
  createPromptForAllToolsCall,
  createTeamMember,
  createTeamMemberAddPrompt,
  createTeamMemberUpdatePrompt,
  deleteTeamMember,
  generateTeamMemberInfo,
  listTeamMembers,
  ROLE_NAME,
} from './teamMembersHelper'

describe('Tools Selection for team members operations', { concurrency: true }, () => {
  before(async () => {
    await checkConnections()
  })

  test('create a team member', async () => {
    const examples = getExamplesArr('create-team-member.txt', import.meta.url)
    const expectedTools = ['create-team-member']
    const teamMemberInfo = generateTeamMemberInfo()
    const prompt = createTeamMemberAddPrompt(teamMemberInfo)
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools, true)
    checkTeamMemberInfo(result, teamMemberInfo)

    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('list team members', async () => {
    const examples = getExamplesArr('list-team-members.txt', import.meta.url)
    const expectedTools = ['list-team-members']
    const prompt = `List all team members with the role ${ROLE_NAME} on the Event Platform`
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools, true)
    assert.deepEqual(lastToolInput(result), {}, 'Invalid tool call arguments')
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('update a team member', async () => {
    const examples = getExamplesArr('update-team-members.txt', import.meta.url)
    const expectedTools = ['list-team-members', 'update-team-member']
    const teamMemberInfo = generateTeamMemberInfo()
    await createTeamMember(teamMemberInfo)
    const isTeamMemberCreated = (await listTeamMembers()).some((tm) => tm.email === teamMemberInfo.email)
    assert.ok(isTeamMemberCreated, 'Team member was not created successfully')
    const prompt = createTeamMemberUpdatePrompt(teamMemberInfo)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('delete a team member', async () => {
    const examples = getExamplesArr('delete-team-member.txt', import.meta.url)
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

  test('all tools called', async () => {
    const examples = getExamplesArr('all-team-members-tools-called.txt', import.meta.url)
    const expectedTools = ['create-team-member', 'update-team-member', 'delete-team-member']
    const teamMemberInfo = generateTeamMemberInfo()
    const prompt = createPromptForAllToolsCall(teamMemberInfo)
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools, true)
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  after(async () => {
    const teamMembers = (await listTeamMembers()).filter((tm) => tm.role === ROLE_NAME)
    await Promise.all(teamMembers.map((tm) => deleteTeamMember(tm.id)))
  })
})
