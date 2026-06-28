import { Controller, All, Res, Req, UnauthorizedException, ConsoleLogger } from '@nestjs/common'
import { type Request, type Response } from 'express'
import { McpService } from './mcp.service'

@Controller('mcp')
export class McpController {
  private readonly logger = new ConsoleLogger(McpController.name, { timestamp: true })

  constructor(private readonly mcpService: McpService) {}

  /**
   * Stateless MCP endpoint — every request is independent.
   *
   * Authentication is handled by BearerAuthMiddleware (mcp-auth) which verifies
   * the JWT and populates req.auth before this handler runs.
   *
   * The JWT must contain:
   *   - ks:    Kaltura Session (custom claim)
   *   - aud:   audience matching the protected resource identifier
   *   - scope: space-separated list of granted scopes
   */
  @All()
  async handleRequest(@Req() request: Request, @Res() response: Response): Promise<void> {
    const ks = request.auth?.claims?.['ks']

    if (typeof ks !== 'string' || !ks) {
      this.logger.error('MCP request rejected: JWT is missing the "ks" claim')
      throw new UnauthorizedException('JWT must contain a "ks" claim with a valid Kaltura Session')
    }

    const scopes = request.auth?.scopes ?? []

    try {
      await this.mcpService.handleRequest(ks, request, response, scopes)
    } catch (error) {
      this.logger.error('Failed to handle MCP request:', error)
      throw error
    }
  }
}
