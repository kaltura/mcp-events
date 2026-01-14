import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { config } from './config/config'
import { ConsoleLogger } from '@nestjs/common'

/**
 * Bootstrap MCP Server with plain NestJS
 *
 * Note: We don't use createWebApp() from @kaltura/services-common because:
 * - It adds KsReaderMiddleware globally which conflicts with MCP authentication
 * - MCP handles KS extraction manually per connection
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      timestamp: true,
    }),
  })

  // Enable CORS for remote SSE connections
  app.enableCors({
    origin: '*',
    credentials: true,
  })

  const serverPort = config.server.port

  await app.listen(serverPort)
  console.log(`MCP Server is listening on port ${serverPort}`)
}

bootstrap()
  .then(() => console.log('MCP Server is ready'))
  .catch((r) => console.log('MCP Server failed to start:', r))
