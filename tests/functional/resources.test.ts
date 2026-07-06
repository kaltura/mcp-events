// Eval: verify the MCP server exposes the correct resources.
//
// Resources expected (from README):
//   - events           (resource template: events://{eventId}/info)
//   - preset-templates (static resource:   preset-templates://all)
//
// Run a live MCP server first (`npm run start:http`), then: npm run test:functional
//
// Port of the Python `test_resources.py`.

import assert from 'node:assert/strict'
import { before, describe, test } from 'node:test'

import { checkConnections } from './fixtures'
import { listResources, readResource, type ResourceListing } from './mcpAgent'

describe('resources', { concurrency: true }, () => {
  let resources: ResourceListing

  before(async () => {
    await checkConnections()
    resources = await listResources()
  })

  test('preset-templates is a static resource and must appear in listResources', () => {
    assert.ok(
      resources.resources.includes('preset-templates'),
      `Expected 'preset-templates' in static resources, got: ${JSON.stringify(resources.resources)}`,
    )
  })

  test('events is a resource template and must appear in listResourceTemplates', () => {
    assert.ok(
      resources.templates.includes('events'),
      `Expected 'events' in resource templates, got: ${JSON.stringify(resources.templates)}`,
    )
  })

  test('reading preset-templates://all returns non-empty JSON', async () => {
    const content = await readResource('preset-templates://all')
    const data = JSON.parse(content)
    const nonEmpty = Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0
    assert.ok(
      nonEmpty,
      `Expected non-empty JSON from preset-templates://all, got: ${JSON.stringify(content)}`,
    )
  })

  test('reading events://{id}/info with an unknown ID returns an error message, not a crash', async () => {
    const content = await readResource('events://0/info')
    assert.ok(
      typeof content === 'string' && content.length > 0,
      'Expected a non-empty string response for unknown event ID',
    )
  })
})
