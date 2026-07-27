// Eval: does Claude pick the right MCP tool for a given prompt?
//
// Populate tests/.env, then: npm run test:functional (spawns the MCP server over stdio).
//
// Port of the Python `test_tool_selection.py`.

import assert from 'node:assert/strict'
import { before, describe, test } from 'node:test'

import { createNearestEventByApi, getNearestFreeSlot, withTempEvent } from './helpers'
import {
  assertCalledTools,
  assertJudgmentCorrect,
  checkConnections,
  getExamplesArr,
  lastToolInput,
  runAgent,
} from '../../../lib'

const TIMEZONE = 'Etc/UTC'
const TOOL_UPDATE_EVENT = 'update-event'
const EVENT_TEMPLATE_IDS = ['tm0000', 'tm1000', 'tm2000', 'tm3000', 'tm4000']

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

const getRandomEventTemplateID = (): string =>
  EVENT_TEMPLATE_IDS[Math.floor(Math.random() * EVENT_TEMPLATE_IDS.length)]

function createEventPrompt(eventTemplate: string, name: string, dateFrom: Date, dateTo: Date): string {
  return `create the event '${name}' of the template ID '${eventTemplate}' at the next date: ${getStrOfNearestDateForEvent(dateFrom, dateTo)}`
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

describe('tool selection for events operations', () => {
  before(async () => {
    await checkConnections()
  })

  test('list events', async () => {
    const examples = getExamplesArr('list-events.txt', __dirname)
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
    const examples = getExamplesArr('event-creation.txt', __dirname)
    const eventName = `Event-${Date.now()}`
    const eventTemplateID = getRandomEventTemplateID()
    const { start, end } = await getNearestFreeSlot()
    const prompt = createEventPrompt(eventTemplateID, eventName, start, end)
    const expectedTools = ['create-event']

    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    const args = lastToolInput(result)

    assert.equal(args.name, eventName, `Invalid event name in the called tool '${expectedTools[0]}'`)
    assert.equal(args.timezone, TIMEZONE, `Invalid event timezone in the called tool '${expectedTools[0]}'`)

    assertDatetimeClose(args.startDate, start, expectedTools[0], 'startDate')
    assertDatetimeClose(args.endDate, end, expectedTools[0], 'endDate')

    assert.equal(
      args.templateId,
      eventTemplateID,
      `Invalid event templateId.\n\tExpected: ${eventTemplateID}\n\tActual: ${String(args.templateId)}.\n\tThe prompt: ${prompt}`,
    )

    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('delete event', async () => {
    const examples = getExamplesArr('delete-event.txt', __dirname)
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
      const examples = getExamplesArr('update-event.txt', __dirname)
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
      const examples = getExamplesArr('duplicate-event.txt', __dirname)
      const expectedTools = ['duplicate-event']
      const { start, end } = await getNearestFreeSlot()
      const dateStr = getStrOfNearestDateForEvent(start, end)
      const name = `Event-${Date.now()}`
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
      const examplesArr = getExamplesArr('all-event-tools-called.txt', __dirname)
      const expectedTools = ['create-event', 'update-event', 'duplicate-event', 'delete-event']
      const prompt =
        // eslint-disable-next-line max-len
        "Create a Kaltura 15 mins event 'Bla' on 1 of March next year at 18:00(UTC). Rename the event to 'Renamed event'. Duplicate it to 2nd of March. Then remove both events"

      const result = await runAgent(prompt)
      assertCalledTools(result, expectedTools, true)
      await assertJudgmentCorrect(prompt, result.finalText, examplesArr)
    })
  })
})
