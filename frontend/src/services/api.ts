import type {
    ApplicationDiscoveryDetails,
    SystemInfo,
    DockerContainer,
    ProcessesSnapshot,
    UsersSummary,
    RemoteUser,
    MetricSample,
    SystemDiskResponse,
} from '../types';

export const getBaseUrl = (): string => {
    const base =
        (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
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

export const getApplicationDiscoveryDetails = async (
    cwd: string,
    minEtimesSeconds = 15,
    signal?: AbortSignal
): Promise<ApplicationDiscoveryDetails> => {
    const params = new URLSearchParams();
    params.set('cwd', cwd);
    params.set('min_etimes_seconds', String(minEtimesSeconds));

    const url = `${getBaseUrl()}/applications/discover/details?${params.toString()}`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener detalles del descubrimiento`);
    }

    return (await response.json()) as ApplicationDiscoveryDetails;
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

export const getSystemDisk = async (signal?: AbortSignal): Promise<SystemDiskResponse> => {
    const url = `${getBaseUrl()}/system/disk`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener /system/disk`);
    }

    return response.json() as Promise<SystemDiskResponse>;
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

export interface MetricSeriesRequest {
    metric: string;
    host?: string;
    fromTs?: string;
    toTs?: string;
    signal?: AbortSignal;
}

export const getMetricSeries = async ({
    metric,
    host,
    fromTs,
    toTs,
    signal,
}: MetricSeriesRequest): Promise<MetricSample[]> => {
    const params = new URLSearchParams();
    params.set('metric', metric);
    if (host) params.set('host', host);
    if (fromTs) {
        params.set('from_ts', fromTs);
        params.set('ts_from', fromTs);
    }
    if (toTs) {
        params.set('to_ts', toTs);
        params.set('ts_to', toTs);
    }

    const url = `${getBaseUrl()}/metrics/series?${params.toString()}`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener métricas`);
    }

    const data = await response.json();
    console.log(data);
    if (!Array.isArray(data)) {
        return [];
    }

    return data as MetricSample[];
};

export interface CreateApplicationPayload {
    cwd: string;
    name: string;
    log_paths: string[];
}

export const createApplication = async (
    payload: CreateApplicationPayload,
    signal?: AbortSignal
) => {
    const url = `${getBaseUrl()}/applications`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al crear aplicación`);
    }

    return response.json();
};

export interface RemoteApplicationRecord {
    id: string;
    kind: string;
    name: string;
    workdir: string;
    identifier: string;
    status: string;
    enabled: boolean;
    created_at?: string | null;
    last_seen_at?: string | null;
    pid?: number | null;
    port?: number | null;
    file_path?: string | null;
    log_paths?: string[] | null;
}

export const getApplicationsList = async (signal?: AbortSignal): Promise<RemoteApplicationRecord[]> => {
    const url = `${getBaseUrl()}/applications/list`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener aplicaciones`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return data as RemoteApplicationRecord[];
    }
    if (data && typeof data === 'object' && Array.isArray((data as any).applications)) {
        return (data as any).applications as RemoteApplicationRecord[];
    }
    return [];
};

export const getApplicationsLogsList = async (signal?: AbortSignal): Promise<RemoteApplicationRecord[]> => {
    const url = `${getBaseUrl()}/applications/list/logs`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener aplicaciones con logs`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return data as RemoteApplicationRecord[];
    }
    if (data && typeof data === 'object' && Array.isArray((data as any).applications)) {
        return (data as any).applications as RemoteApplicationRecord[];
    }
    return [];
};

export interface PacketLossEvent {
    start: string;
    end: string;
    duration_seconds: number;
    max_percent: number;
    avg_percent: number;
}

interface PacketLossEventsRequest {
    host: string;
    fromTs?: string;
    toTs?: string;
    signal?: AbortSignal;
}

export const getPacketLossEvents = async ({
    host,
    fromTs,
    toTs,
    signal,
}: PacketLossEventsRequest): Promise<PacketLossEvent[]> => {
    const params = new URLSearchParams();
    params.set('host', host);
    if (fromTs) params.set('ts_from', fromTs);
    if (toTs) params.set('ts_to', toTs);

    const url = `${getBaseUrl()}/internet/packet-loss/events?${params.toString()}`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener eventos de packet loss`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return data as PacketLossEvent[];
    }
    if (data && typeof data === 'object' && Array.isArray((data as any).events)) {
        return (data as any).events as PacketLossEvent[];
    }
    return [];
};
