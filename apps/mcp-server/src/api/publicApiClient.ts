import { Injectable } from '@nestjs/common';
import { config } from '../config/config';
import { TListEventFilterDto } from '../schemas/eventSchemas';

/**
 * API client for Public API
 * Injectable service that accepts KS per request
 */
@Injectable()
export class PublicAPIClient {
  private baseUrl: string;
  private readonly paths = Object.freeze({
    create: 'event/create',
    list: 'event/list',
    update: 'event/update',
    delete: 'event/delete',
  });

  constructor() {
    this.baseUrl = config.urls.publicApi as string;
  }

  /**
   * Create a new event
   * @param ks Kaltura Session for this request
   */
  async createEvent(
    ks: string,
    params: {
      name: string;
      templateId: string;
      startDate: string;
      endDate: string;
      timezone: string;
      description?: string;
    }
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.create}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      await this.handleResponseError(response, 'createEvent');
    }

    return await response.text();
  }

  /**
   * List events with filtering and pagination
   * @param ks Kaltura Session for this request
   */
  async listEvents(
    ks: string,
    params: {
      filter?: TListEventFilterDto;
      pager?: { offset?: number; limit?: number };
    }
  ): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${this.paths.list}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      await this.handleResponseError(response, 'listEvents');
    }

    return await response.json();
  }

  /**
   * Update an existing event
   * @param ks Kaltura Session for this request
   */
  async updateEvent(
    ks: string,
    params: {
      id: number;
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      doorsOpenDate?: string;
      timezone?: string;
      labels?: string[];
      logoEntryId?: string;
      bannerEntryId?: string;
    }
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.update}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      await this.handleResponseError(response, 'updateEvent');
    }

    return await response.text();
  }

  /**
   * Delete an event
   * @param ks Kaltura Session for this request
   */
  async deleteEvent(ks: string, id: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${this.paths.delete}`, {
      method: 'POST',
      headers: this.getHeaders(ks),
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      await this.handleResponseError(response, 'deleteEvent');
    }

    return await response.text();
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
    };
  }
}
