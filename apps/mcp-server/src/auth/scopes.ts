export const SCOPES = ['mcp:events:read', 'mcp:events:write'] as const

export type Scope = (typeof SCOPES)[number]
