import asyncio
import warnings

import httpx
import pytest

import config
from events_helper import create_nearest_event_by_api, delete_event_by_api
from mcp_agent import _mcp_session


@pytest.fixture
def nearest_temp_event_id():
    event_id = create_nearest_event_by_api()
    yield event_id
    try:
        delete_event_by_api(event_id)
    except httpx.HTTPError:
        warnings.warn(f"Event {event_id} was not deleted")


@pytest.fixture(autouse=True)
def check_mcp_server_connection():
    async def _ping():
        async with _mcp_session() as session:
            await session.list_tools()

    try:
        asyncio.run(_ping())
    except Exception as exc:
        pytest.fail(f"MCP server unreachable: {exc}")

    anthropic_url = config.ANTHROPIC_BASE_URL or "https://api.anthropic.com"
    try:
        httpx.get(anthropic_url, timeout=30)
    except httpx.ConnectError as exc:
        pytest.fail(f"Anthropic API unreachable at {anthropic_url}: {exc}")
