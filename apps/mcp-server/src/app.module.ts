import { Module } from '@nestjs/common'
import { HealthChecker } from './health/health-check.provider'
import { HealthController } from './health/health.controller'
import { McpService } from './mcp.service'
import { McpController } from './mcp.controller'
import { PublicAPIClient } from './api/publicApiClient'
import { EpClient } from './api/epClient'

/**
 * Main application module
 *
 * Note: We don't use @DefaultModule decorator here because:
 * 1. MCP endpoint doesn't need KsReaderMiddleware validation
 * 2. KS is extracted and used manually per connection
 * 3. Avoids conflicts with MCP protocol authentication flow
 */
@Module({
  imports: [],
  providers: [McpService, PublicAPIClient, EpClient, HealthChecker],
  controllers: [McpController, HealthController],
})
export class AppModule {}
