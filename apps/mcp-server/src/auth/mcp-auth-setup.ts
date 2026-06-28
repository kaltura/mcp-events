import { type RequestHandler } from 'express'
// @ts-expect-error TS1479: mcp-auth ships as ESM but Node 22 supports require(esm).
// The package exports a `require` entry pointing to the same ESM file, which Node 22 loads fine.
import { MCPAuth, createVerifyJwt } from 'mcp-auth'
import { config } from '../config/config'
import { SCOPES } from './scopes'

// The MCP server itself is the protected resource — it owns the .well-known endpoint
// and is what clients authenticate against.
const resourceIdentifier = config.auth.serverUrl!

/**
 * MCPAuth instance configured for Kaltura Events MCP server.
 *
 * Authorization server metadata is provided manually because the Kaltura Auth Gateway
 * does not yet expose a standard OIDC / OAuth discovery endpoint.
 *
 * Protected resource: this MCP server (identified by MCP_SERVER_URL).
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
 * Returns an Express middleware that verifies JWT bearer tokens using a symmetric
 * secret (HMAC). Audience is validated against the resource identifier.
 *
 * Scope enforcement is intentionally left to individual tool registrations — the
 * middleware only checks that the token is structurally valid and correctly signed.
 *
 * After successful verification, req.auth is populated with the token claims.
 * The Kaltura Session is available at req.auth.claims.ks.
 */
export function createBearerAuthMiddleware(): RequestHandler {
  const secret = new TextEncoder().encode(config.auth.jwtSecret!)

  // createVerifyJwt handles JWT → AuthInfo mapping (iss, client_id, sub, scope → scopes[]).
  // The custom `ks` claim is surfaced in req.auth.claims.ks after verification.
  const verifyJwt = createVerifyJwt(() => Promise.resolve(secret))

  return mcpAuth.bearerAuth(verifyJwt, {
    resource: resourceIdentifier,
    audience: resourceIdentifier,
    requiredScopes: [], // per-tool scope enforcement; middleware only validates JWT structure
  })
}
