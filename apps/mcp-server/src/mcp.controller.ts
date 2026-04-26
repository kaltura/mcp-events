import { Controller, Get, Post, All, Res, Req, UnauthorizedException, ConsoleLogger } from '@nestjs/common'
import { Request, Response } from 'express'
import { McpService } from './mcp.service'
import { getKsFromRequest } from './utils/ks-helper'

@Controller('mcp')
export class McpController {
  private readonly logger = new ConsoleLogger(McpController.name, { timestamp: true })

  constructor(private readonly mcpService: McpService) {}

  /**
   * SSE endpoint for MCP connections
   * Clients connect to this endpoint to communicate with the MCP server
   *
   * Authentication:
   * KS must be provided via Authorization header following company standard:
   * - "Authorization: ks <KS_VALUE>" (recommended)
   * - "Authorization: bearer <KS_VALUE>" (for Swagger UI compatibility)
   *
   * Note: Environment variable is NOT used in remote mode for security
   */
  @Get('events')
  async handleSseConnection(@Req() request: Request, @Res() response: Response): Promise<void> {
    // Extract KS from Authorization header (company standard format)
    const ks = getKsFromRequest(request)

    if (!ks) {
      this.logger.error('SSE connection rejected: No KS in Authorization header')
      throw new UnauthorizedException(
        'Kaltura Session (KS) required. Provide via Authorization header: "Authorization: ks <KS>" or "Authorization: bearer <KS>"',
      )
    }

    this.logger.log('New SSE connection established (KS provided)')

    try {
      // Connect MCP server with SSE transport
      // SSEServerTransport will handle all SSE headers and streaming
      await this.mcpService.connectWithSSE(ks, '/mcp/events', response)
    } catch (error) {
      this.logger.error('Failed to establish SSE connection:', error)
      throw error
    }
  }

  /**
   * POST endpoint for SSE client messages
   * SSE clients send messages via POST to communicate with the server
   */
  @Post('events')
  async handlePostMessage(@Req() request: Request, @Res() response: Response): Promise<void> {
    try {
      await this.mcpService.handlePostMessage(request, response)
    } catch (error) {
      this.logger.error('Failed to handle POST message:', error)
      throw error
    }
  }

  /**
   * Streamable HTTP endpoint for MCP connections
   * This is the modern MCP transport that handles both GET and POST in a single endpoint
   *
   * Authentication:
   * KS must be provided via Authorization header following company standard:
   * - "Authorization: ks <KS_VALUE>" (recommended)
   * - "Authorization: bearer <KS_VALUE>" (for Swagger UI compatibility)
   */
  @All('streamable')
  async handleStreamableHttp(@Req() request: Request, @Res() response: Response): Promise<void> {
    // Extract KS from Authorization header (company standard format)
    const ks = getKsFromRequest(request)

    if (!ks) {
      this.logger.error('Streamable HTTP connection rejected: No KS in Authorization header')
      throw new UnauthorizedException(
        'Kaltura Session (KS) required. Provide via Authorization header: "Authorization: ks <KS>" or "Authorization: bearer <KS>"',
      )
    }

    this.logger.log('New Streamable HTTP connection (KS provided)')

    try {
      // Connect MCP server with Streamable HTTP transport
      await this.mcpService.connectWithStreamableHttp(ks, request, response)
    } catch (error) {
      this.logger.error('Failed to establish Streamable HTTP connection:', error)
      throw error
    }
  }
}
