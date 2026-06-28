import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { PublicApiClient } from '../api/publicApiClient'
import { registerEventTools } from './events/tools'
import { registerEventResources } from './events/resources'
import { registerSessionTools } from './sessions/tools'
import { registerTeamMemberTools } from './team-members/tools'
import { registerEventUserTools } from './event-users/tools'
import { registerSessionParticipantTools } from './session-participants/tools'

export function registerAllDomainTools(
  server: McpServer,
  ks: string,
  publicApiClient: PublicApiClient,
  scopes: string[],
): void {
  registerEventTools(server, ks, publicApiClient, scopes)
  registerSessionTools(server, ks, publicApiClient, scopes)
  registerTeamMemberTools(server, ks, publicApiClient, scopes)
  registerEventUserTools(server, ks, publicApiClient, scopes)
  registerSessionParticipantTools(server, ks, publicApiClient, scopes)
}

export function registerAllDomainResources(
  server: McpServer,
  ks: string,
  publicApiClient: PublicApiClient,
  scopes: string[],
): void {
  registerEventResources(server, ks, publicApiClient, scopes)
}
