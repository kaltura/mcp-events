import { type RequestHandler } from 'express'
// @ts-expect-error TS1479 — mcp-auth is ESM-only; Node 22 require(esm) handles it at runtime
import { MCPAuth } from 'mcp-auth'
import { ConsoleLogger } from '@nestjs/common'
import { config } from '../config/config'
import { SCOPES } from './scopes'

// The MCP server itself is the protected resource — it owns the .well-known endpoint
// and is what clients authenticate against.
const resourceIdentifier = config.auth.serverUrl!

/** Shared logger for the auth subsystem. */
export const authLogger = new ConsoleLogger('Auth', { timestamp: true, json: true })

/**
 * MCPAuth instance configured for Kaltura Events MCP server.
 *
 * Authorization server metadata is provided manually because the Kaltura Auth Gateway
 * does not yet expose a standard OIDC / OAuth discovery endpoint.
 *
 * Protected resource: this MCP server (identified by _MCP_SERVER_URL).
 */
export const mcpAuth = new MCPAuth({
  protectedResources: [
    {
      metadata: {
        resource: resourceIdentifier,
        authorizationServers: [
          {
            metadata: {
              issuer: config.auth.gatewayUrl!,
              authorizationEndpoint: `${config.auth.gatewayUrl}/authorize`,
              tokenEndpoint: `${config.auth.gatewayUrl}/token`,
              jwksUri: `${config.auth.gatewayUrl}/.well-known/jwks.json`,
              registrationEndpoint: `${config.auth.gatewayUrl}/register`,
              responseTypesSupported: ['code'],
              codeChallengeMethodsSupported: ['S256'],
            },
            type: 'oauth',
          },
        ],
        scopesSupported: [...SCOPES],
      },
    },
  ],
})

/**
 * Returns an Express middleware that verifies JWT bearer tokens using asymmetric
 * keys fetched from the auth gateway's JWKS endpoint. Audience is validated against
 * the resource identifier.
 *
 * Scope enforcement is intentionally left to individual tool registrations — the
 * middleware only checks that the token is structurally valid and correctly signed.
 *
 * After successful verification, req.auth is populated with the token claims.
 * The Kaltura Session is available at req.auth.claims.ks.
 */
export function createBearerAuthMiddleware(): RequestHandler {
  // mcp-auth's built-in 'jwt' mode fetches and caches keys from jwksUri automatically.
  return mcpAuth.bearerAuth('jwt', {
    resource: resourceIdentifier,
    audience: resourceIdentifier,
    requiredScopes: [], // per-tool scope enforcement; middleware only validates JWT structure
    // Surfaces `cause` (expected-vs-actual issuer/audience, underlying jose error code) in the
    // rejection response body, which BearerAuthMiddleware logs. See config.auth.debug.
    showErrorDetails: config.auth.debug,
  })
}

authLogger.log(
  `Auth config: resource=${resourceIdentifier} issuer=${config.auth.gatewayUrl} scopes=[${SCOPES.join(', ')}]`,
)
