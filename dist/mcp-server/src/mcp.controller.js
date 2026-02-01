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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpController = void 0;
const common_1 = require("@nestjs/common");
const mcp_service_1 = require("./mcp.service");
const ks_helper_1 = require("./utils/ks-helper");
let McpController = class McpController {
    constructor(mcpService) {
        this.mcpService = mcpService;
        this.logger = new common_1.ConsoleLogger({
            json: true,
            timestamp: true,
        });
    }
    /**
     * SSE endpoint for MCP connections
     * Clients connect to this endpoint to communicate with the MCP server
     *
     * Authentication:
     * KS must be provided via Authorization header following company standard:
     * - "Authorization: ks <KS_VALUE>" (recommended)
     * - "Authorization: bearer <KS_VALUE>" (for Swagger UI compatibility)
     *
     * Note: Environment variable is NOT used in remote mode for security
     */
    async handleSseConnection(request, response) {
        // Extract KS from Authorization header (company standard format)
        const ks = (0, ks_helper_1.getKsFromRequest)(request);
        if (!ks) {
            this.logger.error('SSE connection rejected: No KS in Authorization header');
            throw new common_1.UnauthorizedException('Kaltura Session (KS) required. Provide via Authorization header: "Authorization: ks <KS>" or "Authorization: bearer <KS>"');
        }
        this.logger.log('New SSE connection established (KS provided)');
        try {
            // Connect MCP server with SSE transport
            // SSEServerTransport will handle all SSE headers and streaming
            await this.mcpService.connectWithSSE(ks, '/mcp/events', response);
        }
        catch (error) {
            this.logger.error('Failed to establish SSE connection:', error);
            throw error;
        }
    }
    /**
     * POST endpoint for SSE client messages
     * SSE clients send messages via POST to communicate with the server
     */
    async handlePostMessage(request, response) {
        try {
            await this.mcpService.handlePostMessage(request, response);
        }
        catch (error) {
            this.logger.error('Failed to handle POST message:', error);
            throw error;
        }
    }
    /**
     * Streamable HTTP endpoint for MCP connections
     * This is the modern MCP transport that handles both GET and POST in a single endpoint
     *
     * Authentication:
     * KS must be provided via Authorization header following company standard:
     * - "Authorization: ks <KS_VALUE>" (recommended)
     * - "Authorization: bearer <KS_VALUE>" (for Swagger UI compatibility)
     */
    async handleStreamableHttp(request, response) {
        // Extract KS from Authorization header (company standard format)
        const ks = (0, ks_helper_1.getKsFromRequest)(request);
        if (!ks) {
            this.logger.error('Streamable HTTP connection rejected: No KS in Authorization header');
            throw new common_1.UnauthorizedException('Kaltura Session (KS) required. Provide via Authorization header: "Authorization: ks <KS>" or "Authorization: bearer <KS>"');
        }
        this.logger.log('New Streamable HTTP connection (KS provided)');
        try {
            // Connect MCP server with Streamable HTTP transport
            await this.mcpService.connectWithStreamableHttp(ks, request, response);
        }
        catch (error) {
            this.logger.error('Failed to establish Streamable HTTP connection:', error);
            throw error;
        }
    }
};
exports.McpController = McpController;
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpController.prototype, "handleSseConnection", null);
__decorate([
    (0, common_1.Post)('events'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpController.prototype, "handlePostMessage", null);
__decorate([
    (0, common_1.All)('streamable'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpController.prototype, "handleStreamableHttp", null);
exports.McpController = McpController = __decorate([
    (0, common_1.Controller)('mcp'),
    __metadata("design:paramtypes", [mcp_service_1.McpService])
], McpController);
