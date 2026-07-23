import { after, before, describe, test } from 'node:test'
import { checkConnections } from '../../fixtures'
import { AgentResult, runAgent } from '../../mcpAgent'
import {
  createNearestEventByApi,
  deleteEventByApi,
  EventUserInfo,
  getUsersIdsOfEvent,
  inviteUserToEvent,
} from '../events/helpers'
import { assertCalledTools, assertJudgmentCorrect, getExamplesArr, lastToolInput } from '../../generalHelpers'
import assert from 'node:assert/strict'
import { generateUserInfo } from './helpers'

function createEventUserInvitingPrompt(eventId: number, userInfo: EventUserInfo): string {
  return (
    `For the Kaltura event with the ID ${eventId} invite '${userInfo.firstName} ${userInfo.lastName}' ` +
    `with the email '${userInfo.email}' working as '${userInfo.title}' in the company '${userInfo.company}' ` +
    `with bio '${userInfo.bio}'. He/she will be a ${userInfo.roles} in the event. Don't send invitation to the user's email.`
  )
}

function checkUserInfo(result: AgentResult, eventId: number, userInfo: EventUserInfo): void {
  const args = lastToolInput(result)
  assert.equal(args.eventId, eventId, 'Invalid eventId')
  assert.equal(args.firstName, userInfo.firstName, 'Invalid firstName')
  assert.equal(args.lastName, userInfo.lastName, 'Invalid lastName')
  assert.equal(args.email, userInfo.email, 'Invalid email')
  assert.equal(args.title, userInfo.title, 'Invalid title')
  assert.equal(args.company, userInfo.company, 'Invalid company')
  assert.equal(args.bio, userInfo.bio, 'Invalid bio')
  assert.deepEqual(args.roles, userInfo.roles, 'Invalid roles')
  assert.equal(args.skipEmail, userInfo.skipEmail, 'Invalid skipEmail')
}

function createUpdateEventUserPrompt(
  userInfo: EventUserInfo,
  eventId: number,
  expectedTitle: string,
  expectedCompany: string,
): string {
  return (
    `for event user ${userInfo.firstName} ${userInfo.lastName} in the Kaltura event ` +
    `with the ID ${eventId} change his/her title to '${expectedTitle}' and company to '${expectedCompany}'`
  )
}

function createAllToolsCallPrompt(eventId: number): string {
  const userInfo = generateUserInfo()
  return (
    createEventUserInvitingPrompt(eventId, userInfo) +
    " Set the title of user to 'Bla' and after it delete the user from the event. Do not check the meaning of these sequence of actions"
  )
}

describe('tool selection for event users operations', { concurrency: true }, () => {
  let eventId: number

  before(async (): Promise<void> => {
    await checkConnections()
    eventId = await createNearestEventByApi()
  })

  after(async (): Promise<void> => await deleteEventByApi(eventId)) // TODO: Delete the used Event Users

  test('invite an event user', async () => {
    const examples = getExamplesArr('invite-event-user.txt', import.meta.url)
    const expectedTools = ['invite-event-user']
    const userInfo = generateUserInfo()
    const prompt = createEventUserInvitingPrompt(eventId, userInfo)
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools)
    checkUserInfo(result, eventId, userInfo)
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('list of event users', async () => {
    const examples = getExamplesArr('list-event-users.txt', import.meta.url)
    const expectedTools = ['list-event-users']
    const prompt = `list all the users of the Kaltura event with the ID ${eventId}`
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools)
    assert.deepEqual(lastToolInput(result), { eventId }, 'Invalid eventId in the called tool')
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('delete an event user', async () => {
    const examples = getExamplesArr('delete-event-user.txt', import.meta.url)
    const expectedTools = ['list-event-users', 'delete-event-user']
    const userInfo = generateUserInfo()
    const userId = await inviteUserToEvent(userInfo, eventId)
    const userIds = await getUsersIdsOfEvent(eventId)
    assert(userIds.includes(userId), `User was not invited to the event ${eventId}`)

    const prompt = `delete the event user ${userInfo.firstName} ${userInfo.lastName} in the Kaltura event with the ID ${eventId}`
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    assert.deepEqual(
      lastToolInput(result),
      { eventId, userId },
      `Invalid arguments in the called tool ${expectedTools[1]}`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('update an event user', async () => {
    const examples = getExamplesArr('update-event-user.txt', import.meta.url)
    const expectedTools = ['list-event-users', 'update-event-user']
    const userInfo = generateUserInfo()
    const userId = await inviteUserToEvent(userInfo, eventId)
    const userIds = await getUsersIdsOfEvent(eventId)
    assert(userIds.includes(userId), `User was not invited to the event ${eventId}`)

    const title = 'Updated title'
    const company = 'Updated company'
    const prompt = createUpdateEventUserPrompt(userInfo, eventId, title, company)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    assert.deepEqual(
      lastToolInput(result),
      { eventId, userId, company, title },
      `Invalid arguments in the called tool ${expectedTools[1]}`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('all tools called', async () => {
    const examples = getExamplesArr('all-event-users-tools-called.txt', import.meta.url)
    const expectedTools = ['invite-event-user', 'update-event-user', 'delete-event-user']
    const prompt = createAllToolsCallPrompt(eventId)
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools)
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })
})
