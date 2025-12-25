import { HealthChecker } from './health/health-check.provider';
import { DefaultAppModule, DefaultModule } from '@kaltura/services-common';
import { McpService } from './mcp.service';
import { McpController } from './mcp.controller';
import { PublicAPIClient } from './api/publicApiClient';
import { EpClient } from './api/epClient';

@DefaultModule(HealthChecker, {
  imports: [],
  providers: [McpService, PublicAPIClient, EpClient],
  controllers: [McpController],
})
export class AppModule extends DefaultAppModule {}
