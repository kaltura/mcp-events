import { EventDates, getDatesOfEvent, MINUTE_MS, postJson, toKalturaIso } from './eventsHelper'

type SessionVisibility = 'published' | 'unlisted' | 'private'
const sessionPossibleVals = ['published', 'unlisted', 'private']
export type SessionInfo = {
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

export async function createSessionInfo(eventId: number): Promise<SessionInfo> {
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

/** Create a Kaltura event session and return its ID. */
export async function createSessionByApi(sessionInfo: SessionInfo): Promise<string> {
  const response = await postJson('/sessions/create', sessionInfo, 30_000)
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Failed to create a session for event ${sessionInfo.eventId}: ${response.status} ${text}`)
  }
  const json = JSON.parse(text) as { session?: { id?: string } }
  if (!json.session?.id) {
    throw new Error(`Invalid response on creating session for event ${sessionInfo.eventId}: ${text}`)
  }
  return json.session.id
}
