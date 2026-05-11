import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { config } from './config/config'
import { ConsoleLogger } from '@nestjs/common'

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
}

const BANNER = `
${c.cyan}${c.bold}  ██╗  ██╗ █████╗ ██╗  ████████╗██╗   ██╗██████╗  █████╗
  ██║ ██╔╝██╔══██╗██║  ╚══██╔══╝██║   ██║██╔══██╗██╔══██╗
  █████╔╝ ███████║██║     ██║   ██║   ██║██████╔╝███████║
  ██╔═██╗ ██╔══██║██║     ██║   ██║   ██║██╔══██╗██╔══██║
  ██║  ██╗██║  ██║███████╗██║   ╚██████╔╝██║  ██║██║  ██║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝${c.reset}
${c.magenta}${c.bold}             MCP  EVENTS  SERVER${c.reset}
${c.dim}  ────────────────────────────────────────────────────────${c.reset}
`

/**
 * Bootstrap MCP Server with plain NestJS
 *
 * Note: We don't use createWebApp() from @kaltura/services-common because:
 * - It adds KsReaderMiddleware globally which conflicts with MCP authentication
 * - MCP handles KS extraction manually per connection
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger('MCP Server', { timestamp: true }),
  })

  // Enable CORS for remote SSE connections
  app.enableCors({
    origin: '*',
    credentials: true,
  })

  const serverPort = config.server.port
  await app.listen(serverPort)
}

bootstrap()
  .then(() => {
    console.log(BANNER)
    console.log(
      `${c.green}${c.bold}  ✔ Listening${c.reset}  port ${c.yellow}${c.bold}${config.server.port}${c.reset}`,
    )
    console.log(`${c.green}${c.bold}  ✔ Status   ${c.reset}  Ready`)
    console.log(`${c.cyan}  ✔ API URL  ${c.reset}  ${config.kaltura.urls.publicApi}`)
    console.log(`\n${c.dim}  ────────────────────────────────────────────────────────${c.reset}\n`)
  })
  .catch((r) => console.log(`${c.yellow}  ✖ Failed to start:${c.reset}`, r))
