"""Eval: does Claude pick the right MCP tool for a given prompt?

Run a live MCP server first (`npm run start:http`), set the env vars in
`evals/.env`, then:

    pip install -r evals/requirements.txt
    pytest evals/test_tool_selection.py -v
"""

import asyncio
import random
import warnings
from datetime import datetime, timedelta, timezone

import httpx
import pytest

import config
from mcp_agent import run_agent, _mcp_session


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
        httpx.get(anthropic_url, timeout=15)
    except httpx.ConnectError as exc:
        pytest.fail(f"Anthropic API unreachable at {anthropic_url}: {exc}")


def _get_nearest_free_slot(
    event_duration: timedelta = timedelta(minutes=15),
    look_ahead_days: int = 400,
) -> tuple[datetime, datetime]:
    ks = config.KALTURA_KS
    base_url = config.KALTURA_PUBLIC_API

    now = datetime.now(tz=timezone.utc)
    window_end = now + timedelta(days=look_ahead_days)

    response = httpx.post(
        f"{base_url}/events/list",
        headers={"Authorization": f"ks {ks}"},
        json={
            "filter": {
                "startDateGreaterThanOrEqual": now.isoformat(),
                "endDateLessOrEqualThan": window_end.isoformat(),
            },
            "pager": {"limit": 15, "offset": 0},
            "orderBy": "+startDate",
        },
        timeout=10,
    )
    response.raise_for_status()
    events = response.json().get("events", [])

    booked: list[tuple[datetime, datetime]] = []
    for ev in events:
        start_raw = ev.get("startDate")
        end_raw = ev.get("endDate")
        if start_raw and end_raw:
            booked.append((
                datetime.fromisoformat(start_raw.replace("Z", "+00:00")),
                datetime.fromisoformat(end_raw.replace("Z", "+00:00")),
            ))

    candidate = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
    while candidate < window_end:
        slot_end = candidate + event_duration
        if not any(s < slot_end and candidate < e for s, e in booked):
            return candidate, slot_end
        candidate += timedelta(minutes=1)

    raise RuntimeError(f"No free slot found in the next {look_ahead_days} days")


def _get_str_of_nearest_date_for_event(event_duration=timedelta(minutes=15), look_ahead_days=400) -> str:
    """Return the nearest free slot as e.g. '20 of May from 15:07 to 15:22 of UTC'."""
    candidate, slot_end = _get_nearest_free_slot(event_duration, look_ahead_days)
    return f"{candidate.day} of {candidate.strftime('%B')} from {candidate.strftime('%H:%M')} to {slot_end.strftime('%H:%M')} of UTC"


def _create_event_prompt() -> str:
    templates = [
        "Blank template",
        "Interactive session",
        "Live webcast",
        "Pre-recorded live",
        "DIY live broadcast"
    ]
    ind = random.randint(0, len(templates) - 1)
    return f"create the event 'Bla' of '{templates[ind]}' at the next date: {_get_str_of_nearest_date_for_event()}"


def _create_nearest_event_by_api(event_duration=timedelta(minutes=15), look_ahead_days=400) -> str:
    """Create a Kaltura event at the nearest available slot and return its ID."""
    ks = config.KALTURA_KS
    base_url = config.KALTURA_PUBLIC_API

    candidate, slot_end = _get_nearest_free_slot(event_duration, look_ahead_days)

    response = httpx.post(
        f"{base_url}/events/create",
        headers={"Authorization": f"ks {ks}"},
        json={
            "name": "Test Event",
            "description": "Test description",
            "templateId": "tm1000",
            "startDate": candidate.isoformat(),
            "endDate": slot_end.isoformat(),
            "timezone": "Etc/GMT-0",
    },
        timeout=60,
    )
    assert response.status_code == 200, f"Invalid response on creating event: {response.text}"
    json = response.json()
    assert "event" in json and "id" in json["event"], f"Invalid response: {json}"
    return str(response.json()["event"]["id"])


def _delete_event_by_api(event_id: str) -> None:
    httpx.post(
        f"{config.KALTURA_PUBLIC_API}/events/delete",
        headers={"Authorization": f"ks {config.KALTURA_KS}"},
        json={"id": int(event_id)},
        timeout=60,
    ).raise_for_status()


@pytest.fixture
def nearest_temp_event_id():
    event_id = _create_nearest_event_by_api()
    yield event_id
    try:
        _delete_event_by_api(event_id)
    except httpx.HTTPError:
        warnings.warn(f"Event {event_id} was not deleted")


@pytest.mark.parametrize(
    "prompt, expected_tools",
    [
        ("show me all the Kaltura events of today", ["list-events"]),
    ]
)
def test_tool_call(prompt, expected_tools):
    result = run_agent(prompt)
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"

def test_tool_call_event_creation():
    prompt = _create_event_prompt()
    expected_tools = ["create-event"]
    result = run_agent(prompt)
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"


def test_tool_call_when_delete_event():
    expected_tools = ["delete-event"]
    result = run_agent(f"delete the Kaltura event with the ID {_create_nearest_event_by_api()}")
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"

def test_tool_call_when_update_event(nearest_temp_event_id):
    expected_tools = ["update-event"]
    result = run_agent(f"rename the Kaltura event with the ID {nearest_temp_event_id} to 'Updated event'")
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"

def test_tool_call_when_duplicate_event(nearest_temp_event_id):
    expected_tools = ["duplicate-event", ]
    result = run_agent(f"duplicate the Kaltura event with the ID {nearest_temp_event_id} to the date '{_get_str_of_nearest_date_for_event()}' and name the duplicated event 'Duplicated event'")
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"

def test_all_tools_called(nearest_temp_event_id):
    expected_tools = ['create-event', 'update-event', 'duplicate-event', 'delete-event', 'delete-event']
    prompt = "Create a Kaltura 15 mins event 'Bla' today at 18:00, rename the event to 'Renamed event', duplicate it to other nearest available date and remove both events"
    result = run_agent(prompt)
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}\n\nThe response text is:\n\t{result.final_text}"
