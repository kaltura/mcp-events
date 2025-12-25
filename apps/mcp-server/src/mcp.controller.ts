import { Controller, Sse, Res, Req, MessageEvent, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { AppLogger } from '@kaltura/services-common';
import { McpService } from './mcp.service';
import { getKsFromRequest } from './utils/ks-helper';

@Controller('mcp')
export class McpController {
  private readonly logger = new AppLogger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  /**
   * SSE endpoint for MCP connections
   * Clients connect to this endpoint to communicate with the MCP server
   * KS can be provided via:
   * 1. Authorization header (Bearer token) - production
   * 2. x-kaltura-session header - alternative
   * 3. ks query parameter - alternative
   * 4. KALTURA_KS environment variable - local development fallback
   */
  @Sse('events')
  async handleSseConnection(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Observable<MessageEvent>> {
    // Extract KS from request (with fallback to environment)
    const ks = getKsFromRequest(request);

    if (!ks) {
      this.logger.error('SSE connection rejected: No KS provided');
      throw new UnauthorizedException(
        'Kaltura Session (KS) required. Provide via Authorization header, x-kaltura-session header, ks query param, or KALTURA_KS env var'
      );
    }

    const ksPreview = ks.substring(0, 10);
    this.logger.log(`New SSE connection established (KS: ${ksPreview}...)`);

    try {
      // Connect MCP server with SSE transport, passing the KS
      await this.mcpService.connectWithSSE(ks, '/mcp/events', response);

      // Return an observable that keeps the connection alive
      return new Observable<MessageEvent>((subscriber) => {
        // Set up SSE headers
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.setHeader('Access-Control-Allow-Origin', '*');

        // Handle connection close
        response.on('close', () => {
          this.logger.log('SSE connection closed');
          subscriber.complete();
        });

        // Keep connection alive with periodic heartbeat
        const heartbeat = setInterval(() => {
          subscriber.next({ data: { type: 'heartbeat' } });
        }, 30000);

        // Clean up on unsubscribe
        return () => {
          clearInterval(heartbeat);
          this.logger.log('SSE connection cleaned up');
        };
      });
    } catch (error) {
      this.logger.error('Failed to establish SSE connection:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string }> {
    const isHealthy = await this.mcpService.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
    };
  }
}
