import assert from 'node:assert'
// Central configuration for the functional test suite.
//
// Env vars are injected by `node --env-file=tests/.env` (see the `test:functional`
// script), so this module only reads `process.env` and applies the same names and
// defaults as the Python `config.py`.

export const appConfig = {
  KALTURA_PUBLIC_API: process.env.KALTURA_PUBLIC_API,
} as const

assert(appConfig.KALTURA_PUBLIC_API, 'KALTURA_PUBLIC_API must be set in the environment')
