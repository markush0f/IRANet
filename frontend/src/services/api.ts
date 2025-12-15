import type { SystemInfo, DockerContainer } from '../types';

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
