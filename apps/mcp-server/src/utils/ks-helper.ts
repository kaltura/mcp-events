import { Request } from 'express'

/**
 * Extract Kaltura Session (KS) from request Authorization header
 * Follows company standard from @kaltura/services-common/middleware/ks-reader.middleware
 *
 * Supported formats:
 * - Authorization: ks <KS_VALUE>
 * - Authorization: bearer <KS_VALUE> (for Swagger UI compatibility)
 *
 * Returns undefined if KS is not found - will cause authentication failure
 */
export function getKsFromRequest(request: Request): string | undefined {
  const authorization = request.headers['authorization']

  if (!authorization) {
    return undefined
  }

  // Split header into prefix and KS value
  const [prefix, ks] = authorization.split(/\s+/, 2)

  // Accept 'ks' or 'bearer' prefix (case-insensitive, following company standard)
  if (prefix && ['ks', 'bearer'].includes(prefix.toLowerCase()) && ks) {
    return ks
  }

  return undefined
}

/**
 * Get required KS from request
 * Throws error if KS is not found
 */
export function getRequiredKs(request: Request): string {
  const ks = getKsFromRequest(request)

  if (!ks) {
    throw new Error(
      'Kaltura Session (KS) is required. Provide via Authorization header: "Authorization: bearer <KS>"',
    )
  }

  return ks
}
