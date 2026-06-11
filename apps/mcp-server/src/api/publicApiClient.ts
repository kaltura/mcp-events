import { Injectable } from '@nestjs/common'
import { config } from '../config/config'
import { SessionType, SessionVisibility } from '../domains/sessions/schemas'
import { TListEventFilterDto } from '../domains/events/schemas'

/**
 * API client for Public API
 * Injectable service that accepts KS per request
 */
@Injectable()
export class PublicApiClient {
  private baseUrl: string
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
    teamMember: {
      create: 'team-members/create',
      update: 'team-members/update',
      delete: 'team-members/delete',
      list: 'team-members/list',
    },
    eventUser: {
      invite: 'event-users/invite',
      list: 'event-users/list',
      update: 'event-users/update',
      delete: 'event-users/delete',
    },
    sessionParticipant: {
      add: 'session-participants/add',
      remove: 'session-participants/remove',
      update: 'session-participants/update',
      list: 'session-participants/list',
    },
  })

  constructor() {
    this.baseUrl = config.kaltura.urls.publicApi as string
  }

  /**
   * Create a new event
   * @param ks Kaltura Session for this request
   */
  async createEvent(
    ks: string,
    params: {
      name: string
      templateId: string
      startDate: string
      endDate: string
      timezone: string
      description?: string
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.event.create}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'createEvent')
    }

    return await response.text()
  }

  /**
   * List events with filtering and pagination
   * @param ks Kaltura Session for this request
   */
  async listEvents(
    ks: string,
    params: {
      filter?: TListEventFilterDto
      pager?: { offset?: number; limit?: number }
    },
  ): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${this.paths.event.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'listEvents')
    }

    return await response.json()
  }

  /**
   * Update an existing event
   * @param ks Kaltura Session for this request
   */
  async updateEvent(
    ks: string,
    params: {
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
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.event.update}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'updateEvent')
    }

    return await response.text()
  }

  /**
   * Delete an event
   * @param ks Kaltura Session for this request
   */
  async deleteEvent(ks: string, id: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.event.delete}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'deleteEvent')
    }

    return await response.text()
  }

  /**
   * List sessions for a specific event
   * @param ks Kaltura Session for this request
   * @param eventId The ID of the event to list sessions for
   * @returns The list of sessions as a string
   */
  async listSessions(ks: string, eventId: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.session.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify({ eventId }),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'listSessions')
    }

    return await response.text()
  }

  /**
   * Create a new session for an event
   * @param ks Kaltura Session for this request
   * @param eventId The ID of the event to which the session belongs
   * @param session The session details to create
   * @returns The ID of the created session as a string
   */
  async createSession(
    ks: string,
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
      headers: this.getHeaders(ks),
      body: JSON.stringify({ eventId, session }),
    })

    if (!response.ok) {
      await this.handleResponseError(response, 'createSession')
    }

    return await response.text()
  }

  // ─── Team Members ────────────────────────────────────────────────────────────

  async createTeamMember(
    ks: string,
    params: {
      email: string
      role: 'Admin' | 'Organizer' | 'ContentManager'
      firstName: string
      lastName: string
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.teamMember.create}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'createTeamMember')
    }
    return await response.text()
  }

  async updateTeamMember(
    ks: string,
    params: {
      id: string
      firstName?: string
      lastName?: string
      role?: 'Admin' | 'Organizer' | 'ContentManager'
      disabled?: boolean
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.teamMember.update}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'updateTeamMember')
    }
    return await response.text()
  }

  async deleteTeamMember(ks: string, params: { id: string }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.teamMember.delete}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'deleteTeamMember')
    }
    return await response.text()
  }

  async listTeamMembers(
    ks: string,
    params: { pager?: { offset?: number; limit?: number } },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.teamMember.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'listTeamMembers')
    }
    return await response.text()
  }

  // ─── Event Users ─────────────────────────────────────────────────────────────

  async inviteEventUser(
    ks: string,
    params: {
      eventId: number
      firstName: string
      lastName: string
      email: string
      title?: string
      company?: string
      bio?: string
      roles?: string[]
      imageUrlEntryId?: string
      skipEmail?: boolean
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.eventUser.invite}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'inviteEventUser')
    }
    return await response.text()
  }

  async listEventUsers(
    ks: string,
    params: {
      eventId: number
      filter?: { searchTerm?: string; roles?: string[]; idIn?: string[] }
      pager?: { offset?: number; limit?: number }
      orderBy?: string
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.eventUser.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'listEventUsers')
    }
    return await response.text()
  }

  async updateEventUser(
    ks: string,
    params: {
      eventId: number
      userId: string
      firstName?: string
      lastName?: string
      title?: string
      company?: string
      bio?: string
      roles?: string[]
      imageUrlEntryId?: string
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.eventUser.update}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'updateEventUser')
    }
    return await response.text()
  }

  async deleteEventUser(ks: string, params: { eventId: number; userId: string }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.eventUser.delete}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'deleteEventUser')
    }
    return await response.text()
  }

  // ─── Session Participants ─────────────────────────────────────────────────────

  async addSessionParticipants(
    ks: string,
    params: {
      eventId: number
      sessionId: string
      speakers?: { userId: string; order?: number; isHidden?: boolean; role?: string }[]
      moderatorIds?: string[]
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionParticipant.add}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'addSessionParticipants')
    }
    return await response.text()
  }

  async removeSessionParticipants(
    ks: string,
    params: {
      eventId: number
      sessionId: string
      speakerIds?: string[]
      moderatorIds?: string[]
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionParticipant.remove}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'removeSessionParticipants')
    }
    return await response.text()
  }

  async updateSessionParticipants(
    ks: string,
    params: {
      eventId: number
      sessionId: string
      speakers: { userId: string; order?: number; isHidden?: boolean; role?: string }[]
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionParticipant.update}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'updateSessionParticipants')
    }
    return await response.text()
  }

  async listSessionParticipants(ks: string, params: { eventId: number; sessionId: string }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionParticipant.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await this.handleResponseError(response, 'listSessionParticipants')
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
   * @param ks Kaltura Session for this request
   */
  private getHeaders(ks: string): Record<string, string> {
    return {
      Authorization: `Bearer ${ks}`,
      'Content-Type': 'application/json',
      'X-Kaltura-Client-Tag': 'mcp-events-pa-client',
    }
  }
}
