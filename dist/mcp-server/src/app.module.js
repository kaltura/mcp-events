"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const health_check_provider_1 = require("./health/health-check.provider");
const health_controller_1 = require("./health/health.controller");
const mcp_service_1 = require("./mcp.service");
const mcp_controller_1 = require("./mcp.controller");
const publicApiClient_1 = require("./api/publicApiClient");
/**
 * Main application module
 *
 * Note: We don't use @DefaultModule decorator here because:
 * 1. MCP endpoint doesn't need KsReaderMiddleware validation
 * 2. KS is extracted and used manually per connection
 * 3. Avoids conflicts with MCP protocol authentication flow
 */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        providers: [mcp_service_1.McpService, publicApiClient_1.PublicApiClient, health_check_provider_1.HealthChecker],
        controllers: [mcp_controller_1.McpController, health_controller_1.HealthController],
    })
], AppModule);
