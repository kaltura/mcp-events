import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({
  command: 'node',
  args: ['/Users/tomgabay/Desktop/kaltura/mcp-events/dist/index.js'],
})

const client = new Client({
  name: 'example-client',
  version: '1.0.0',
})

async function main(): Promise<void> {
  console.log('Connecting to MCP server...')
  await client.connect(transport)
  console.log('Connected to MCP server!')

  const tools = await client.listTools()
  console.log('Tools:', tools)

  // Call a tool
  const result = await client.callTool({
    name: 'example-tool',
    arguments: {
      arg1: 'value',
    },
  })
}

main().catch(console.error)
