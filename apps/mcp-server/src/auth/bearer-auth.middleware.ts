import { Injectable, NestMiddleware } from '@nestjs/common'
import { type NextFunction, type Request, type Response } from 'express'
// @ts-expect-error TS1479 — jose is ESM-only; Node 22 require(esm) handles it at runtime
import { decodeJwt, decodeProtectedHeader } from 'jose'
import { config } from '../config/config'
import { authLogger, createBearerAuthMiddleware } from './mcp-auth-setup'

/**
 * JSON.stringify drops Error objects to `{}` because `message`/`stack`/`cause` are all
 * non-enumerable own properties (even `cause` set via `new Error(msg, { cause })`), so a
 * spread or plain stringify silently loses them. mcp-auth nests the underlying jose/fetch
 * error under `cause.cause` (e.g. a JWKS network failure) — read the fields explicitly.
 */
function stringifyWithErrors(value: unknown): string {
  return JSON.stringify(value, (_key, val) =>
    val instanceof Error
      ? {
          name: val.name,
          message: val.message,
          code: (val as { code?: unknown }).code,
          cause: (val as { cause?: unknown }).cause,
        }
      : val,
  )
}

/**
 * Decodes the bearer token presented on the request WITHOUT verifying its signature,
 * purely for diagnostic logging. Never used for auth decisions — mcp-auth's own
 * verification (in the wrapped handler) is the source of truth for that.
 */
function describePresentedToken(req: Request): string {
  const authHeader = req.headers.authorization
  if (!authHeader) return 'no Authorization header'

  const [scheme, token] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return `malformed Authorization header (scheme=${scheme ?? 'none'})`
  }

  try {
    const claims = decodeJwt(token)
    const header = decodeProtectedHeader(token)
    const exp = claims.exp
    const expired = typeof exp === 'number' ? exp * 1000 < Date.now() : 'n/a'
    const scopes = claims['scope'] ?? claims['scopes'] ?? 'n/a'
    return (
      `presented: iss=${claims.iss ?? 'n/a'} aud=${JSON.stringify(claims.aud) ?? 'n/a'} ` +
      `sub=${claims.sub ?? 'n/a'} scope=${JSON.stringify(scopes)} alg=${header.alg} kid=${header.kid ?? 'n/a'} ` +
      `exp=${exp ? new Date(exp * 1000).toISOString() : 'n/a'} expired=${expired} ` +
      `| expected: iss=${config.auth.gatewayUrl} aud=${config.auth.serverUrl}`
    )
  } catch (err) {
    return `presented token is not a decodable JWT (opaque token?) — ${(err as Error).message}`
  }
}

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
        const b = (body as Record<string, unknown>) ?? {}
        const wwwAuth = res.getHeader('WWW-Authenticate') ?? 'n/a'

        // Log a warning for JWT rejections when _AUTH_DEBUG is not enabled
        if (!config.auth.debug) {
          authLogger.warn(
            `JWT rejected (${ms}ms) status=${status} error=${b.error ?? 'unknown'} ` +
              `error_description=${b.error_description ?? 'n/a'} missing_scopes=${JSON.stringify(b.missing_scopes) ?? 'n/a'} ` +
              'For more details set _AUTH_DEBUG=1',
          )
        }
        // Full debug logging when _AUTH_DEBUG is enabled
        if (config.auth.debug) {
          authLogger.warn(
            `JWT rejected (${ms}ms) status=${status} error=${b.error ?? 'unknown'} ` +
              `error_description=${b.error_description ?? 'n/a'} missing_scopes=${JSON.stringify(b.missing_scopes) ?? 'n/a'} ` +
              `cause=${stringifyWithErrors(b.cause)} www-authenticate=${wwwAuth} | ${describePresentedToken(req)}`,
          )
        }
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
