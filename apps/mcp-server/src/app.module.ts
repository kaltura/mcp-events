import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { HealthChecker } from './health/health-check.provider'
import { HealthController } from './health/health.controller'
import { McpService } from './mcp.service'
import { McpController } from './mcp.controller'
import { PublicApiClient } from './api/publicApiClient'
import { BearerAuthMiddleware } from './auth/bearer-auth.middleware'
import { DevKsMiddleware } from './auth/dev-ks.middleware'
import { config } from './config/config'

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
  providers: [McpService, PublicApiClient, HealthChecker],
  controllers: [McpController, HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Dev mode: KALTURA_KS in env bypasses JWT verification entirely
    const authMiddleware = config.kaltura.ks ? DevKsMiddleware : BearerAuthMiddleware
    consumer.apply(authMiddleware).forRoutes(McpController)
  }
}
