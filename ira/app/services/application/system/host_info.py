from app.modules.system.host import host_info

def build_host_info() -> dict:
    return {
        "host": host_info(),
    }
