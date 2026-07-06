// Eval: does Claude pick the right MCP tool for a given prompt?
//
// Run a live MCP server first (`npm run start:http`), populate tests/.env, then:
//   npm run test:functional
//
// Port of the Python `test_tool_selection.py`.

import assert from 'node:assert/strict'
import { before, describe, test } from 'node:test'

import { createNearestEventByApi, getNearestFreeSlot } from './eventsHelper'
import { checkConnections, withTempEvent } from './fixtures'
import { anthropicJudgeResponse, runAgent, type AgentResult } from './mcpAgent'

const TIMEZONE = 'Etc/UTC'
const TOOL_UPDATE_EVENT = 'update-event'
const EVENT_TEMPLATES = [
  { name: 'Blank template', id: 'tm0000' },
  { name: 'Interactive session', id: 'tm1000' },
  { name: 'Live webcast', id: 'tm2000' },
  { name: 'Pre-recorded live', id: 'tm3000' },
  { name: 'DIY live broadcast', id: 'tm4000' },
]

const MONTH_FMT = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function hhmm(date: Date): string {
  return `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`
}

function getStrOfNearestDateForEvent(dateFrom: Date, dateTo: Date): string {
  return `${dateFrom.getUTCDate()} of ${MONTH_FMT.format(dateFrom)} from ${hhmm(dateFrom)} to ${hhmm(dateTo)} of ${TIMEZONE}`
}

function randomEventTemplate(): { name: string; id: string } {
  return EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)]
}

function createEventPrompt(eventTemplate: string, name: string, dateFrom: Date, dateTo: Date): string {
  return `create the event '${name}' of the template '${eventTemplate}' at the next date: ${getStrOfNearestDateForEvent(dateFrom, dateTo)}`
}

function calledToolNames(result: AgentResult): string[] {
  return result.toolsCalled.map((t) => t.name)
}

function lastToolInput(result: AgentResult): Record<string, unknown> {
  return result.toolsCalled[result.toolsCalled.length - 1].input
}

function assertCalledTools(result: AgentResult, expected: string[], includeResponseText = false): void {
  const called = calledToolNames(result)
  const suffix = includeResponseText ? `\n\nThe response text is:\n\t${result.finalText}` : ''
  assert.deepEqual(
    called,
    expected,
    `Invalid tools call: expected ${JSON.stringify(expected)}, got ${JSON.stringify(called)}${suffix}`,
  )
}

function assertDatetimeClose(
  actualIso: unknown,
  expected: Date,
  toolName: string,
  fieldName: string,
  toleranceMs = 60_000,
): void {
  const actual = new Date(String(actualIso))
  const diff = Math.abs(actual.getTime() - expected.getTime())
  assert.ok(
    diff <= toleranceMs,
    `Invalid event ${fieldName} in the called tool '${toolName}': expected ~${expected.toISOString()}, got ${actual.toISOString()}`,
  )
}

async function assertJudgmentCorrect(prompt: string, finalText: string, examples: string[]): Promise<void> {
  const verdict = await anthropicJudgeResponse(prompt, finalText, examples)
  assert.ok(
    verdict.startsWith('CORRECT'),
    `Incorrect answer:\n\tPrompt: ${prompt}\n\tAnswer: ${finalText}\n\tExplanation: ${verdict}`,
  )
}

describe('tool selection for events operations', { concurrency: true }, () => {
  before(async () => {
    await checkConnections()
  })

  test('list events', async () => {
    const examples = [
      'There are no Kaltura events scheduled for today. Would you like me to show events from a different date range, list upcoming events, or create a new one?',
    ]
    const prompt = 'show me all the Kaltura events of today'
    const expectedTools = ['list-events']
    const result = await runAgent(prompt)

    assertCalledTools(result, expectedTools)
    const filter = lastToolInput(result).filter as Record<string, unknown>
    const today = new Date().toISOString().slice(0, 10)
    assert.equal(
      filter.startDateGreaterThanOrEqual,
      `${today}T00:00:00Z`,
      `Invalid start date of the called tool '${expectedTools[0]}'`,
    )
    assert.equal(
      filter.startDateLessOrEqualThan,
      `${today}T23:59:59Z`,
      `Invalid end date of the called tool '${expectedTools[0]}'`,
    )

    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('event creation', async () => {
    const examples = [
      "Perfect! I've successfully created the event **'Bla'** with the following details:\n\n- **Event ID**: 10001\n- **Type**: Live Webcast (tm2000 template)\n- **Timezone**: Etc/UTC\n\nThe event is now ready to use!",
    ]
    const eventName = 'Bla'
    const eventTemplate = randomEventTemplate()
    const { start, end } = await getNearestFreeSlot()
    const prompt = createEventPrompt(eventTemplate.name, eventName, start, end)
    const expectedTools = ['create-event']

    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools)
    const args = lastToolInput(result)

    assert.equal(args.name, eventName, `Invalid event name in the called tool '${expectedTools[0]}'`)
    assert.equal(args.timezone, TIMEZONE, `Invalid event timezone in the called tool '${expectedTools[0]}'`)

    assertDatetimeClose(args.startDate, start, expectedTools[0], 'startDate')
    assertDatetimeClose(args.endDate, end, expectedTools[0], 'endDate')

    assert.equal(
      args.templateId,
      eventTemplate.id,
      `Invalid event templateId.\n\tExpected: ${eventTemplate.id}\n\tActual: ${String(args.templateId)}.\n\tThe prompt: ${prompt}`,
    )

    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('delete event', async () => {
    const examples = [
      'The Kaltura event with ID (some integer) has been successfully deleted. All associated resources and configurations have been permanently removed.',
    ]
    const expectedTools = ['delete-event']
    const eventId = await createNearestEventByApi()
    const prompt = `delete the Kaltura event with the ID ${eventId}`

    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools)

    assert.deepEqual(
      lastToolInput(result),
      { id: eventId },
      `Invalid event id in the called tool '${expectedTools[0]}'`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('update event', async () => {
    await withTempEvent(async (eventId) => {
      const examples = [
        "Perfect! I've successfully renamed the Kaltura event with ID (some integer) to 'Updated event'. The event name has been updated.",
      ]
      const expectedTools = [TOOL_UPDATE_EVENT]
      const prompt = `rename the Kaltura event with the ID ${eventId} to 'Updated event'`

      const result = await runAgent(prompt)
      assertCalledTools(result, expectedTools)

      assert.equal(
        lastToolInput(result).id,
        eventId,
        `Invalid event id in the called tool '${expectedTools[0]}'`,
      )
      await assertJudgmentCorrect(prompt, result.finalText, examples)
    })
  })

  test('duplicate event', async () => {
    await withTempEvent(async (eventId) => {
      const examples = [
        'Perfect! I have successfully duplicated the event. The new event (ID 10002) named "Duplicated event" has been created with all the configurations from the original event.',
      ]
      const expectedTools = ['duplicate-event']
      const { start, end } = await getNearestFreeSlot()
      const dateStr = getStrOfNearestDateForEvent(start, end)
      const name = 'Duplicated event'
      const prompt = `duplicate the Kaltura event with the ID ${eventId} to the date '${dateStr}' and name the duplicated event '${name}'`

      const result = await runAgent(prompt)
      assertCalledTools(result, expectedTools)
      const args = lastToolInput(result)

      assert.equal(
        args.sourceEventId,
        eventId,
        `Invalid the source event id in the called tool '${expectedTools[0]}'`,
      )
      assert.equal(
        args.name,
        name,
        `Invalid the name of the duplicated event in the called tool '${expectedTools[0]}'`,
      )
      assert.equal(
        args.timezone,
        TIMEZONE,
        `Invalid the timezone of the duplicated event in the called tool '${expectedTools[0]}'`,
      )

      assertDatetimeClose(args.startDate, start, expectedTools[0], 'startDate')
      assertDatetimeClose(args.endDate, end, expectedTools[0], 'endDate')

      await assertJudgmentCorrect(prompt, result.finalText, examples)
    })
  })

  test('all tools called', async () => {
    await withTempEvent(async () => {
      const examples = [
        'Perfect! I have completed all the tasks: created event "Bla", renamed it to "Renamed event", duplicated it to the next available date, and deleted both events. Both events have been successfully removed from the system.',
      ]
      const expectedTools = [
        'create-event',
        'update-event',
        'duplicate-event',
        'delete-event',
        'delete-event',
      ]
      const prompt =
        "Create a Kaltura 15 mins event 'Bla' today at 18:00, rename the event to 'Renamed event', duplicate it to other nearest available date and remove both events"

      const result = await runAgent(prompt)
      assertCalledTools(result, expectedTools, true)
      await assertJudgmentCorrect(prompt, result.finalText, examples)
    })
  })
})
