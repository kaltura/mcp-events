import { Injectable, NestMiddleware } from '@nestjs/common'
import { type NextFunction, type Request, type Response } from 'express'
import { authLogger, createBearerAuthMiddleware } from './mcp-auth-setup'

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
    const start = Date.now()
    const hasToken = Boolean(req.headers.authorization)
    authLogger.log(`${req.method} ${req.path} | Authorization: ${hasToken ? 'Bearer ***' : 'missing'}`)

    // Intercept the response before it is sent so we can log 401/403 rejections.
    // mcp-auth short-circuits by calling res.json() directly on auth failure,
    // bypassing next() entirely, so we can't rely solely on wrapping next.
    const origJson = res.json.bind(res)
    res.json = (body: unknown): Response => {
      const ms = Date.now() - start
      const status = res.statusCode
      if (status === 401 || status === 403) {
        const errCode = (body as Record<string, unknown>)?.error ?? 'unknown'
        authLogger.warn(`JWT rejected (${ms}ms) status=${status} error=${errCode}`)
      }
      return origJson(body)
    }

    // Wrap next to capture the success path: mcp-auth calls next() after populating req.auth.
    const wrappedNext: NextFunction = (err?: unknown) => {
      if (!err && req.auth) {
        const ms = Date.now() - start
        const { issuer, clientId, scopes, claims } = req.auth
        const sub = claims?.['sub'] as string | undefined
        const exp = claims?.['exp'] as number | undefined
        const expStr = exp ? new Date(exp * 1000).toISOString() : 'n/a'
        authLogger.log(
          `JWT verified (${ms}ms) sub=${sub} iss=${issuer} client=${clientId} scopes=[${scopes.join(', ')}] exp=${expStr}`,
        )
      }
      next(err)
    }

    this.handler(req, res, wrappedNext)
  }
}
