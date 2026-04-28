import { Controller, All, Res, Req, UnauthorizedException, ConsoleLogger } from '@nestjs/common'
import { Request, Response } from 'express'
import { McpService } from './mcp.service'
import { getKsFromRequest } from './utils/ks-helper'

@Controller('mcp')
export class McpController {
  private readonly logger = new ConsoleLogger(McpController.name, { timestamp: true })

  constructor(private readonly mcpService: McpService) {}

  /**
   * Stateless MCP endpoint — every request is independent.
   * KS must be provided via Authorization header on each request:
   * - "Authorization: ks <KS_VALUE>" (recommended)
   * - "Authorization: bearer <KS_VALUE>" (for Swagger UI compatibility)
   */
  @All()
  async handleRequest(@Req() request: Request, @Res() response: Response): Promise<void> {
    const ks = getKsFromRequest(request)

    if (!ks) {
      this.logger.error('MCP request rejected: No KS in Authorization header')
      throw new UnauthorizedException(
        'Kaltura Session (KS) required. Provide via Authorization header: "Authorization: ks <KS>" or "Authorization: bearer <KS>"',
      )
    }

    try {
      await this.mcpService.handleRequest(ks, request, response)
    } catch (error) {
      this.logger.error('Failed to handle MCP request:', error)
      throw error
    }
  }
}
