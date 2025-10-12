import assert from 'node:assert'
import { config } from '../config/config'
import { TCreatePollDto, TDeletePollDto, TListPollsDto, TUpdatePollDto } from '../schemas/pollSchemas'

/**
 * API client for Cnc API
 */
export class CncAPIClient {
  private baseUrl: string
  private ks: string | undefined
  private readonly paths = Object.freeze({
    create: 'polls/create',
    update: 'polls/update',
    delete: 'polls/remove',
    list: 'polls/moderatorList',
  })

  constructor() {
    this.baseUrl = config.urls.cncApi as string
    this.ks = config.ks
    assert(this.ks, 'Error: KS (Kaltura Session) is not set. API calls may fail.')
  }

  /**
   * Create a new poll
   */
  async createPoll(poll: TCreatePollDto): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.create}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify({ poll }),
    })

    if (!response.ok) {
      this.handleResponseError(response, 'createPoll')
    }
    const text = await response.text()
    if (text.includes('KalturaAPIException')) {
      this.handleResponseError(response, 'createPoll', text)
    }
    return text
  }

  async updatePoll(poll: TUpdatePollDto): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.update}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify({ poll }),
    })

    if (!response.ok) {
      this.handleResponseError(response, 'updatePoll')
    }
    const text = await response.text()
    if (text.includes('KalturaAPIException')) {
      this.handleResponseError(response, 'updatePoll', text)
    }
    return text
  }

  async deletePoll({ pollId }: TDeletePollDto): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.delete}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify({ pollId }),
    })

    if (!response.ok) {
      this.handleResponseError(response, 'deletePoll')
    }
    const text = await response.text()
    if (text.includes('KalturaAPIException')) {
      this.handleResponseError(response, 'deletePoll', text)
    }
    return text
  }

  async listPolls({ contextId }: TListPollsDto): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.list}`, {
      method: 'POST',
      headers: this.getHeaders,
      body: JSON.stringify({ contextId }),
    })

    if (!response.ok) {
      this.handleResponseError(response, 'listPolls')
    }
    const text = await response.text()
    if (text.includes('KalturaAPIException')) {
      this.handleResponseError(response, 'listPolls', text)
    }
    return text
  }

  /**
   * Handle API response errors consistently
   * @param response The fetch response object
   * @param callerName Name of the calling function for better error context
   * @throws Error with detailed information about the failure
   */
  private handleResponseError(response: Response, callerName: string, error: string = ''): Promise<never> {
    const kalturaSession = response.headers.get('x-kaltura-session')
    const traceId = response.headers.get('x-traceid')
    throw new Error(
      `Failed to ${callerName}: ${error} ${response.status} ${response.statusText}\nx-traceId: ${traceId}\nx-kaltura-session: ${kalturaSession}`,
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
export const cncApiClient = new CncAPIClient()
