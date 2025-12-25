require('@kaltura/services-common/otel-tracer');
import { createWebApp } from '@kaltura/services-common';
import { AppModule } from './app.module';
import { McpConfig } from './mcp-config';

async function bootstrap() {
  const app = await createWebApp(AppModule, {
    apiTitle: 'Kaltura Events MCP Server',
  });

  const serverPort = McpConfig.server.port;

  await app.listen(serverPort);
}

bootstrap()
  .then(() => console.log('MCP Server is ready'))
  .catch((r) => console.log('MCP Server failed to start:', r));
