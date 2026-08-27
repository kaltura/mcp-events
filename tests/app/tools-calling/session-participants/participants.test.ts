import { after, before, describe, test } from 'node:test'
import { fail } from 'node:assert'
import {
  assertCalledTools,
  assertJudgmentCorrect,
  checkConnections,
  getExamplesArr,
  lastToolInput,
  runAgent,
} from '../../../lib'
import { createNearestEventByApi, deleteEventByApi, deleteEventUserByApi } from '../events/helpers'
import assert from 'node:assert/strict'
import {
  addParticipantToSessionByAPI,
  createAddSessionParticipantPrompt,
  createAllToolsSessionParticipantsPrompt,
  createListSessionParticipantsPrompt,
  createRemoveSessionParticipantsPrompt,
  createUpdateSessionParticipantsPrompt,
  createUserAndSessionToAddParticipant,
} from './helpers'

describe('tool selection for a session participants', () => {
  let eventId: number
  const userIds: string[] = []

  before(async (): Promise<void> => {
    await checkConnections()
    try {
      eventId = await createNearestEventByApi()
    } catch (e) {
      fail(`Failed to create an event for the nearest available date: ${e}`)
    }
  })

  after(async (): Promise<void> => {
    for await (const userId of userIds) {
      await deleteEventUserByApi(eventId, userId)
    }
    await deleteEventByApi(eventId)
  })

  test('add a participant to an event session', async () => {
    const examples = getExamplesArr('add-session-participants.txt', __dirname)
    const expectedTools = ['add-session-participants']
    const participantInfo = await createUserAndSessionToAddParticipant(eventId)
    userIds.push(participantInfo.userId)
    const prompt = createAddSessionParticipantPrompt(participantInfo)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    assert.deepEqual(
      lastToolInput(result),
      {
        eventId,
        sessionId: participantInfo.sessionId,
        speakers: [{ order: 1, role: 'simpleSpeaker', userId: participantInfo.userId }],
      },
      `Invalid arguments in the called tool ${expectedTools[0]}`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('list participants of an event session', async () => {
    const examples = getExamplesArr('list-session-participants.txt', __dirname)
    const expectedTools = ['list-session-participants']
    const participantInfo = await createUserAndSessionToAddParticipant(eventId)
    userIds.push(participantInfo.userId)
    await addParticipantToSessionByAPI(participantInfo)
    const prompt = createListSessionParticipantsPrompt(eventId, participantInfo.sessionId)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    assert.deepEqual(
      lastToolInput(result),
      { eventId, sessionId: participantInfo.sessionId },
      `Invalid arguments in the called tool ${expectedTools[0]}`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('update a participant of an event session', async () => {
    const examples = getExamplesArr('update-session-participants.txt', __dirname)
    const expectedTools = ['update-session-participants']
    const participantInfo = await createUserAndSessionToAddParticipant(eventId)
    userIds.push(participantInfo.userId)
    await addParticipantToSessionByAPI(participantInfo)
    const updatedRole = 'advancedSpeaker'
    const prompt = createUpdateSessionParticipantsPrompt(participantInfo, updatedRole)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    assert.deepEqual(
      lastToolInput(result),
      {
        eventId,
        sessionId: participantInfo.sessionId,
        speakers: [{ role: updatedRole, userId: participantInfo.userId }],
      },
      `Invalid arguments in the called tool ${expectedTools[0]}`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('remove a participant of an event session', async () => {
    const examples = getExamplesArr('remove-session-participants.txt', __dirname)
    const expectedTools = ['remove-session-participants']
    const participantInfo = await createUserAndSessionToAddParticipant(eventId)
    userIds.push(participantInfo.userId)
    await addParticipantToSessionByAPI(participantInfo)
    const prompt = createRemoveSessionParticipantsPrompt(participantInfo)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    assert.deepEqual(
      lastToolInput(result),
      {
        eventId,
        sessionId: participantInfo.sessionId,
        speakerIds: [participantInfo.userId],
      },
      `Invalid arguments in the called tool ${expectedTools[0]}`,
    )
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })

  test('all tools called', async () => {
    const examples = getExamplesArr('all-session-participants-tools-called.txt', __dirname)
    const expectedTools = [
      'add-session-participants',
      'update-session-participants',
      'remove-session-participants',
    ]
    const participantInfo = await createUserAndSessionToAddParticipant(eventId)
    const prompt = createAllToolsSessionParticipantsPrompt(participantInfo)
    const result = await runAgent(prompt)
    assertCalledTools(result, expectedTools, true)
    await assertJudgmentCorrect(prompt, result.finalText, examples)
  })
})
