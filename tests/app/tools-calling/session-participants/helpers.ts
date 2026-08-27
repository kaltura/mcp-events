import { generateUserInfo } from '../event-user/helpers'
import { inviteUserToEvent, postJson } from '../events/helpers'
import { fail } from 'node:assert'
import { createSessionByApi, createSessionInfo } from '../sessions/helpers'

type SessionParticipantInfo = {
  sessionId: string
  eventId: number
  userId: string
}

export function createAddSessionParticipantPrompt(participantInfo: SessionParticipantInfo): string {
  return (
    `There is the Kaltura event with the ID ${participantInfo.eventId}. ` +
    `To the event's session with the ID ${participantInfo.sessionId} ` +
    `add as a simple speaker the event user with the ID ${participantInfo.userId} to be a participant of the session.`
  )
}

export function createListSessionParticipantsPrompt(eventId: number, sessionId: string): string {
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
export async function addParticipantToSessionByAPI(participantInfo: SessionParticipantInfo): Promise<void> {
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

export async function createUserAndSessionToAddParticipant(eventId: number): Promise<SessionParticipantInfo> {
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

export function createUpdateSessionParticipantsPrompt(
  participantInfo: SessionParticipantInfo,
  role: string,
): string {
  return (
    `There are the Kaltura event with the ID ${participantInfo.eventId} and its session with the ID ${participantInfo.sessionId}. ` +
    `Could you set the role ${role} to the session participant with the user ID ${participantInfo.userId}.`
  )
}

export function createRemoveSessionParticipantsPrompt(participantInfo: SessionParticipantInfo): string {
  return (
    `There are the Kaltura event with the ID ${participantInfo.eventId} and its session with the ID ${participantInfo.sessionId}. ` +
    `Could you remove the session participant with the user ID ${participantInfo.userId}.`
  )
}

export function createAllToolsSessionParticipantsPrompt(participantInfo: SessionParticipantInfo): string {
  return (
    createAddSessionParticipantPrompt(participantInfo) +
    'Then update the role of the participant to an advanced speaker. ' +
    'When the participant role has been updated remove the participant from the session.'
  )
}
