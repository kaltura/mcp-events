import assert from 'assert'
import { config } from '../config/config'
import { TListEventFilterDto } from '../schemas/eventSchemas'

/**
 * API client for Public API
 */
export class PublicAPIClient {
  private baseUrl: string
  private ks: string | undefined
  private readonly paths = Object.freeze({
    create: 'event/create',
    list: 'event/list',
    update: 'event/update',
    delete: 'event/delete',
  })

  constructor() {
    this.baseUrl = config.urls.publicApi
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
    const response = await fetch(`${this.baseUrl}/${this.paths.create}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      this.handleResponseError(response, 'createEvent')
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
    const response = await fetch(`${this.baseUrl}/${this.paths.list}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ params }),
    })

    if (!response.ok) {
      this.handleResponseError(response, 'listEvents')
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
    const response = await fetch(`${this.baseUrl}/${this.paths.update}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      this.handleResponseError(response, 'updateEvent')
    }

    return await response.text()
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.delete}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      this.handleResponseError(response, 'deleteEvent')
    }

    return await response.text()
  }

  /**
   * Handle API response errors consistently
   * @param response The fetch response object
   * @param callerName Name of the calling function for better error context
   * @throws Error with detailed information about the failure
   */
  private handleResponseError(response: Response, callerName: string): never {
    console.log(response.headers)
    throw new Error(
      `Failed to ${callerName}: ${response.status} ${response.statusText}\nx-kaltura-session: ${response.headers.get('x-kaltura-session')}`,
    )
  }

  /**
   * Get common headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.ks}`,
      'Content-Type': 'application/json',
    }
  }
}

// Export a singleton instance
export const publicApiClient = new PublicAPIClient()
