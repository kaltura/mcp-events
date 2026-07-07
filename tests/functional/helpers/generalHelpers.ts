import { AgentResult, anthropicJudgeResponse } from '../mcpAgent'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function calledToolNames(result: AgentResult): string[] {
  return result.toolsCalled.map((t) => t.name)
}

export function assertCalledTools(
  result: AgentResult,
  expected: string[],
  includeResponseText = false,
): void {
  const called = calledToolNames(result)
  const suffix = includeResponseText ? `\n\nThe response text is:\n\t${result.finalText}` : ''
  assert.deepEqual(
    called,
    expected,
    `Invalid tools call: expected ${JSON.stringify(expected)}, got ${JSON.stringify(called)}${suffix}`,
  )
}

export function lastToolInput(result: AgentResult): Record<string, unknown> {
  return result.toolsCalled[result.toolsCalled.length - 1].input
}
export function getExamplesArr(filename: string): string[] {
  const filepath = join(__dirname, '..', 'resources', 'examples', filename)
  let stat: ReturnType<typeof statSync>
  try {
    stat = statSync(filepath)
  } catch {
    assert.fail(`Examples file not found or not readable: ${filepath}`)
  }
  assert.ok(stat.isFile(), `Examples path is not a file: ${filepath}`)
  return readFileSync(filepath, 'utf-8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
}

export async function assertJudgmentCorrect(
  prompt: string,
  finalText: string,
  examples: string[],
): Promise<void> {
  const verdict = await anthropicJudgeResponse(prompt, finalText, examples)
  assert.ok(
    verdict.startsWith('CORRECT'),
    `Incorrect answer:\n\tPrompt: ${prompt}\n\tAnswer: ${finalText}\n\tExplanation: ${verdict}`,
  )
}
