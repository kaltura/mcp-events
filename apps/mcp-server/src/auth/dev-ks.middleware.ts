import { Injectable, NestMiddleware } from '@nestjs/common'
import { type NextFunction, type Request, type Response } from 'express'
import { config } from '../config/config'
import { SCOPES } from './scopes'

/**
 * Local development bypass: if KALTURA_KS is set in the environment, injects a
 * synthetic req.auth so JWT verification is skipped entirely.
 *
 * Never active in production — only applied when KALTURA_KS is present (see app.module.ts).
 */
@Injectable()
export class DevKsMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    req.auth = {
      token: 'dev',
      issuer: 'dev',
      clientId: 'dev',
      scopes: [...SCOPES],
      claims: { ks: config.kaltura.ks },
    }
    next()
  }
}
