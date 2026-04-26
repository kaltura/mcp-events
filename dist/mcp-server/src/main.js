"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("./config/config");
const common_1 = require("@nestjs/common");
/**
 * Bootstrap MCP Server with plain NestJS
 *
 * Note: We don't use createWebApp() from @kaltura/services-common because:
 * - It adds KsReaderMiddleware globally which conflicts with MCP authentication
 * - MCP handles KS extraction manually per connection
 */
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: new common_1.ConsoleLogger({
            json: true,
            timestamp: true,
        }),
    });
    // Enable CORS for remote SSE connections
    app.enableCors({
        origin: '*',
        credentials: true,
    });
    const serverPort = config_1.config.server.port;
    await app.listen(serverPort);
    console.log(`MCP Server is listening on port ${serverPort}`);
}
bootstrap()
    .then(() => console.log('MCP Server is ready'))
    .catch((r) => console.log('MCP Server failed to start:', r));
