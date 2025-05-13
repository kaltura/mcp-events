import assert from 'node:assert'
import { config } from '../config/config'
import { LRUCache } from 'lru-cache'
import { removeEmptyProps } from '../utils'

const EpEventIdCache = new LRUCache<number, string>({
  max: 500,
  ttl: 60 * 60 * 24 * 1,
})

/**
 * API client for EP
 */
export class EpClient {
  private baseUrl: string
  private readonly paths = Object.freeze({
    authLoginKs: 'auth/loginKS',
    eventsList: 'events/list',
  })
  private ks: string
  private jwt = {
    token: '',
    /* epoch milliseconds */
    exp: 0,
  }

  constructor() {
    assert(config.ks, 'Error: KS (Kaltura Session) is not set. API calls may fail.')
    this.baseUrl = config.urls.epApi
    this.ks = config.ks
  }

  /**
   * Get EP event id from kaltura public id
   * Fetch from EP or get from cache.
   */
  private async getEpEventId(kalturaEventId: number): Promise<string> {
    let epEventId = await this.cacheGetEventId(kalturaEventId)
    if (epEventId) {
      console.debug(`Event id found in cache, kalturaEventId: ${kalturaEventId} epEventId: ${epEventId}`)
      return epEventId
    }
    epEventId = await this.fetchEpEventId(kalturaEventId)
    if (!epEventId) {
      throw new Error(`Event id not found in EP, kalturaEventId: ${kalturaEventId}`)
    }
    console.debug(`Event id found in EP kalturaEventId: ${kalturaEventId} epEventId: ${epEventId}`)
    await this.cacheSetEventId(kalturaEventId, epEventId)
    return epEventId
  }

  private async fetchEpEventId(kalturaEventId: number): Promise<string | undefined> {
    const filter = { kalturaEventIdIn: [kalturaEventId] }
    const response = await fetch(`${this.baseUrl}/${this.paths.eventsList}`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ filter }),
    })
    if (!response.ok) {
      throw new Error(`Failed to get JWT: ${response.status} ${response.statusText}`)
    }
    const { events } = await response.json()
    if (!events.length) return undefined
    if (events.length > 1) {
      throw new Error('More than one event found with the same kaltura event id')
    }
    return events[0]._id
  }

  private async getJwt(): Promise<string> {
    if (this.isValidJwt) {
      return this.jwt.token
    }
    const jwt = await this.fetchJwt(this.ks)
    this.jwt.token = jwt.token
    this.jwt.exp = jwt.exp * 1000
    return this.jwt.token
  }

  private async fetchJwt(ks: string): Promise<{ token: string; /* seconds */ exp: number }> {
    const response = await fetch(`${this.baseUrl}/${this.paths.authLoginKs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ks }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get JWT: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  }

  private get isValidJwt(): boolean {
    const bufferExpiration = 5 * 60 * 1000
    return !!this.jwt.token && this.jwt.exp > Date.now() + bufferExpiration
  }

  private cacheGetEventId(kalturaEventId: number): string | undefined {
    return EpEventIdCache.get(kalturaEventId)
  }

  private cacheSetEventId(kalturaEventId: number, epEventId: string): void {
    EpEventIdCache.set(kalturaEventId, epEventId)
  }

  /**
   * Get common headers for API requests
   */
  private async getHeaders(epEventId?: string): Promise<Record<string, string>> {
    const jwt = await this.getJwt()
    return removeEmptyProps({
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'x-eventId': epEventId,
    })
  }
}

// Export a singleton instance
export const epClient = new EpClient()
