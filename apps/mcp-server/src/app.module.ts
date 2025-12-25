import { HealthChecker } from './health/health-check.provider';
import { DefaultAppModule, DefaultModule } from '@kaltura/services-common';
import { McpService } from './mcp.service';
import { McpController } from './mcp.controller';

@DefaultModule(HealthChecker, {
  imports: [],
  providers: [McpService],
  controllers: [McpController],
})
export class AppModule extends DefaultAppModule {}
