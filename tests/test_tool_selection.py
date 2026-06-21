"""Eval: does Claude pick the right MCP tool for a given prompt?

Run a live MCP server first (`npm run start:http`), set the env vars in
`evals/.env`, then:

    pip install -r evals/requirements.txt
    pytest evals/test_tool_selection.py -v
"""

import pytest

from mcp_agent import run_agent

# (prompt, expected tool names) — read-only tools only, so nothing is mutated.
CASES = [
    ("show me all the Kaltura events of today", ["list-events"]),
    ("list every team member on the account", ["list-team-members"]),
    ("what events are happening this week?", ["list-events"]),
]


@pytest.mark.parametrize("prompt,expected_tools", CASES)
def test_tool_selection(prompt, expected_tools):
    result = run_agent(prompt)
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Expected {expected_tools}, got {called}"
