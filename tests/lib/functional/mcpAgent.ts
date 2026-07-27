// Drive the MCP server with a Claude agent and capture which tools it selects.
//
// Connects to the MCP server over stdio (spawned directly from source via `tsx`),
// loads the real tool schemas via `listTools`, then runs a Claude tool-use loop on a
// single prompt.

import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { openSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from './config'

const MAX_AGENT_STEPS = 15

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const STDIO_SERVER_SCRIPT = join(REPO_ROOT, 'tests/functional/stdio_mcp.sh')
const SERVER_LOG_PATH = join(tmpdir(), `mcp-server-${process.pid}.log`)

let serverLogFd: number | undefined

export interface AgentResult {
  finalText: string
  toolsCalled: Array<{ name: string; input: Record<string, unknown> }>
}

/** Build the env for the spawned stdio server process, dropping unset variables. */
function stdioServerEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value
    }
  }
  return env
}

/**
 * Open (once per process) the temp file that captures the spawned server's stderr output,
 * printing its path to the test output the first time it's opened.
 */
function serverLogFileDescriptor(): number {
  if (serverLogFd === undefined) {
    serverLogFd = openSync(SERVER_LOG_PATH, 'a')
    console.log(`MCP server output redirected to: ${SERVER_LOG_PATH}`)
  }
  return serverLogFd
}

/** Connect to the MCP server over stdio by spawning the build-and-run shell script. */
async function connectStdio(client: Client): Promise<void> {
  const transport = new StdioClientTransport({
    command: STDIO_SERVER_SCRIPT,
    args: [],
    env: stdioServerEnv(),
    cwd: '',
    stderr: serverLogFileDescriptor(),
  })
  await client.connect(transport)
}

/** Open an MCP session over stdio and return a connected client. Caller must `close()`. */
export async function mcpSession(): Promise<Client> {
  const client = new Client({ name: 'functional-tests', version: '1.0.0' })
  await connectStdio(client)
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
    'You are an assistant for the Kaltura platform. ' +
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
    'Analyze the prompt and the output. Answer if the output is generally correct or not starting your answer with the word "CORRECT" or "INCORRECT" in upper case. ' +
    'Be focused only on logic no need in any technical proves or details. Exposing email is not a security flaw. Omit checking emails relevant. ' +
    'If the output is not correct, explain why and provide a correct output.'
  if (examples.length > 0) {
    prompt += ` Here are some examples of correct outputs: ${JSON.stringify(examples)}`
  }

  const response = await buildAnthropicClient().messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: systemPrompt(),
    messages: [{ role: 'user', content: prompt }],
  })

  const firstText = response.content.find(
    (b: { type: string }): b is Anthropic.TextBlock => b.type === 'text',
  )
  return firstText?.text ?? ''
}

async function resolveTool(client: Client, toolUse: Anthropic.ToolUseBlock): Promise<string> {
  const input = (toolUse.input ?? {}) as Record<string, unknown>
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

    const toolUses = response.content.filter(
      (b: { type: string }): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )
    const text = response.content
      .filter((b: { type: string }): b is Anthropic.TextBlock => b.type === 'text')
      .map((b: { text: string }) => b.text)
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
      toolUses.map(async (tu: { id: string }) => ({
        type: 'tool_result' as const,
        tool_use_id: tu.id,
        content: await resolveTool(client, tu as Anthropic.ToolUseBlock),
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
