// Direct Kaltura REST helpers used to set up / tear down real events as test
// fixtures. These bypass the MCP server and talk to the Events API directly,
// mirroring the Python `events_helper.py`.

import { config } from '../config'

const MINUTE_MS = 60_000
const DEFAULT_DURATION_MS = 15 * MINUTE_MS
const DEFAULT_LOOK_AHEAD_DAYS = 400

export interface FreeSlot {
  start: Date
  end: Date
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `ks ${config.KALTURA_KS}`,
    'Content-Type': 'application/json',
  }
}

/** Format a Date as `YYYY-MM-DDTHH:MM:SSZ` (no milliseconds), matching the Python isoformat. */
function toKalturaIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

async function postJson(path: string, body: unknown, timeoutMs: number): Promise<Response> {
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

export async function deleteEventByApi(eventId: number): Promise<void> {
  const response = await postJson('/events/delete', { id: eventId }, 60_000)
  if (!response.ok) {
    throw new Error(`Failed to delete event ${eventId}: ${response.status} ${await response.text()}`)
  }
}
