# Functional tests of the Kaltura Events MCP Server  

Functional tests consists of 2 parts:
- Tests of called resources by the MCP server
- Tests of the called tools by the MCP server  

Every test of called tools consists of 3 parts:
1. Checking the called tools by names
2. Checking the called tools arguments
3. Checking MCP response correctness by LLM judgment

### Project structure:
```
app/
├── tools-calling/            # Functional tests of called tools by the Kaltura Events MCP server
└──  resources.test.ts        # Functional tests of called resources by the Kaltura Events MCP server

lib/                          # Library helping to build functional tests of a general MCP server
└── functinal               
       ├── config.ts          # Configuration and env vars initialization
       ├── generalHelpers.ts  # General helpers for building functional tests of a general MCP server
       ├── mcpAgent.ts        # Anthropic agent for sending requests to the MCP server and receiving responses
       ├── stdio_mcp.sh       # Script of running the Kaltura Events MCP server in stdio mode for functional tests
       └── utils.ts           # General uitilities
```

For running tests should be defined the next env vars:
- KALTURA_KS - Kaltura session key for the MCP server to call
- ANTHROPIC_BASE_URL - e.g. http://127.0.0.1:10006
- ANTHROPIC_AUTH_TOKEN - Anthropic API key for the MCP server to call
- ANTHROPIC_MODEL - Anthropic model name for an MCP server response LLM judgment (it should be Haiku)
- KALTURA_PUBLIC_API - the URL like https://events-api.nvp1.ovp.kaltura.com/api/v1

### Tests running
From the root directory of the Kaltura Events MCP project (set the env vars above to .env in the root directory) run the next command:
```bash 
npm run test
```

## Useful links
[The Step-By-Step Guide to MCP Evaluation](https://www.confident-ai.com/blog/the-step-by-step-guide-to-mcp-evaluation)  
[MCP Architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)