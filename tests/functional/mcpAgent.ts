// Drive the MCP server with a Claude agent and capture which tools it selects.
//
// Connects to the running HTTP server over streamable-HTTP, loads the real tool
// schemas via `listTools`, then runs a Claude tool-use loop on a single prompt.
// Tool execution is stubbed by default so tests never touch the live Kaltura API;
// set EXECUTE_TOOLS=1 to call tools for real (read-only prompts only).
//
// Port of the Python `mcp_agent.py`.

import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

import { config } from './config'

const MAX_AGENT_STEPS = 15

export interface AgentResult {
  finalText: string
  toolsCalled: Array<{ name: string; input: Record<string, unknown> }>
}

/** Open a streamable-HTTP MCP session and return a connected client. Caller must `close()`. */
export async function mcpSession(): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(config.MCP_SERVER_URL), {
    requestInit: { headers: { Authorization: `ks ${config.KALTURA_KS}` } },
  })
  const client = new Client({ name: 'functional-tests', version: '1.0.0' })
  await client.connect(transport)
  return client
}

function buildAnthropicClient(): Anthropic {
  if (config.ANTHROPIC_BASE_URL) {
    return new Anthropic({ baseURL: config.ANTHROPIC_BASE_URL, authToken: config.ANTHROPIC_AUTH_TOKEN })
  }
  return new Anthropic({ apiKey: config.ANTHROPIC_API_KEY })
}

function systemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10)
  return (
    'You are an assistant for the Kaltura Events platform. ' +
    `Today's date is ${today}. ` +
    "Use the available tools to fulfil the user's request."
  )
}

async function anthropicCreateMessage(
  client: Client,
  messages: Anthropic.MessageParam[],
): Promise<Anthropic.Message> {
  const { tools } = await client.listTools()
  const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description ?? '',
    input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
  }))

  return buildAnthropicClient().messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: systemPrompt(),
    tools: anthropicTools,
    messages,
    temperature: 0,
  })
}

/** LLM-as-judge: ask Claude whether the agent's answer is correct. Returns the verdict text. */
export async function anthropicJudgeResponse(
  inputContext: string,
  evaluatedOutput: string,
  examples: string[],
): Promise<string> {
  let prompt =
    `On the given prompt '${inputContext}' has been received the next output '${evaluatedOutput}'. ` +
    'Analyze the the output and answer if the output is correct or not. Your analyze should be only ' +
    'syntactical and logical without any technical proves or details. Start your answer with the word ' +
    'CORRECT or INCORRECT. If the output is not correct, explain why and provide a correct output.'
  if (examples.length > 0) {
    prompt += ` Here are some examples of correct outputs: ${JSON.stringify(examples)}`
  }

  const response = await buildAnthropicClient().messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: systemPrompt(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  })

  const firstText = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  return firstText?.text ?? ''
}

/** Minimal but realistic stub so the LLM can chain multi-turn operations without hitting the API. */
function stubResponse(toolName: string, toolInput: Record<string, unknown>): Record<string, unknown> {
  const eventStub = (id: number, defaultName: string): Record<string, unknown> => ({
    event: {
      id,
      name: toolInput.name ?? defaultName,
      startDate: toolInput.startDate,
      endDate: toolInput.endDate,
    },
  })

  switch (toolName) {
    case 'list-events':
      return { events: [], totalCount: 0 }
    case 'create-event':
      return eventStub(10001, 'Event')
    case 'update-event':
      return { event: { id: toolInput.id, name: toolInput.name } }
    case 'duplicate-event':
      return eventStub(10002, 'Duplicated Event')
    case 'delete-event':
      return { success: true }
    default:
      return { status: 'ok' }
  }
}

async function resolveTool(
  client: Client,
  toolUse: Anthropic.ToolUseBlock,
  execute: boolean,
): Promise<string> {
  const input = (toolUse.input ?? {}) as Record<string, unknown>
  if (!execute) {
    return JSON.stringify(stubResponse(toolUse.name, input))
  }
  const result = await client.callTool({ name: toolUse.name, arguments: input })
  return joinTextContent(result.content)
}

/**
 * Join the `text` fields of an MCP content array. Works for both tool-result blocks
 * (`{ type: 'text', text }`) and resource contents (`{ uri, mimeType, text }`, which
 * carry no `type` discriminator), so we key on the presence of a string `text` field.
 */
function joinTextContent(content: unknown): string {
  if (!Array.isArray(content)) {
    return ''
  }
  return content
    .filter((c): c is { text: string } => typeof c?.text === 'string')
    .map((c) => c.text)
    .join('\n')
}

async function runAgentLoop(client: Client, prompt: string, result: AgentResult): Promise<void> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const response = await anthropicCreateMessage(client, messages)

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
    result.finalText = text || result.finalText

    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      break
    }

    messages.push({ role: 'assistant', content: response.content })

    for (const tu of toolUses) {
      result.toolsCalled.push({ name: tu.name, input: (tu.input ?? {}) as Record<string, unknown> })
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (tu) => ({
        type: 'tool_result' as const,
        tool_use_id: tu.id,
        content: await resolveTool(client, tu, config.EXECUTE_TOOLS),
      })),
    )
    messages.push({ role: 'user', content: toolResults })
  }
}

export async function runAgent(prompt: string): Promise<AgentResult> {
  const result: AgentResult = { finalText: '', toolsCalled: [] }
  const client = await mcpSession()
  try {
    await runAgentLoop(client, prompt, result)
  } finally {
    await client.close()
  }
  return result
}

export interface ResourceListing {
  resources: string[]
  templates: string[]
}

export async function listResources(): Promise<ResourceListing> {
  const client = await mcpSession()
  try {
    const resources = (await client.listResources()).resources
    const templates = (await client.listResourceTemplates()).resourceTemplates
    return {
      resources: resources.map((r) => r.name),
      templates: templates.map((t) => t.name),
    }
  } finally {
    await client.close()
  }
}

export async function readResource(uri: string): Promise<string> {
  const client = await mcpSession()
  try {
    const result = await client.readResource({ uri })
    return joinTextContent(result.contents)
  } finally {
    await client.close()
  }
}
