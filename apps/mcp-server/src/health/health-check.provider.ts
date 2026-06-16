import { Injectable } from '@nestjs/common'
import { McpService } from '../mcp.service'

@Injectable()
export class HealthChecker {
  constructor(private readonly mcpService: McpService) {}

  checks(): Record<string, Promise<unknown>> {
    return {
      mcpServer: this.mcpService.healthCheck(),
    }
  }
}
