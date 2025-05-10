import { startServer } from "./server";

/**
 * Main entry point for the MCP server
 */
async function main() {
  try {
    await startServer();
  } catch (error) {
    // Silent error handling to avoid interfering with MCP protocol
    process.exit(1);
  }
}

// Start the application
main();