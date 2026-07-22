import { after, before, describe, test } from 'node:test'
import { fail } from 'node:assert'
import { checkConnections } from './fixtures'
import {
  createNearestEventByApi,
  deleteEventByApi,
  deleteEventUserByApi,
  inviteUserToEvent,
  postJson,
} from './helpers/eventsHelper'
import { createSessionByApi, createSessionInfo } from './helpers/sessionsHelper'
import { runAgent } from './mcpAgent'
import {
  assertCalledTools,
  assertJudgmentCorrect,
  getExamplesArr,
  lastToolInput,
} from './helpers/generalHelpers'
import { generateUserInfo } from './helpers/eventUserHelper'
import assert from 'node:assert/strict'

type SessionParticipantInfo = {
  sessionId: string
  eventId: number
  userId: string
}

function createAddSessionParticipantPrompt(participantInfo: SessionParticipantInfo): string {
  return (
    `There is the Kaltura event with the ID ${participantInfo.eventId}. ` +
    `To the event's session with the ID ${participantInfo.sessionId} ` +
    `add as a simple speaker the event user with the ID ${participantInfo.userId} to be a participant of the session.`
  )
}

function createListSessionParticipantsPrompt(eventId: number, sessionId: string): string {
  return (
    `There is the Kaltura event with the ID ${eventId}. ` +
    `List all the participants of the event session with the ID ${sessionId}`
  )
}

/**
 * Add a participant as a simple speaker to a Kaltura event session, calling the public API directly.
 *
 * @param participantInfo - The event, session and user identifying the participant to add.
 * @throws Error if the API call fails.
 */
async function addParticipantToSessionByAPI(participantInfo: SessionParticipantInfo): Promise<void> {
  const { eventId, sessionId, userId } = participantInfo
  const response = await postJson(
    '/session-participants/add',
    { eventId, sessionId, speakers: [{ userId, order: 1, role: 'simpleSpeaker' }] },
    30_000,
  )
  if (!response.ok) {
    throw new Error(
      `Failed to add participant ${userId} to session ${sessionId} of event ${eventId}: ` +
        `${response.status} ${await response.text()}`,
    )
  }
}

async function createUserAndSessionToAddParticipant(eventId: number): Promise<SessionParticipantInfo> {
  let userId: string, sessionId: string
  try {
    const userInfo = generateUserInfo(['Speaker'])
    userId = await inviteUserToEvent(userInfo, eventId)
  } catch (e) {
    fail(`Failed to invite a user to the event ${eventId}: ${e}`)
  }
  try {
    const sessionInfo = await createSessionInfo(eventId)
    sessionId = await createSessionByApi(sessionInfo)
  } catch (e) {
    fail(`Failed to create a session for the event ${eventId} : ${e}`)
  }
  return { userId, sessionId, eventId }
}

function createUpdateSessionParticipantsPrompt(
  participantInfo: SessionParticipantInfo,
  role: string,
): string {
  return (
    `There are the Kaltura event with the ID ${participantInfo.eventId} and its session with the ID ${participantInfo.sessionId}. ` +
    `Could you set the role ${role} to the session participant with the user ID ${participantInfo.userId}.`
  )
}

function createRemoveSessionParticipantsPrompt(participantInfo: SessionParticipantInfo): string {
  return (
    `There are the Kaltura event with the ID ${participantInfo.eventId} and its session with the ID ${participantInfo.sessionId}. ` +
    `Could you remove the session participant with the user ID ${participantInfo.userId}.`
  )
}

function createAllToolsSessionParticipantsPrompt(participantInfo: SessionParticipantInfo): string {
  return (
    createAddSessionParticipantPrompt(participantInfo) +
    'Then update the role of the participant to an advanced speaker. ' +
    'When the participant role has been updated remove the participant from the session.'
  )
}

describe('tool selection for a session participants', { concurrency: true }, () => {
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
    const examples = getExamplesArr('add-session-participants.txt')
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
    const examples = getExamplesArr('list-session-participants.txt')
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
    const examples = getExamplesArr('update-session-participants.txt')
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
    const examples = getExamplesArr('remove-session-participants.txt')
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
    const examples = getExamplesArr('all-session-participants-tools-called.txt')
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
