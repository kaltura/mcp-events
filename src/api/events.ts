import { config } from '../config/config';

/**
 * API client for Kaltura Events
 */
export class EventsApi {
  private baseUrl: string;
  private ks: string | undefined;

  constructor() {
    this.baseUrl = config.urls.eventsApi;
    this.ks = config.ks;
    
    if (!this.ks) {
      console.warn('Warning: KS (Kaltura Session) is not set. API calls may fail.');
    }
  }

  /**
   * Create a new event
   */
  async createEvent(params: {
    name: string;
    templateId: string;
    startDate: string;
    endDate: string;
    timezone: string;
    description?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * List events with filtering and pagination
   */
  async listEvents(params: {
    filter?: any;
    pager?: { offset?: number; limit?: number };
  }) {
    const response = await fetch(`${this.baseUrl}/list`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list events: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Update an existing event
   */
  async updateEvent(params: {
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
  }) {
    const response = await fetch(`${this.baseUrl}/update`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: number) {
    const response = await fetch(`${this.baseUrl}/delete`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete event: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * Get common headers for API requests
   */
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.ks}`,
      'Content-Type': 'application/json'
    };
  }
}

// Export a singleton instance
export const eventsApi = new EventsApi();