import { Request } from 'express';
import { McpConfig } from '../mcp-config';

/**
 * Extract Kaltura Session (KS) from request
 * Supports multiple sources in priority order:
 * 1. Authorization header (Bearer token)
 * 2. x-kaltura-session header
 * 3. ks query parameter
 * 4. Environment variable (fallback for local development)
 */
export function getKsFromRequest(request: Request): string | undefined {
  // Priority 1: Authorization header (Bearer token)
  const authHeader = request.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Priority 2: x-kaltura-session header
  const ksHeader = request.headers['x-kaltura-session'];
  if (ksHeader && typeof ksHeader === 'string') {
    return ksHeader;
  }

  // Priority 3: ks query parameter
  const ksQuery = request.query.ks;
  if (ksQuery && typeof ksQuery === 'string') {
    return ksQuery;
  }

  // Priority 4: Fallback to environment variable (local development only)
  return McpConfig.kaltura.defaultKs || undefined;
}

/**
 * Get required KS from request
 * Throws error if KS is not found
 */
export function getRequiredKs(request: Request): string {
  const ks = getKsFromRequest(request);

  if (!ks) {
    throw new Error(
      'Kaltura Session (KS) is required. Please provide KS via: ' +
      '1) Authorization header (Bearer token), ' +
      '2) x-kaltura-session header, ' +
      '3) ks query parameter, or ' +
      '4) KALTURA_KS environment variable (local development only)'
    );
  }

  return ks;
}

/**
 * Check if KS is from environment (local mode) or request (production mode)
 */
export function isLocalMode(request: Request): boolean {
  const authHeader = request.headers['authorization'];
  const ksHeader = request.headers['x-kaltura-session'];
  const ksQuery = request.query.ks;

  // If no KS in request, we're using local mode
  return !authHeader && !ksHeader && !ksQuery;
}
