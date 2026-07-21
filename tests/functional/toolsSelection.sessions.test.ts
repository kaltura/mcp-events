import { after, before, describe, test } from 'node:test'
import { checkConnections } from './fixtures'
import {
  createNearestEventByApi,
  deleteEventByApi,
  EventDates,
  getDatesOfEvent,
  MINUTE_MS,
  toKalturaIso,
} from './helpers/eventsHelper'
import { runAgent } from './mcpAgent'
import {
  assertCalledTools,
  assertJudgmentCorrect,
  getExamplesArr,
  lastToolInput,
} from './helpers/generalHelpers'
import { fail } from 'node:assert'
import assert from 'node:assert/strict'

type SessionVisibility = 'published' | 'unlisted' | 'private'
const sessionPossibleVals = ['published', 'unlisted', 'private']

type SessionInfo = {
  eventId: number
  session: {
    name: string
    type: string
    description: string
    visibility: SessionVisibility
    startDate: string
    endDate: string
    tags: [string]
    isManualLive: boolean
  }
}

async function createSessionInfo(eventId: number): Promise<SessionInfo> {
  const eventDates: EventDates = await getDatesOfEvent(eventId)
  const deltaMs = 2 * MINUTE_MS
  const sessionStartDateMs = eventDates.start.getTime() + deltaMs
  const sessionEndDateMs = eventDates.end.getTime() - deltaMs
  return {
    eventId: eventId,
    session: {
      name: `Session-${Date.now()}`,
      description: `Test session ${Date.now()}`,
      visibility: sessionPossibleVals[
        Math.floor(Math.random() * sessionPossibleVals.length)
      ] as SessionVisibility,
      startDate: toKalturaIso(new Date(sessionStartDateMs)),
      endDate: toKalturaIso(new Date(sessionEndDateMs)),
      tags: ['Bla'],
      isManualLive: false,
      type: 'MeetingEntry',
    },
  }
}

function createSessionPrompt(sessionInfo: SessionInfo): string {
  return (
    `Could you create a ${sessionInfo.session.visibility} Kaltura Event session '${sessionInfo.session.name}' ` +
    `described as '${sessionInfo.session.description}' for the event with the ID ${sessionInfo.eventId}. ` +
    `The appointed time of the session: from ${sessionInfo.session.startDate} to ${sessionInfo.session.endDate}. ` +
    `The type of the session is ${sessionInfo.session.type} and tagged as ${sessionInfo.session.tags[0]}.`
  )
}


function createAllTollsCallPrompt(sessionInfo: SessionInfo): string {
  return (
    createSessionPrompt(sessionInfo) +
    `. Check the created session is in the sessions list of the Kaltura event with the ID ${sessionInfo.eventId}.`
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
    const examples = getExamplesArr('create-event-session.txt')
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
    const examples = getExamplesArr('list-event-sessions.txt')
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
