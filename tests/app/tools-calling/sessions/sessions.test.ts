import { after, before, describe, test } from 'node:test'
import {
  assertCalledTools,
  assertJudgmentCorrect,
  checkConnections,
  getExamplesArr,
  lastToolInput,
  runAgent,
} from '../../../lib'
import { createNearestEventByApi, deleteEventByApi } from '../events/helpers'
import { fail } from 'node:assert'
import assert from 'node:assert/strict'
import { createSessionInfo, SessionInfo } from './helpers'

function createSessionPrompt(sessionInfo: SessionInfo): string {
  return (
    `Could you create a ${sessionInfo.session.visibility} Kaltura Event session '${sessionInfo.session.name}' ` +
    `described as '${sessionInfo.session.description}' for the event with the ID ${sessionInfo.eventId}. ` +
    `The appointed time of the session: from ${sessionInfo.session.startDate} to ${sessionInfo.session.endDate}. ` +
    `The type of the session is ${sessionInfo.session.type} and tagged as ${sessionInfo.session.tags[0]}.`
  )
}

describe('tool selection for event sessions operations', () => {
  let eventId: number

  before(async (): Promise<void> => {
    await checkConnections()
    try {
      eventId = await createNearestEventByApi()
    } catch (e) {
      fail(`Failed to create an event for the nearest available date: ${e}`)
    }
  })

  after(async (): Promise<void> => await deleteEventByApi(eventId))

  test('create event session', async () => {
    const examples = getExamplesArr('create-event-session.txt', __dirname)
    const expectedTools = ['create-event-session']
    const sessionInfo = await createSessionInfo(eventId)
    const prompt = createSessionPrompt(sessionInfo)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools)
    assert.deepEqual(
      lastToolInput(result),
      {
        id: eventId,
        session: {
          name: sessionInfo.session.name,
          description: sessionInfo.session.description,
          type: sessionInfo.session.type,
          startDate: sessionInfo.session.startDate,
          endDate: sessionInfo.session.endDate,
          visibility: sessionInfo.session.visibility,
          tags: sessionInfo.session.tags,
        },
      },
      `Invalid arguments in the called tool ${expectedTools[0]}`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('list event sessions', async () => {
    const examples = getExamplesArr('list-event-sessions.txt', __dirname)
    const expectedTools = ['list-event-sessions']
    const prompt = 'List event sessions from the Kaltura event with ID ' + eventId
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools)
    assert.deepEqual(
      lastToolInput(result),
      { eventId },
      `Invalid arguments in the called tool ${expectedTools[0]}`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })
})
