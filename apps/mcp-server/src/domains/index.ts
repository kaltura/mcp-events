import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { PublicApiClient } from '../api/publicApiClient'
import { registerEventTools } from './events/tools'
import { registerEventResources } from './events/resources'
import { registerSessionTools } from './sessions/tools'
import { registerTeamMemberTools } from './team-members/tools'
import { registerEventUserTools } from './event-users/tools'
import { registerSessionParticipantTools } from './session-participants/tools'

export function registerAllDomainTools(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
  registerEventTools(server, ks, publicApiClient)
  registerSessionTools(server, ks, publicApiClient)
  registerTeamMemberTools(server, ks, publicApiClient)
  registerEventUserTools(server, ks, publicApiClient)
  registerSessionParticipantTools(server, ks, publicApiClient)
}

export function registerAllDomainResources(server: McpServer, ks: string, publicApiClient: PublicApiClient): void {
  registerEventResources(server, ks, publicApiClient)
}
