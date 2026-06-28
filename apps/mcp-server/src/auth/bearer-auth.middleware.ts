import { Injectable, NestMiddleware } from '@nestjs/common'
import { type NextFunction, type Request, type Response } from 'express'
import { createBearerAuthMiddleware } from './mcp-auth-setup'

/**
 * NestJS middleware that delegates to the mcp-auth Express bearer-auth handler.
 * Applied only to McpController routes — /health remains unauthenticated.
 *
 * On success, populates req.auth with the verified token claims.
 * On failure, sends a 401 / 403 response directly (before the controller runs).
 */
@Injectable()
export class BearerAuthMiddleware implements NestMiddleware {
  private readonly handler = createBearerAuthMiddleware()

  use(req: Request, res: Response, next: NextFunction): void {
    this.handler(req, res, next)
  }
}
