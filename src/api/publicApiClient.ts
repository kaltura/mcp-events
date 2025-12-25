import assert from 'node:assert'
import { config } from '../config/config'
import { SessionVisibility, SessionType, TListEventFilterDto } from '../schemas/eventSchemas'

/**
 * API client for Public API
 */
export class PublicAPIClient {
  private baseUrl: string
  private ks: string | undefined
  private readonly paths = Object.freeze({
    event: {
      create: 'events/create',
      list: 'events/list',
      update: 'events/update',
      delete: 'events/delete',
    },
    session: {
      create: 'sessions/create',
      list: 'sessions/list',
      speakerList: 'sessions/speakerList',
    },
  })

  constructor() {
    this.baseUrl = config.urls.publicApi as string
    this.ks = config.ks
    assert(this.ks, 'Error: KS (Kaltura Session) is not set. API calls may fail.')
  }

  /**
   * Create a new event
   */
  async createEvent(params: {
    name: string
    templateId: string
    startDate: string
    endDate: string
    timezone: string
    description?: string
  }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.event.create}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'createEvent')
    }

    return await response.text()
  }

  /**
   * List events with filtering and pagination
   */
  async listEvents(params: {
    filter?: TListEventFilterDto
    pager?: { offset?: number; limit?: number }
  }): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${this.paths.event.list}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'listEvents')
    }

    return await response.json()
  }

  /**
   * Update an existing event
   */
  async updateEvent(params: {
    id: number
    name?: string
    description?: string
    startDate?: string
    endDate?: string
    doorsOpenDate?: string
    timezone?: string
    labels?: string[]
    logoEntryId?: string
    bannerEntryId?: string
  }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.event.update}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'updateEvent')
    }

    return await response.text()
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.event.delete}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'deleteEvent')
    }

    return await response.text()
  }

  /**
   * List event session speakers
   */
  async listSessionSpeakers(eventId: number, sessionId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.session.speakerList}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify({ eventId, sessionId }),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'listSessions')
    }

    return await response.text()
  }

  /**
   * List sessions for a given event
   */
  async listSessions(eventId: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.session.list}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify({ eventId }),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'listSessions')
    }

    return await response.text()
  }

  async createSession(
    eventId: number,
    session: {
      name: string
      type: SessionType
      description?: string
      startDate?: string
      endDate?: string
      tags?: string[]
      isManualLive?: boolean
      visibility?: SessionVisibility
      sourceEntryId?: string
      imageUrlEntryId?: string
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.session.create}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify({ eventId, session }),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'createSession')
    }

    return await response.text()
  }

  /**
   * Handle API response errors consistently
   * @param response The fetch response object
   * @param callerName Name of the calling function for better error context
   * @throws Error with detailed information about the failure
   */
  private async handleResponseError(response: Response, callerName: string): Promise<void> {
    const kalturaSession = response.headers.get('x-kaltura-session')
    const traceId = response.headers.get('x-traceid')
    let body = ''
    try {
      body = await response.text()
    } catch (e) {}
    throw new Error(
      `Failed to ${callerName}: ${response.status} ${response.statusText}\nx-traceId: ${traceId}\nx-kaltura-session: ${kalturaSession}\n${body}`,
    )
  }

  /**
   * Get common headers for API requests
   */
  private get getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.ks}`,
      'Content-Type': 'application/json',
      'X-Kaltura-Client-Tag': 'mcp-events-pa-client',
    }
  }
}

// Export a singleton instance
export const publicApiClient = new PublicAPIClient()
