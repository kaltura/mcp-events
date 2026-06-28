export const SCOPES = [
  'events:read',
  'events:write',
  'sessions:read',
  'sessions:write',
  'team-members:read',
  'team-members:write',
  'event-users:read',
  'event-users:write',
  'session-participants:read',
  'session-participants:write',
] as const

export type Scope = (typeof SCOPES)[number]
