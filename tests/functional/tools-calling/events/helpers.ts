// Direct Kaltura REST helpers used to set up / tear down real events as test
// fixtures. These bypass the MCP server and talk to the Events API directly,
// mirroring the Python `events_helper.py`.

import { config } from '../../config'

export const MINUTE_MS = 60_000
export const DEFAULT_DURATION_MS = 15 * MINUTE_MS
const DEFAULT_LOOK_AHEAD_DAYS = 400

export interface FreeSlot {
  start: Date
  end: Date
}

export type EventDates = { start: Date; end: Date }

function authHeaders(): Record<string, string> {
  return {
    Authorization: `ks ${config.KALTURA_KS}`,
    'Content-Type': 'application/json',
  }
}

/** Format a Date as `YYYY-MM-DDTHH:MM:SSZ` (no milliseconds), matching the Python isoformat. */
export function toKalturaIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** POST a JSON body to a Kaltura Events public API path, authenticated with the configured KS. */
export async function postJson(path: string, body: unknown, timeoutMs: number): Promise<Response> {
  return fetch(`${config.KALTURA_PUBLIC_API}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
}

/** Find the nearest free time slot not overlapping any existing event. */
export async function getNearestFreeSlot(
  durationMs: number = DEFAULT_DURATION_MS,
  lookAheadDays: number = DEFAULT_LOOK_AHEAD_DAYS,
): Promise<FreeSlot> {
  const now = new Date()
  const windowEnd = new Date(now.getTime() + lookAheadDays * 24 * 60 * MINUTE_MS)

  const response = await postJson(
    '/events/list',
    {
      filter: {
        startDateGreaterThanOrEqual: toKalturaIso(now),
        endDateLessOrEqualThan: toKalturaIso(windowEnd),
      },
      pager: { limit: 15, offset: 0 },
      orderBy: '+startDate',
    },
    10_000,
  )
  if (!response.ok) {
    throw new Error(`Failed to list events: ${response.status} ${await response.text()}`)
  }

  const listed = (await response.json()) as { events?: Array<{ startDate?: string; endDate?: string }> }
  const events = listed.events ?? []
  const booked: FreeSlot[] = events
    .filter((ev) => ev.startDate && ev.endDate)
    .map((ev) => ({ start: new Date(ev.startDate as string), end: new Date(ev.endDate as string) }))

  const candidate = new Date(now)
  candidate.setUTCSeconds(0, 0)
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)

  while (candidate < windowEnd) {
    const slotEnd = new Date(candidate.getTime() + durationMs)
    const overlaps = booked.some((b) => b.start < slotEnd && candidate < b.end)
    if (!overlaps) {
      return { start: new Date(candidate), end: slotEnd }
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)
  }

  throw new Error(`No free slot found in the next ${lookAheadDays} days`)
}

/** Create a Kaltura event at the nearest available slot and return its ID. */
export async function createNearestEventByApi(
  durationMs: number = DEFAULT_DURATION_MS,
  lookAheadDays: number = DEFAULT_LOOK_AHEAD_DAYS,
): Promise<number> {
  const { start, end } = await getNearestFreeSlot(durationMs, lookAheadDays)

  const response = await postJson(
    '/events/create',
    {
      name: 'Test Event',
      description: 'Test description',
      templateId: 'tm1000',
      startDate: toKalturaIso(start),
      endDate: toKalturaIso(end),
      timezone: 'Etc/GMT-0',
    },
    60_000,
  )

  const text = await response.text()
  if (response.status !== 200) {
    throw new Error(`Invalid response on creating event: ${text}`)
  }
  const json = JSON.parse(text)
  if (!json.event?.id) {
    throw new Error(`Invalid response: ${text}`)
  }
  return json.event.id
}

export async function listUsersOfEvent(eventId: number): Promise<EventUserInfo[]> {
  const response = await postJson('/event-users/list', { eventId }, 30_000)
  if (!response.ok) {
    throw new Error(`Failed to list users of event ${eventId}: ${response.status} ${await response.text()}`)
  }
  const json = (await response.json()) as { users?: EventUserInfo[] }
  return json.users ?? []
}

export async function inviteUserToEvent(userInfo: EventUserInfo, eventId: number): Promise<string> {
  const response = await postJson('/event-users/invite', { eventId, ...userInfo }, 30_000)
  if (!response.ok) {
    throw new Error(`Failed to invite user to event ${eventId}: ${response.status} ${await response.text()}`)
  }
  const json = (await response.json()) as { user?: { id?: string } }
  if (!json.user) {
    throw Error(`No user found for event ${eventId}: ${await response.text()}`)
  }
  if (!json.user.id) {
    throw Error(`No user id found for event ${eventId}: ${eventId}`)
  }
  const userId = json.user.id
  if (!userId) {
    throw new Error(`No userId in invite response for event ${eventId}: ${response.text()}`)
  }
  return userId
}

export async function getUsersIdsOfEvent(eventId: number): Promise<string[]> {
  const users = await listUsersOfEvent(eventId)
  return users.map((u: EventUserInfo) => u.id).filter((id): id is string => !!id)
}

/** Remove a user from an event, including their session roles and groups. */
export async function deleteEventUserByApi(eventId: number, userId: string): Promise<void> {
  const response = await postJson('/event-users/delete', { eventId, userId }, 30_000)
  if (!response.ok) {
    throw new Error(
      `Failed to delete event user ${userId} from event ${eventId}: ${response.status} ${await response.text()}`,
    )
  }
}

export async function deleteEventByApi(eventId: number): Promise<void> {
  const response = await postJson('/events/delete', { id: eventId }, 60_000)
  if (!response.ok) {
    throw new Error(`Failed to delete event ${eventId}: ${response.status} ${await response.text()}`)
  }
}

export async function getDatesOfEvent(eventId: number): Promise<EventDates> {
  const response = await postJson(
    '/events/list',
    { filter: { idIn: [eventId] }, pager: { limit: 1, offset: 0 } },
    30_000,
  )
  if (!response.ok) {
    throw new Error(`Failed to get event ${eventId}: ${response.status} ${await response.text()}`)
  }
  const json = (await response.json()) as { events?: Array<{ startDate?: string; endDate?: string }> }
  const event = json.events?.[0]
  if (!event) {
    throw new Error(`Event ${eventId} not found`)
  }
  if (!event.startDate || !event.endDate) {
    throw new Error(`Event ${eventId} is missing startDate or endDate`)
  }
  return { start: new Date(event.startDate), end: new Date(event.endDate) }
}

export type EventUserInfo = {
  firstName: string
  lastName: string
  email: string
  title: string
  company: string
  bio: string
  roles: string[]
  skipEmail: boolean
  id?: string
}
