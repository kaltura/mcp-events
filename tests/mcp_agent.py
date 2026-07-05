"""Drive the MCP server with a Claude agent and capture which tools it selects.

Connects to the running HTTP server over streamable-HTTP, loads the real tool
schemas via `list_tools`, then runs a Claude tool-use loop on a single prompt.
Tool execution is stubbed by default so evals never touch the live Kaltura API;
set EXECUTE_TOOLS=1 to call tools for real (read-only prompts only).
"""

from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import date

import httpx
from anthropic import Anthropic
from anthropic.types import TextBlock
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

import config

MAX_AGENT_STEPS = 15


@dataclass
class AgentResult:
    final_text: str
    tools_called: list[dict] = field(default_factory=list)


def _build_anthropic_client() -> Anthropic:
    """Build the agent's LLM client.

    Routes through a proxy (e.g. LiteLLM) when ANTHROPIC_BASE_URL +
    ANTHROPIC_AUTH_TOKEN are set, otherwise uses a direct ANTHROPIC_API_KEY.
    """
    kwargs: dict = {}
    if config.ANTHROPIC_BASE_URL:
        kwargs["base_url"] = config.ANTHROPIC_BASE_URL
    if config.ANTHROPIC_AUTH_TOKEN:
        kwargs["auth_token"] = config.ANTHROPIC_AUTH_TOKEN
    elif config.ANTHROPIC_API_KEY:
        kwargs["api_key"] = config.ANTHROPIC_API_KEY
    return Anthropic(**kwargs)


def _anthropic_tools(mcp_tools) -> list[dict]:
    return [
        {
            "name": t.name,
            "description": t.description or "",
            "input_schema": t.inputSchema,
        }
        for t in mcp_tools
    ]

async def anthropic_create_message(session: ClientSession, messages: list[dict]) -> Anthropic.MessageResponse:
    system = (
        "You are an assistant for the Kaltura Events platform. "
        f"Today's date is {date.today().isoformat()}. "
        "Use the available tools to fulfil the user's request."
    )
    tools = (await session.list_tools()).tools
    anthropic_tools = _anthropic_tools(tools)
    return _build_anthropic_client().messages.create(
        model=config.ANTHROPIC_MODEL,
        max_tokens=1024,
        system=system,
        tools=anthropic_tools,
        messages=messages,
        temperature=0.0
    )

def anthropic_judge_response(input_context: str, evaluated_output: str, examples: list[str]) -> TextBlock:
    system = (
        "You are an assistant for the Kaltura Events platform. "
        f"Today's date is {date.today().isoformat()}. "
        "Use the available tools to fulfil the user's request."
    )
    prompt = f"On the given prompt '{input_context}' has been received the next output '{evaluated_output}'. Analyze the the output and answer if the output is correct or not. Your analyze should be only syntactical and logical without any technical proves or details. Start your answer with the word CORRECT or INCORRECT. If the output is not correct, explain why and provide a correct output."
    if examples:
        prompt += f" Here are some examples of correct outputs: {examples}"
    response = _build_anthropic_client().messages.create(
        model=config.ANTHROPIC_MODEL,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )
    return response.content[0]


async def _run_agent_async(prompt: str) -> AgentResult:
    ks = config.KALTURA_KS
    url = config.MCP_SERVER_URL
    execute_tools = config.EXECUTE_TOOLS

    headers = {"Authorization": f"ks {ks}"}
    result = AgentResult(final_text="")

    try:
        async with streamable_http_client(url, http_client=httpx.AsyncClient(headers=headers)) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                await _run_agent_loop(session, prompt, result, execute_tools)
    except* (httpx.ConnectError, httpx.ConnectTimeout):
        raise ConnectionError(f"MCP server not reachable at {url}") from None

    return result


async def _run_agent_loop(session: ClientSession, prompt: str, result: AgentResult, execute_tools: bool) -> None:
    messages: list[dict] = [{"role": "user", "content": prompt}]

    for _step in range(MAX_AGENT_STEPS):
        response = await anthropic_create_message(session, messages)

        tool_uses = [b for b in response.content if b.type == "tool_use"]
        result.final_text = "\n".join(b.text for b in response.content if b.type == "text") or result.final_text

        if response.stop_reason != "tool_use" or not tool_uses:
            break

        messages.append({"role": "assistant", "content": response.content})

        result.tools_called.extend({"name": tu.name, "input": tu.input} for tu in tool_uses)
        tool_results = [
            {"type": "tool_result", "tool_use_id": tu.id, "content": await _resolve_tool(session, tu, execute_tools)}
            for tu in tool_uses
        ]
        messages.append({"role": "user", "content": tool_results})


def _stub_response(tool_name: str, tool_input: dict) -> dict:
    """Return a minimal but realistic stub so the LLM can chain multi-turn operations."""
    def _event_stub(event_id: int, default_name: str) -> dict:
        return {"event": {
            "id": event_id,
            "name": tool_input.get("name", default_name),
            "startDate": tool_input.get("startDate"),
            "endDate": tool_input.get("endDate"),
        }}

    if tool_name == "list-events":
        return {"events": [], "totalCount": 0}
    if tool_name == "create-event":
        return _event_stub(10001, "Event")
    if tool_name == "update-event":
        return {"event": {"id": tool_input.get("id"), "name": tool_input.get("name")}}
    if tool_name == "duplicate-event":
        return _event_stub(10002, "Duplicated Event")
    if tool_name == "delete-event":
        return {"success": True}
    return {"status": "ok"}


async def _resolve_tool(session: ClientSession, tool_use, execute: bool) -> str:
    if not execute:
        return json.dumps(_stub_response(tool_use.name, tool_use.input))
    res = await session.call_tool(tool_use.name, tool_use.input)
    return "\n".join(c.text for c in res.content if getattr(c, "type", None) == "text")


def run_agent(prompt: str) -> AgentResult:
    """Synchronous entry point for pytest."""
    try:
        return asyncio.run(_run_agent_async(prompt))
    except ConnectionError as e:
        import pytest
        pytest.skip(str(e))

@asynccontextmanager
async def _mcp_session():
    """Async context manager that yields an initialised ClientSession."""
    ks = config.KALTURA_KS
    url = config.MCP_SERVER_URL
    headers = {"Authorization": f"ks {ks}"}
    async with streamable_http_client(url, http_client=httpx.AsyncClient(headers=headers)) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            yield session


async def _list_resources_async() -> dict:
    async with _mcp_session() as session:
        resources = (await session.list_resources()).resources
        templates = (await session.list_resource_templates()).resourceTemplates
        return {
            "resources": [r.name for r in resources],
            "templates": [t.name for t in templates],
        }


async def _read_resource_async(uri: str) -> str:
    async with _mcp_session() as session:
        result = await session.read_resource(uri)
        return "\n".join(c.text for c in result.contents if getattr(c, "type", None) == "text" or hasattr(c, "text"))


def list_resources() -> dict:
    """Return {'resources': [...static names...], 'templates': [...template names...]}."""
    return asyncio.run(_list_resources_async())


def read_resource(uri: str) -> str:
    """Read a resource by URI and return its text content."""
    return asyncio.run(_read_resource_async(uri))


if __name__ == "__main__":
    import sys

    out = run_agent(sys.argv[1] if len(sys.argv) > 1 else "show me all the Kaltura events of today")
    print("tools_called:", [t["name"] for t in out.tools_called])
    print("final_text:", out.final_text)
