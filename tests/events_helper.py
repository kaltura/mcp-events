from datetime import timedelta, datetime, timezone

import httpx

import config



def create_nearest_event_by_api(event_duration=timedelta(minutes=15), look_ahead_days=400) -> int:
    """Create a Kaltura event at the nearest available slot and return its ID."""
    ks = config.KALTURA_KS
    base_url = config.KALTURA_PUBLIC_API

    candidate, slot_end = get_nearest_free_slot(event_duration, look_ahead_days)

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
    return response.json()["event"]["id"]


def delete_event_by_api(event_id: int) -> None:
    httpx.post(
        f"{config.KALTURA_PUBLIC_API}/events/delete",
        headers={"Authorization": f"ks {config.KALTURA_KS}"},
        json={"id": event_id},
        timeout=60,
    ).raise_for_status()


def get_nearest_free_slot(
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
