import { Injectable } from '@nestjs/common'
import { config } from '../config/config'
import { LRUCache } from 'lru-cache'
import { removeEmptyProps } from '../utils'
import { TCreateSessionDto } from '../schemas/eventSchemas'

const EpEventIdCache = new LRUCache<number, string>({
  max: 500,
  ttl: 60 * 60 * 24 * 1,
})

// JWT cache per KS - Maps KS to JWT token and expiration (bounded LRU cache)
const JwtCache = new LRUCache<string, { token: string; exp: number }>({
  max: 500,
})

/**
 * API client for EP
 * Injectable service that accepts KS per request
 */
@Injectable()
export class EpClient {
  private baseUrl: string
  private readonly paths = Object.freeze({
    authLoginKs: 'auth/loginKS',
    eventsList: 'events/list',
    sessionList: 'sessions/list',
    sessionCreate: 'sessions/create',
  })

  constructor() {
    this.baseUrl = config.urls.epApi as string
  }

  /**
   * List sessions for an event
   * @param ks Kaltura Session for this request
   */
  public async sessionList(ks: string, kalturaEventId: number, tagsFilter?: string[]): Promise<unknown> {
    const epEventId = await this.getEpEventId(ks, kalturaEventId)
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionList}`, {
      method: 'POST',
      headers: await this.getHeaders(ks, epEventId),
      body: JSON.stringify({ filter: { tagsFilter } }),
    })
    if (!response.ok) {
      return this.handleResponseError(response, 'sessionList')
    }
    return await response.json()
  }

  /**
   * Create a new session for an event
   * @param ks Kaltura Session for this request
   */
  public async sessionCreate(
    ks: string,
    kalturaEventId: number,
    session: TCreateSessionDto['session'],
    imageUrlEntryId?: string,
    sourceEntryId?: string,
  ): Promise<unknown> {
    const epEventId = await this.getEpEventId(ks, kalturaEventId)
    const body = removeEmptyProps(
      {
        session: {
          ...session,
          description: session.description || '',
        },
        imageUrlEntryId,
        sourceEntryId,
      },
      { removeEmptyString: false },
    )
    const response = await fetch(`${this.baseUrl}/${this.paths.sessionCreate}`, {
      method: 'POST',
      headers: await this.getHeaders(ks, epEventId),
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      return this.handleResponseError(response, 'sessionCreate')
    }
    return await response.json()
  }

  /**
   * Get EP event id from kaltura public id
   * Fetch from EP or get from cache.
   */
  private async getEpEventId(ks: string, kalturaEventId: number): Promise<string> {
    let epEventId = await this.cacheGetEventId(kalturaEventId)
    if (epEventId) {
      return epEventId
    }
    epEventId = await this.fetchEpEventId(ks, kalturaEventId)
    if (!epEventId) {
      throw new Error(`Event id not found in EP, kalturaEventId: ${kalturaEventId}`)
    }
    await this.cacheSetEventId(kalturaEventId, epEventId)
    return epEventId
  }

  private async fetchEpEventId(ks: string, kalturaEventId: number): Promise<string | undefined> {
    const filter = { kalturaEventIdIn: [kalturaEventId] }
    const response = await fetch(`${this.baseUrl}/${this.paths.eventsList}`, {
      method: 'POST',
      headers: await this.getHeaders(ks),
      body: JSON.stringify({ filter }),
    })
    if (!response.ok) {
      return this.handleResponseError(response, 'fetchEpEventId')
    }
    const { events } = await response.json()
    if (!events.length) return undefined
    if (events.length > 1) {
      throw new Error('More than one event found with the same kaltura event id')
    }
    return events[0]._id
  }

  /**
   * Get JWT for a specific KS
   * Uses cached JWT if valid, otherwise fetches new one
   */
  private async getJwt(ks: string): Promise<string> {
    const cachedJwt = JwtCache.get(ks)
    if (cachedJwt && this.isValidJwt(cachedJwt)) {
      return cachedJwt.token
    }
    const jwt = await this.fetchJwt(ks)
    const jwtData = { token: jwt.token, exp: jwt.exp * 1000 }
    JwtCache.set(ks, jwtData)
    return jwtData.token
  }

  private async fetchJwt(ks: string): Promise<{ token: string; /* seconds */ exp: number }> {
    const response = await fetch(`${this.baseUrl}/${this.paths.authLoginKs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ks }),
    })

    if (!response.ok) {
      return this.handleResponseError(response, 'fetchJwt')
    }
    return await response.json()
  }

  /**
   * Check if JWT is still valid (not expired)
   */
  private isValidJwt(jwt: { token: string; exp: number }): boolean {
    const bufferExpiration = 5 * 60 * 1000
    return !!jwt.token && jwt.exp > Date.now() + bufferExpiration
  }

  private cacheGetEventId(kalturaEventId: number): string | undefined {
    return EpEventIdCache.get(kalturaEventId)
  }

  private cacheSetEventId(kalturaEventId: number, epEventId: string): void {
    EpEventIdCache.set(kalturaEventId, epEventId)
  }

  /**
   * Handle API response errors consistently
   * @param response The fetch response object
   * @param callerName Name of the calling function for better error context
   * @throws Error with detailed information about the failure
   */
  private handleResponseError(response: Response, callerName: string): never {
    const traceid = response.headers.get('x-traceid')
    const epSession = response.headers.get('x-ep-session')
    throw new Error(
      `Failed to ${callerName}: ${response.status} ${response.statusText}\nx-traceid: ${traceid}\nx-ep-session: ${epSession}`,
    )
  }

  /**
   * Get common headers for API requests
   * @param ks Kaltura Session for this request
   */
  private async getHeaders(ks: string, epEventId?: string): Promise<Record<string, string>> {
    const jwt = await this.getJwt(ks)
    return removeEmptyProps({
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      'x-eventId': epEventId,
    })
  }
}
