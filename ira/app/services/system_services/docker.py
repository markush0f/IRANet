from app.modules.services.docker.docker import system_docker_containers


def list_all_containers():
    """Return list of containers"""
    return system_docker_containers()

def list_running_containers():
    """Return list of running containers"""
    all_container = system_docker_containers()
    return [container for container in all_container if container.get("state") == "running"]

def list_exited_containers():
    """Return list of stopped containers"""
    all_container = system_docker_containers()
    return [container for container in all_container if container.get("state") == "exited"]