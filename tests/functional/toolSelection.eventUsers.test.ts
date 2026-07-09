import { after, before, describe, test } from 'node:test'
import { checkConnections } from './fixtures'
import { AgentResult, runAgent } from './mcpAgent'
import {
  createNearestEventByApi,
  deleteEventByApi,
  EventUserInfo,
} from './helpers/eventsHelper'
import {
  assertCalledTools,
  assertJudgmentCorrect,
  getExamplesArr,
  lastToolInput,
} from './helpers/generalHelpers'
import { faker } from '@faker-js/faker'
import assert from 'node:assert/strict'

function createEventUserInvitingPrompt(eventId: number, userInfo: EventUserInfo): string {
  return `For the Kaltura event with the ID ${eventId} invite '${userInfo.firstName} ${userInfo.lastName}' with the email '${userInfo.email}' working as '${userInfo.title}' in the company '${userInfo.company}' with bio '${userInfo.bio}'. He/she will be a ${userInfo.roles} in the event. Don't send invitation to the user's email`
}

function generateUserInfo(): EventUserInfo {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email({ firstName: faker.person.firstName(), lastName: faker.person.lastName() }),
    title: faker.person.jobTitle(),
    company: faker.company.name(),
    bio: faker.person.bio(),
    roles: ['Speaker'],
    skipEmail: true,
  }
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

describe('tool selection for event users operations', { concurrency: true }, () => {
  let eventId: number

  before(async () => {
    await checkConnections()
    eventId = await createNearestEventByApi()
  })

  after(async () => await deleteEventByApi(eventId))

  test('invite an event user', async () => {
    const examples = getExamplesArr('invite-event-user.txt')
    const expectedTools = ['invite-event-user']
    const userInfo = generateUserInfo()
    const prompt = createEventUserInvitingPrompt(eventId, userInfo)
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools)
    checkUserInfo(result, eventId, userInfo)
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test.only('empty list of event users', async () => {
    const examples = getExamplesArr('list-event-users.txt')
    const expectedTools = ['list-event-users']
    const prompt = `list all the users of the Kaltura event with the ID ${eventId}`
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools)
    assert.deepEqual(lastToolInput(result), { eventId }, 'Invalid eventId in the called tool')
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })
})
