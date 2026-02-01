"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpService = void 0;
const common_1 = require("@nestjs/common");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const config_1 = require("./config/config");
const eventTools_1 = require("./tools/eventTools");
const eventResources_1 = require("./resources/eventResources");
const publicApiClient_1 = require("./api/publicApiClient");
const crypto_1 = require("crypto");
/**
 * MCP Service
 * Creates a new MCP server instance per connection (SSE or Streamable HTTP)
 * Each connection has its own KS captured in closure
 */
let McpService = class McpService {
    constructor(publicApiClient) {
        this.publicApiClient = publicApiClient;
        this.logger = new common_1.ConsoleLogger({
            json: true,
            timestamp: true,
        });
        // Store active SSE transports by sessionId for POST message routing
        this.sseTransports = new Map();
        // Store active Streamable HTTP transports by sessionId
        this.streamableTransports = new Map();
        this.logger.log('MCP Service initialized (per-connection mode)');
    }
    /**
     * Connect MCP server with SSE transport
     * Creates a NEW MCP server instance for this specific connection
     * @param ks Kaltura Session for this connection
     * @param endpoint SSE endpoint path
     * @param response Express Response object
     * @returns Promise that resolves when connection closes
     */
    async connectWithSSE(ks, endpoint, response) {
        // Return a promise that only resolves when the connection closes
        return new Promise(async (resolve, reject) => {
            try {
                // Create a NEW MCP server instance for this connection
                const mcpServer = new mcp_js_1.McpServer({
                    name: config_1.config.server.name,
                    version: config_1.config.server.version,
                });
                // Register tools with THIS server and THIS KS
                // KS is captured in closure - each tool handler will use this KS
                (0, eventTools_1.registerEventTools)(mcpServer, ks, this.publicApiClient);
                // Register resources with THIS server and THIS KS
                (0, eventResources_1.registerEventResources)(mcpServer, ks, this.publicApiClient);
                // Create SSE transport for this connection
                const transport = new sse_js_1.SSEServerTransport(endpoint, response);
                // Connect this server instance to this transport
                await mcpServer.connect(transport);
                // Store transport by sessionId for POST message routing
                const sessionId = transport.sessionId;
                this.sseTransports.set(sessionId, transport);
                this.logger.log(`MCP Server connected via SSE (sessionId: ${sessionId})`);
                // Cleanup when connection closes and resolve the promise
                response.on('close', () => {
                    this.sseTransports.delete(sessionId);
                    this.logger.log(`SSE connection closed (sessionId: ${sessionId})`);
                    resolve(); // Connection closed, resolve the promise
                });
                // Handle errors
                response.on('error', (error) => {
                    this.logger.error(`SSE connection error (sessionId: ${sessionId}):`, error);
                    this.sseTransports.delete(sessionId);
                    reject(error);
                });
            }
            catch (error) {
                this.logger.error('Failed to connect MCP server with SSE:', error);
                reject(error);
            }
        });
    }
    /**
     * Handle POST messages for SSE transport
     * Routes messages to the appropriate transport based on sessionId
     */
    async handlePostMessage(request, response) {
        try {
            // Extract sessionId from query parameters
            const sessionId = request.query.sessionId;
            if (!sessionId) {
                this.logger.error('POST request missing sessionId');
                response.status(400).json({ error: 'Missing sessionId' });
                return;
            }
            // Find the SSE transport for this session
            const transport = this.sseTransports.get(sessionId);
            if (!transport) {
                this.logger.error(`No active SSE transport found for sessionId: ${sessionId}`);
                response.status(404).json({ error: 'Session not found' });
                return;
            }
            // Parse request body
            let body;
            if (typeof request.body === 'string') {
                body = JSON.parse(request.body);
            }
            else {
                body = request.body;
            }
            // Log the incoming request for monitoring
            const jsonRpcBody = body;
            if (jsonRpcBody?.method === 'tools/call') {
                this.logger.log(`[${sessionId.substring(0, 8)}...] Tool call: ${jsonRpcBody.params?.name || 'unknown'}`);
            }
            else if (jsonRpcBody?.method) {
                this.logger.log(`[${sessionId.substring(0, 8)}...] MCP method: ${jsonRpcBody.method}`);
            }
            // Forward message to the transport
            await transport.handlePostMessage(request, response, body);
        }
        catch (error) {
            this.logger.error('Error handling POST message:', error);
            response.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Connect MCP server with Streamable HTTP transport
     * Handles session management: creates new server on first request, reuses on subsequent
     * @param ks Kaltura Session for this connection
     * @param request Express Request object
     * @param response Express Response object
     */
    async connectWithStreamableHttp(ks, request, response) {
        try {
            // Parse request body
            let body;
            if (typeof request.body === 'string') {
                body = JSON.parse(request.body);
            }
            else {
                body = request.body;
            }
            // Check if this is an existing session (has mcp-session-id header)
            const existingSessionId = request.headers['mcp-session-id'];
            if (existingSessionId) {
                // Reuse existing transport for this session
                const transport = this.streamableTransports.get(existingSessionId);
                if (!transport) {
                    this.logger.error(`No transport found for sessionId: ${existingSessionId}`);
                    response.status(404).json({
                        jsonrpc: '2.0',
                        error: { code: -32000, message: 'Session not found' },
                        id: null,
                    });
                    return;
                }
                // Log the request
                const jsonRpcBody = body;
                if (jsonRpcBody?.method === 'tools/call') {
                    this.logger.log(`[${existingSessionId.substring(0, 8)}...] Tool call: ${jsonRpcBody.params?.name || 'unknown'}`);
                }
                else if (jsonRpcBody?.method) {
                    this.logger.log(`[${existingSessionId.substring(0, 8)}...] MCP method: ${jsonRpcBody.method}`);
                }
                // Handle request with existing transport
                await transport.handleRequest(request, response, body);
                return;
            }
            // No existing session - this is the first request (initialize)
            // Create a NEW MCP server instance for this session
            const mcpServer = new mcp_js_1.McpServer({
                name: config_1.config.server.name,
                version: config_1.config.server.version,
            });
            // Register tools with THIS server and THIS KS
            // KS is captured in closure - each tool handler will use this KS
            (0, eventTools_1.registerEventTools)(mcpServer, ks, this.publicApiClient);
            // Register resources with THIS server and THIS KS
            (0, eventResources_1.registerEventResources)(mcpServer, ks, this.publicApiClient);
            // Create Streamable HTTP transport for this session
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: () => (0, crypto_1.randomUUID)(),
                onsessioninitialized: (sessionId) => {
                    this.streamableTransports.set(sessionId, transport);
                    this.logger.log(`MCP Server connected via Streamable HTTP (sessionId: ${sessionId})`);
                },
                onsessionclosed: (sessionId) => {
                    this.streamableTransports.delete(sessionId);
                    this.logger.log(`Streamable HTTP connection closed (sessionId: ${sessionId})`);
                },
            });
            // Connect this server instance to this transport
            await mcpServer.connect(transport);
            // Log the initialize request
            const jsonRpcBody = body;
            this.logger.log(`[Streamable] New session - method: ${jsonRpcBody?.method || 'unknown'}`);
            // Handle the first request (initialize)
            await transport.handleRequest(request, response, body);
        }
        catch (error) {
            this.logger.error('Failed to connect MCP server with Streamable HTTP:', error);
            throw error;
        }
    }
    /**
     * Health check for the service
     */
    async healthCheck() {
        return true; // Service is always healthy (creates servers on demand)
    }
};
exports.McpService = McpService;
exports.McpService = McpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [publicApiClient_1.PublicApiClient])
], McpService);
