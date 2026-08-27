import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { config } from './config/config'
import { authLogger, mcpAuth } from './auth/mcp-auth-setup'
import { ConsoleLogger } from '@nestjs/common'
import { type NextFunction, type Request, type Response } from 'express'

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
${c.magenta}${c.bold}             MCP  EVENTS  SERVER (http)${c.reset}
${c.dim}  ────────────────────────────────────────────────────────${c.reset}
`

const resourceIdentifier = config.auth.serverUrl
if (!resourceIdentifier) {
  throw new Error(
    'MCP_SERVER_URL environment variable is required to configure OAuth protected resource metadata',
  )
}

const gatewayUrl = config.auth.gatewayUrl
if (!gatewayUrl) {
  throw new Error(
    'KALTURA_AUTH_GATEWAY_URL environment variable is required to configure OAuth protected resource metadata',
  )
}

/**
 * Bootstrap MCP Server with plain NestJS
 *
 * Note: We don't use createWebApp() from @kaltura/services-common because:
 * - It adds KsReaderMiddleware globally which conflicts with MCP authentication
 * - MCP handles KS extraction manually per connection
 */
async function bootstrap(): Promise<import('@nestjs/common').INestApplication<unknown>> {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger('MCP Server', { timestamp: true, json: true }),
  })

  // Enable CORS for remote SSE connections
  app.enableCors({
    origin: '*',
    credentials: true,
  })

  // Mount RFC 9728 Protected Resource Metadata endpoint as a global middleware
  // so it runs before NestJS controller routing (which would 404 on .well-known paths).
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/.well-known/oauth-protected-resource')) {
      authLogger.log(`Resource metadata: ${req.method} ${req.path} from ${req.ip ?? 'unknown'}`)
      res.on('finish', () => authLogger.log(`Resource metadata: ${res.statusCode}`))
    }
    next()
  })
  app.use(mcpAuth.protectedResourceMetadataRouter())

  const serverPort = config.server.port
  await app.listen(serverPort)
  return app
}

bootstrap()
  .then((app) => {
    console.log(BANNER)
    console.log(
      `${c.green}${c.bold}  ✔ Listening${c.reset}  port ${c.yellow}${c.bold}${config.server.port}${c.reset}`,
    )
    console.log(`${c.green}${c.bold}  ✔ Status   ${c.reset}  Ready`)
    console.log(`${c.cyan}  ✔ API URL  ${c.reset}  ${config.kaltura.urls.publicApi}`)
    if (config.kaltura.ks) {
      console.log(`${c.yellow}  ✔ Auth     ${c.reset}  Dev mode (KALTURA_KS)`)
    } else {
      console.log(`${c.cyan}  ✔ Resource ${c.reset}  ${config.auth.serverUrl}`)
      console.log(`${c.cyan}  ✔ Auth     ${c.reset}  JWT bearer (${config.auth.gatewayUrl})`)
    }
    console.log(`\n${c.dim}  ────────────────────────────────────────────────────────${c.reset}\n`)

    const shutdown = () => {
      // Give in-flight requests 5 s to finish, then force-exit.
      // Without the timeout, keep-alive connections or stalled MCP streams
      // can prevent app.close() from resolving and Ctrl-C appears to hang.
      setTimeout(() => process.exit(0), 5000).unref()
      app.close().then(() => process.exit(0))
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  })
  .catch((r) => console.log(`${c.yellow}  ✖ Failed to start:${c.reset}`, r))
