import { startServer } from './server'
import { config } from './config/config'

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

async function main(): Promise<void> {
  try {
    const server = await startServer()
    console.error(BANNER)
    console.error(`${c.green}${c.bold}  ✔ Transport${c.reset}  ${c.yellow}${c.bold}stdio${c.reset}`)
    console.error(`${c.green}${c.bold}  ✔ Status   ${c.reset}  Ready`)
    console.error(`${c.cyan}  ✔ API URL  ${c.reset}  ${config.kaltura.urls.publicApi}`)
    console.error(`\n${c.dim}  ────────────────────────────────────────────────────────${c.reset}\n`)

    const shutdown = () => server.close().then(() => process.exit(0))
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    process.exit(1)
  }
}

main()
