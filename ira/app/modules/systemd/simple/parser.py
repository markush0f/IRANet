def parse_systemctl_show(output: str) -> list[dict]:
    services: list[dict] = []

    blocks = output.strip().split("\n\n")
    for block in blocks:
        data: dict = {}

        for line in block.splitlines():
            if "=" not in line:
                continue

            key, value = line.split("=", 1)
            data[key] = value if value != "" else None

        services.append(data)

    return services
