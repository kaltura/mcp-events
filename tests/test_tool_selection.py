"""Eval: does Claude pick the right MCP tool for a given prompt?

Run a live MCP server first (`npm run start:http`), set the env vars in
`evals/.env`, then:

    pip install -r evals/requirements.txt
    pytest evals/test_tool_selection.py -v
"""

import random
from datetime import datetime, timezone, timedelta

from events_helper import get_nearest_free_slot, create_nearest_event_by_api
from mcp_agent import run_agent
from fixtures import nearest_temp_event_id


_timezone = "Etc/UTC"
_event_templates = [
    {"name": "Blank template", "id": "tm0000"},
    {"name": "Interactive session", "id": "tm1000"},
    {"name": "Live webcast", "id": "tm2000"},
    {"name": "Pre-recorded live", "id": "tm3000"},
    {"name": "DIY live broadcast", "id": "tm4000"},
]


def _get_str_of_nearest_date_for_event(date_from: datetime, date_to: datetime) -> str:
    return f"{date_from.day} of {date_from.strftime('%B')} from {date_from.strftime('%H:%M')} to {date_to.strftime('%H:%M')} of {_timezone}"

def _random_event_template() -> dict[str, str]:
    ind = random.randint(0, len(_event_templates) - 1)
    return _event_templates[ind]

def _create_event_prompt(event_template: str, name: str, date_from: datetime, date_to: datetime) -> str:
    return f"create the event '{name}' of '{event_template}' at the next date: {_get_str_of_nearest_date_for_event(date_from, date_to)}"


def _parse_iso_to_utc(dt: str) -> datetime:
    """Parse ISO datetime that may end with Z and normalize to UTC-aware datetime."""
    parsed = datetime.fromisoformat(dt.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)



def test_tool_call_list_events():
    prompt = "show me all the Kaltura events of today"
    expected_tools = ["list-events"]
    result = run_agent(prompt)
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"
    called_tools_args = result.tools_called[-1]["input"]
    _filter = called_tools_args["filter"]
    today_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    assert _filter["startDateGreaterThanOrEqual"] == f"{today_date_str}T00:00:00Z", f"Invalid start date of the called tool '{expected_tools[0]}'"
    assert _filter["startDateLessOrEqualThan"] == f"{today_date_str}T23:59:59Z", f"Invalid end date of the called tool '{expected_tools[0]}'"

def test_tool_call_event_creation():
    event_name = "Bla"
    event_template = _random_event_template()
    event_date_from, event_date_to = get_nearest_free_slot()
    prompt = _create_event_prompt(event_template["name"], event_name, event_date_from, event_date_to)
    expected_tools = ["create-event"]

    result = run_agent(prompt)
    called_tools = [t["name"] for t in result.tools_called]
    assert called_tools == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called_tools}"

    called_tools_args = result.tools_called[-1]["input"]

    assert called_tools_args["name"] == event_name, f"Invalid event name in the called tool '{expected_tools[0]}'"
    assert called_tools_args["timezone"] == _timezone, f"Invalid event timezone in the called tool '{expected_tools[0]}'"

    actual_start = _parse_iso_to_utc(called_tools_args["startDate"])
    actual_end = _parse_iso_to_utc(called_tools_args["endDate"])
    expected_start = event_date_from.astimezone(timezone.utc)
    expected_end = event_date_to.astimezone(timezone.utc)

    tolerance = timedelta(minutes=1)
    assert abs(actual_start - expected_start) <= tolerance, (
        f"Invalid event startDate in the called tool '{expected_tools[0]}': "
        f"expected {expected_start.isoformat()}, got {actual_start.isoformat()}"
    )
    assert abs(actual_end - expected_end) <= tolerance, (
        f"Invalid event endDate in the called tool '{expected_tools[0]}': "
        f"expected ~{expected_end.isoformat()}, got {actual_end.isoformat()}"
    )
    assert called_tools_args["templateId"] == event_template["id"], f"Invalid event templateId in the called tool '{expected_tools[0]}'"


def test_tool_call_when_delete_event():
    expected_tools = ["delete-event"]
    event_id = create_nearest_event_by_api()
    expected_tools_args = {"id": event_id}
    result = run_agent(f"delete the Kaltura event with the ID {event_id}")
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"
    called_tools_args = result.tools_called[-1]["input"]
    assert called_tools_args == expected_tools_args, f"Invalid event id in the called tool '{expected_tools[0]}'"

def test_tool_call_when_update_event(nearest_temp_event_id):
    expected_tools = ["update-event"]
    result = run_agent(f"rename the Kaltura event with the ID {nearest_temp_event_id} to 'Updated event'")
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"
    called_tools_args = result.tools_called[-1]["input"]
    assert called_tools_args['id'] == nearest_temp_event_id, f"Invalid event id in the called tool '{expected_tools[0]}'"

def test_tool_call_when_duplicate_event(nearest_temp_event_id):
    expected_tools = ["duplicate-event"]
    event_date_from, event_date_to = get_nearest_free_slot()
    date_str = _get_str_of_nearest_date_for_event(event_date_from, event_date_to)
    name = "Duplicated event"
    prompt = f"duplicate the Kaltura event with the ID {nearest_temp_event_id} to the date '{date_str}' and name the duplicated event '{name}'"
    result = run_agent(prompt)
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}"
    called_tools_args = result.tools_called[-1]["input"]
    assert called_tools_args['sourceEventId'] == nearest_temp_event_id, f"Invalid the source event id in the called tool '{expected_tools[0]}'"
    assert called_tools_args['name'] == name, f"Invalid the name of the duplicated event in the called tool '{expected_tools[0]}'"
    assert called_tools_args['timezone'] == _timezone, f"Invalid the timezone of the duplicated event in the called tool '{expected_tools[0]}'"
    actual_start = _parse_iso_to_utc(called_tools_args["startDate"])
    actual_end = _parse_iso_to_utc(called_tools_args["endDate"])
    expected_start = event_date_from.astimezone(timezone.utc)
    expected_end = event_date_to.astimezone(timezone.utc)

    tolerance = timedelta(minutes=1)
    assert abs(actual_start - expected_start) <= tolerance, (
        f"Invalid event startDate in the called tool '{expected_tools[0]}': "
        f"expected {expected_start.isoformat()}, got {actual_start.isoformat()}"
    )
    assert abs(actual_end - expected_end) <= tolerance, (
        f"Invalid event endDate in the called tool '{expected_tools[0]}': "
        f"expected ~{expected_end.isoformat()}, got {actual_end.isoformat()}"
    )

def test_all_tools_called(nearest_temp_event_id):
    expected_tools = ['create-event', 'update-event', 'duplicate-event', 'delete-event', 'delete-event']
    prompt = "Create a Kaltura 15 mins event 'Bla' today at 18:00, rename the event to 'Renamed event', duplicate it to other nearest available date and remove both events"
    result = run_agent(prompt)
    called = [t["name"] for t in result.tools_called]
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}\n\nThe response text is:\n\t{result.final_text}"
