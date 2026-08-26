import { ConsoleLogger, Injectable, OnModuleDestroy } from '@nestjs/common'
import { toNodeHandler, type FetchLikeMcpHandler } from '@modelcontextprotocol/node'
import {
  createMcpHandler,
  McpServer,
  type AuthInfo,
  type McpRequestContext,
} from '@modelcontextprotocol/server'
import { config } from './config/config'
import { registerAllDomainTools, registerAllDomainResources } from './domains'
import { PublicApiClient } from './api/publicApiClient'
import { Request, Response } from 'express'

/**
 * MCP Service — stateless mode.
 * A fresh McpServer is built for every incoming request (via the handler's
 * per-request factory). The KS and scopes are extracted from the verified
 * bearer token by McpController and threaded into the factory through
 * `ctx.authInfo.extra.ks` / `ctx.authInfo.scopes`, so they're captured in the
 * tool/resource closures for that request's lifetime only.
 *
 * `createMcpHandler` serves both the 2026-07-28 (modern) era and, by
 * default, 2025-era traffic via its built-in stateless fallback — matching
 * this server's existing per-request statelessness.
 */
@Injectable()
export class McpService implements OnModuleDestroy {
  private readonly logger = new ConsoleLogger(McpService.name, { timestamp: true, json: true })

  private readonly handler = createMcpHandler((ctx) => this.buildServer(ctx), {
    onerror: (error) => this.logger.error(`MCP handler error: ${error.message}`, error.stack),
  })

  constructor(private readonly publicApiClient: PublicApiClient) {
    this.logger.log('MCP Service initialized (stateless mode)')
  }

  async handleRequest(ks: string, request: Request, response: Response, scopes: string[]): Promise<void> {
    const body: unknown = typeof request.body === 'string' ? JSON.parse(request.body) : request.body

    const method = (body as { method?: string })?.method
    const toolName = (body as { params?: { name?: string } })?.params?.name
    if (method === 'tools/call') {
      this.logger.log(`Tool call: ${toolName ?? 'unknown'}`)
    } else if (method) {
      this.logger.log(`MCP method: ${method}`)
    }

    // Bridge mcp-auth's already-verified ks/scopes into the SDK's AuthInfo
    // shape so they reach `buildServer` via `ctx.authInfo` — `extra` is the
    // SDK's designated slot for caller-defined auth data.
    const authInfo: AuthInfo = { token: '', clientId: '', scopes, extra: { ks } }
    const handlerWithAuth: FetchLikeMcpHandler = {
      fetch: (webRequest, options) => this.handler.fetch(webRequest, { ...options, authInfo }),
    }

    await toNodeHandler(handlerWithAuth, {
      onerror: (error) => this.logger.error(`MCP request failed: ${error.message}`, error.stack),
    })(request, response, body)
  }

  private buildServer(ctx: McpRequestContext): McpServer {
    const ks = (ctx.authInfo?.extra?.ks as string | undefined) ?? ''
    const scopes = ctx.authInfo?.scopes ?? []

    const mcpServer = new McpServer({
      name: config.server.name,
      version: config.server.version,
    })

    registerAllDomainTools(mcpServer, ks, this.publicApiClient, scopes)
    registerAllDomainResources(mcpServer, ks, this.publicApiClient, scopes)

    return mcpServer
  }

  async healthCheck(): Promise<boolean> {
    return true
  }

  async onModuleDestroy(): Promise<void> {
    await this.handler.close()
  }
}
