"""Eval: verify the MCP server exposes the correct resources.

Resources expected (from README):
  - events          (resource template: events://{eventId}/info)
  - preset-templates (static resource:  preset-templates://all)

Run a live MCP server first (`npm run start:http`), then:

    pytest evals/test_resources.py -v
"""

import json

import pytest

from mcp_agent import list_resources, read_resource


@pytest.fixture(scope="module")
def resources():
    return list_resources()


def test_static_resource_names(resources):
    """preset-templates is a static resource and must appear in list_resources."""
    assert "preset-templates" in resources["resources"], (
        f"Expected 'preset-templates' in static resources, got: {resources['resources']}"
    )


def test_template_resource_names(resources):
    """events is a resource template and must appear in list_resource_templates."""
    assert "events" in resources["templates"], (
        f"Expected 'events' in resource templates, got: {resources['templates']}"
    )


def test_preset_templates_readable():
    """Reading preset-templates://all should return valid JSON with at least one template."""
    content = read_resource("preset-templates://all")
    data = json.loads(content)
    assert isinstance(data, (list, dict)) and len(data) > 0, (
        f"Expected non-empty JSON from preset-templates://all, got: {content!r}"
    )


def test_events_resource_invalid_id():
    """Reading events://{id}/info with an unknown ID should return an error message, not crash."""
    content = read_resource("events://0/info")
    assert isinstance(content, str) and len(content) > 0, (
        "Expected a non-empty string response for unknown event ID"
    )
