import type { SystemInfo, DockerContainer, ProcessesSnapshot, UsersSummary, RemoteUser } from '../types';

const getBaseUrl = (): string => {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8000';
    return base.replace(/\/+$/, '');
};

export const getSystemInfo = async (signal?: AbortSignal): Promise<SystemInfo> => {
    const url = `${getBaseUrl()}/system/info`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener /system/info`);
    }

    const raw = await response.json();
    // El backend puede responder { host: { ...campos } } o directamente el objeto.
    const data = (raw && typeof raw === 'object' && 'host' in (raw as any)
        ? (raw as any).host
        : raw) as SystemInfo;

    return data;
};

export const getDockerContainers = async (signal?: AbortSignal): Promise<DockerContainer[]> => {
    const url = `${getBaseUrl()}/services/docker/all/containers`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener contenedores Docker`);
    }

    const data = await response.json();
    return data as DockerContainer[];
};

export const getProcessesSnapshot = async (
    limit = 10,
    signal?: AbortSignal
): Promise<ProcessesSnapshot> => {
    const url = `${getBaseUrl()}/processes/snapshot?limit=${encodeURIComponent(limit)}`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener snapshot de procesos`);
    }

    const data = await response.json();
    return data as ProcessesSnapshot;
};

export const getUsersSummary = async (signal?: AbortSignal): Promise<UsersSummary> => {
    const url = `${getBaseUrl()}/users/summary`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener resumen de usuarios`);
    }

    return response.json() as Promise<UsersSummary>;
};

export const getUsersList = async (signal?: AbortSignal): Promise<RemoteUser[]> => {
    const url = `${getBaseUrl()}/users`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener lista de usuarios`);
    }

    const data = await response.json();
    return (data.users ?? []) as RemoteUser[];
};

export const getSystemUsers = async (signal?: AbortSignal): Promise<RemoteUser[]> => {
    const url = `${getBaseUrl()}/users/system`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener usuarios del sistema`);
    }

    const data = await response.json();
    return (data.users ?? []) as RemoteUser[];
};

export const getHumanUsers = async (signal?: AbortSignal): Promise<RemoteUser[]> => {
    const url = `${getBaseUrl()}/users/human`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener usuarios humanos`);
    }

    const data = await response.json();
    return (data.users ?? []) as RemoteUser[];
};
