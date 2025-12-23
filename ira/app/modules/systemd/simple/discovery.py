import subprocess

from app.modules.systemd.simple.parser import parse_systemctl_show
from app.modules.systemd.simple.types import SimpleService


SYSTEMCTL_FIELDS = [
    "Id",
    "Description",
    "Type",
    "ActiveState",
    "SubState",
    "ExecStart",
    "MainPID",
    "User",
    "Group",
    "WorkingDirectory",
    "NRestarts",
    "Result",
    "ExecMainStatus",
    "ExecMainCode",
    "CPUUsageNSec",
    "MemoryCurrent",
    "MemoryPeak",
    "TasksCurrent",
]


def discover_simple_services(
    limit=10,
) -> list[SimpleService]:
    list_units_cmd = [
        "systemctl",
        "list-units",
        "--type=service",
        "--all",
        "--no-legend",
        "--plain",  # Avoid special symbols like ●
        "--no-pager",
    ]

    units_output = subprocess.check_output(list_units_cmd, text=True)

    unit_names: list[str] = []

    # Defensive parsing of systemctl output
    for line in units_output.splitlines():
        parts = line.split()
        if not parts:
            continue

        unit = parts[0]

        # Skip invalid unit names (e.g. bullet symbol)
        if unit == "●":
            continue

        unit_names.append(unit)

    if not unit_names:
        return []

    show_cmd = [
        "systemctl",
        "show",
        *unit_names,
        *[f"-p{field}" for field in SYSTEMCTL_FIELDS],
        "--no-pager",
    ]

    show_output = subprocess.check_output(show_cmd, text=True)

    parsed = parse_systemctl_show(show_output)

    services: list[SimpleService] = []

    for item in parsed:
        if item.get("Type") != "simple":
            continue

        services.append(
            SimpleService(
                id=item["Id"],
                description=item.get("Description"),
                active_state=item["ActiveState"],
                sub_state=item["SubState"],
                main_pid=int(item.get("MainPID") or 0),
                user=item.get("User"),
                group=item.get("Group"),
                working_directory=item.get("WorkingDirectory"),
                exec_start=item.get("ExecStart"),
                restarts=int(item.get("NRestarts") or 0),
                result=item.get("Result"),
                exec_main_code=item.get("ExecMainCode"),
                exec_main_status=int(item.get("ExecMainStatus") or 0),
                cpu_usage_ns=_safe_int(item.get("CPUUsageNSec")),
                memory_current=_safe_int(item.get("MemoryCurrent")),
                memory_peak=_safe_int(item.get("MemoryPeak")),
                tasks_current=_safe_int(item.get("TasksCurrent")),
            )
        )

    return services[:limit]


def _safe_int(value: str | None) -> int | None:
    try:
        return int(value) if value is not None else None
    except ValueError:
        return None
