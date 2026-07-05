"""Eval: does Claude pick the right MCP tool for a given prompt?

Run a live MCP server first (`npm run start:http`), set the env vars in
`evals/.env`, then:

    pip install -r evals/requirements.txt
    pytest evals/test_tool_selection.py -v
"""

import random
from datetime import datetime, timezone, timedelta

from events_helper import get_nearest_free_slot, create_nearest_event_by_api
from mcp_agent import run_agent, anthropic_judge_response
from fixtures import nearest_temp_event_id


_timezone = "Etc/UTC"
_tool_update_event = "update-event"
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
    return f"create the event '{name}' of the template '{event_template}' at the next date: {_get_str_of_nearest_date_for_event(date_from, date_to)}"


def _parse_iso_to_utc(dt: str) -> datetime:
    """Parse ISO datetime that may end with Z and normalize to UTC-aware datetime."""
    parsed = datetime.fromisoformat(dt.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _assert_called_tools(result, expected_tools: list[str], include_response_text: bool = False):
    called = [t["name"] for t in result.tools_called]
    suffix = f"\n\nThe response text is:\n\t{result.final_text}" if include_response_text else ""
    assert called == expected_tools, f"Invalid tools call: expected {expected_tools}, got {called}{suffix}"


def _last_tool_input(result) -> dict:
    return result.tools_called[-1]["input"]


def _assert_datetime_close(
    actual_iso: str,
    expected_dt: datetime,
    tool_name: str,
    field_name: str,
    tolerance: timedelta = timedelta(minutes=1),
):
    actual = _parse_iso_to_utc(actual_iso)
    expected = expected_dt.astimezone(timezone.utc)
    assert abs(actual - expected) <= tolerance, (
        f"Invalid event {field_name} in the called tool '{tool_name}': "
        f"expected ~{expected.isoformat()}, got {actual.isoformat()}"
    )


def _assert_judgment_correct(prompt: str, final_text: str, examples: list[str]):
    judgment_answer = anthropic_judge_response(prompt, final_text, examples)
    assert judgment_answer.text.startswith("CORRECT"), (
        f"Incorrect answer:\n\tPrompt: {prompt}\n\tAnswer: {final_text}\n\tExplanation: {judgment_answer}"
    )


def test_tool_call_list_events():
    examples = [
        "+ There are no Kaltura events scheduled for today (July 2, 2026).\n\t+\n\t+ Would you like me to:\n\t+ 1. Show you events from a different date range?\n\t+ 2. List all upcoming events?\n\t+ 3. Create a new event for today?\n\t+\n\t+ Let me know how I can help!"
    ]
    prompt = "show me all the Kaltura events of today"
    expected_tools = ["list-events"]
    result = run_agent(prompt)

    _assert_called_tools(result, expected_tools)
    called_tools_args = _last_tool_input(result)

    _filter = called_tools_args["filter"]
    today_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    assert _filter["startDateGreaterThanOrEqual"] == f"{today_date_str}T00:00:00Z", f"Invalid start date of the called tool '{expected_tools[0]}'"
    assert _filter["startDateLessOrEqualThan"] == f"{today_date_str}T23:59:59Z", f"Invalid end date of the called tool '{expected_tools[0]}'"

    _assert_judgment_correct(prompt, result.final_text, examples)


def test_tool_call_event_creation():
    examples = [
        "Perfect! I've successfully created the event **'Bla'** with the following details:\n\n- **Event ID**: 10001\n- **Type**: Live Webcast (tm2000 template)\n- **Start Date**: July 2, 2026 at 13:28 UTC\n- **End Date**: July 2, 2026 at 13:43 UTC\n- **Timezone**: Etc/UTC\n\nThe event is now ready to use!"
    ]
    event_name = "Bla"
    event_template = _random_event_template()
    event_date_from, event_date_to = get_nearest_free_slot()
    prompt = _create_event_prompt(event_template["name"], event_name, event_date_from, event_date_to)
    expected_tools = ["create-event"]

    result = run_agent(prompt)
    _assert_called_tools(result, expected_tools)
    called_tools_args = _last_tool_input(result)

    assert called_tools_args["name"] == event_name, f"Invalid event name in the called tool '{expected_tools[0]}'"
    assert called_tools_args["timezone"] == _timezone, f"Invalid event timezone in the called tool '{expected_tools[0]}'"

    _assert_datetime_close(called_tools_args["startDate"], event_date_from, expected_tools[0], "startDate")
    _assert_datetime_close(called_tools_args["endDate"], event_date_to, expected_tools[0], "endDate")

    actual_template_id = called_tools_args["templateId"]
    expected_template_id = event_template["id"]
    assert actual_template_id == expected_template_id, f"Invalid event templateId.\n\tExpected: {expected_template_id}\n\tActual: {actual_template_id}.\n\tThe prompt: {prompt}"

    _assert_judgment_correct(prompt, result.final_text, examples)


def test_tool_call_when_delete_event():
    examples = [
        "The Kaltura event with ID (some integer) has been successfully deleted. All associated resources and configurations have been permanently removed.",
        "The Kaltura event with ID (some integer) has been successfully deleted. All associated resources and configurations for this event have been permanently removed."
    ]
    expected_tools = ["delete-event"]
    event_id = create_nearest_event_by_api()
    expected_tools_args = {"id": event_id}
    prompt = f"delete the Kaltura event with the ID {event_id}"

    result = run_agent(prompt)
    _assert_called_tools(result, expected_tools)
    called_tools_args = _last_tool_input(result)

    assert called_tools_args == expected_tools_args, f"Invalid event id in the called tool '{expected_tools[0]}'"
    _assert_judgment_correct(prompt, result.final_text, examples)


def test_tool_call_when_update_event(nearest_temp_event_id):
    examples = ["Perfect! I've successfully renamed the Kaltura event with ID (some integer) to 'Updated event'. The event name has been updated."]
    expected_tools = [_tool_update_event]
    prompt = f"rename the Kaltura event with the ID {nearest_temp_event_id} to 'Updated event'"

    result = run_agent(prompt)
    _assert_called_tools(result, expected_tools)
    called_tools_args = _last_tool_input(result)

    assert called_tools_args["id"] == nearest_temp_event_id, f"Invalid event id in the called tool '{expected_tools[0]}'"
    _assert_judgment_correct(prompt, result.final_text, examples)


def test_tool_call_when_duplicate_event(nearest_temp_event_id):
    examples = ["Perfect! I've successfully duplicated the event. Here are the details of the new event: - Event ID: 10002 - Event Name: Duplicated event - Start Date: July 5, 2026 at 08:41 UTC - End Date: July 5, 2026 at 08:56 UTC - Timezone: Etc/UTC The event has been created with all the configurations from the original event (ID 2712732)."]
    expected_tools = ["duplicate-event"]
    event_date_from, event_date_to = get_nearest_free_slot()
    date_str = _get_str_of_nearest_date_for_event(event_date_from, event_date_to)
    name = "Duplicated event"
    prompt = f"duplicate the Kaltura event with the ID {nearest_temp_event_id} to the date '{date_str}' and name the duplicated event '{name}'"

    result = run_agent(prompt)
    _assert_called_tools(result, expected_tools)
    called_tools_args = _last_tool_input(result)

    assert called_tools_args["sourceEventId"] == nearest_temp_event_id, f"Invalid the source event id in the called tool '{expected_tools[0]}'"
    assert called_tools_args["name"] == name, f"Invalid the name of the duplicated event in the called tool '{expected_tools[0]}'"
    assert called_tools_args["timezone"] == _timezone, f"Invalid the timezone of the duplicated event in the called tool '{expected_tools[0]}'"

    _assert_datetime_close(called_tools_args["startDate"], event_date_from, expected_tools[0], "startDate")
    _assert_datetime_close(called_tools_args["endDate"], event_date_to, expected_tools[0], "endDate")

    _assert_judgment_correct(prompt, result.final_text, examples)


def test_all_tools_called(nearest_temp_event_id):
    examples = [
        "Perfect! I've successfully completed all the tasks: ✅ Created event \"Bla\" (ID: 10001) for today (2026-07-05) at 18:00 UTC for 15 minutes ✅ Renamed the event to \"Renamed event\" ✅ Duplicated the event to tomorrow (2026-07-06) at 18:00 UTC (ID: 10002) with name \"Renamed event - Copy\" ✅ Deleted both events (IDs 10001 and 10002) Both events have been successfully removed from the system."
    ]
    expected_tools = ["create-event", "update-event", "duplicate-event", "delete-event", "delete-event"]
    prompt = "Create a Kaltura 15 mins event 'Bla' today at 18:00, rename the event to 'Renamed event', duplicate it to other nearest available date and remove both events"

    result = run_agent(prompt)
    _assert_called_tools(result, expected_tools, include_response_text=True)
    _assert_judgment_correct(prompt, result.final_text, examples)