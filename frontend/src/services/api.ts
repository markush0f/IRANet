import type {
    ApplicationDiscoveryDetails,
    SystemInfo,
    DockerContainer,
    ProcessesSnapshot,
    UsersSummary,
    RemoteUser,
    MetricSample,
    ApplicationMetricSeriesResponse,
    ApplicationRuntimeResponse,
    SystemDiskResponse,
    DiskProcessesResponse,
    DiskTotalResponse,
    SystemdServiceSimple,
    SystemPackagesResponse,
    SystemPackageHistoryResponse,
    SystemPackageInstalledAtResponse,
    DatabaseClassification,
    LogEvent,
    ExtensionRecord,
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

export const getSystemdServicesSimple = async (
    limit = 4,
    signal?: AbortSignal
): Promise<SystemdServiceSimple[]> => {
    const url = `${getBaseUrl()}/services/systemd/simple?limit=${encodeURIComponent(limit)}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener servicios systemd`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return data as SystemdServiceSimple[];
    }
    return [];
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
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const url = `${getBaseUrl()}/processes/snapshot?limit=${encodeURIComponent(safeLimit)}`;
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

export const getDiskProcesses = async (
    mountpoint: string,
    limit = 10,
    signal?: AbortSignal
): Promise<DiskProcessesResponse> => {
    const params = new URLSearchParams();
    params.set('mountpoint', mountpoint);
    params.set('limit', String(limit));
    const url = `${getBaseUrl()}/system/disk/processes?${params.toString()}`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener procesos de disco`);
    }

    return response.json() as Promise<DiskProcessesResponse>;
};

export const getSystemDiskTotal = async (signal?: AbortSignal): Promise<DiskTotalResponse> => {
    const url = `${getBaseUrl()}/system/disk/total`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener /system/disk/total`);
    }

    return response.json() as Promise<DiskTotalResponse>;
};

export interface GetSystemPackagesParams {
    page?: number;
    pageSize?: number;
    query?: string;
    sortBy?: 'name' | 'version' | 'arch';
    sortDir?: 'asc' | 'desc';
    signal?: AbortSignal;
}

export const getSystemPackages = async ({
    page = 1,
    pageSize = 50,
    query = '',
    sortBy = 'name',
    sortDir = 'asc',
    signal,
}: GetSystemPackagesParams = {}): Promise<SystemPackagesResponse> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    if (query.trim()) {
        params.set('q', query.trim());
    }
    params.set('sort_by', sortBy);
    params.set('sort_dir', sortDir);

    const url = `${getBaseUrl()}/system/packages/?${params.toString()}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener paquetes del sistema`);
    }

    return response.json() as Promise<SystemPackagesResponse>;
};

export interface GetInstalledPackagesParams {
    page?: number;
    pageSize?: number;
    query?: string;
    sortBy?: 'name' | 'version' | 'arch';
    sortDir?: 'asc' | 'desc';
    signal?: AbortSignal;
}

export const getInstalledPackages = async ({
    page = 1,
    pageSize = 50,
    query = '',
    sortBy = 'name',
    sortDir = 'asc',
    signal,
}: GetInstalledPackagesParams = {}): Promise<SystemPackagesResponse> => {
    const params = new URLSearchParams();
    if (query.trim()) {
        params.set('q', query.trim());
    } else {
        params.set('page', String(page));
        params.set('page_size', String(pageSize));
    }
    params.set('sort_by', sortBy);
    params.set('sort_dir', sortDir);

    const url = `${getBaseUrl()}/system/packages?${params.toString()}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener paquetes`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return { page: 1, page_size: data.length, total: data.length, items: data } as SystemPackagesResponse;
    }
    return data as SystemPackagesResponse;
};

export interface GetPackageHistoryParams {
    packageName?: string;
    action?: 'install' | 'upgrade' | 'remove' | 'all';
    dateFrom?: string;
    dateTo?: string;
    sortDir?: 'asc' | 'desc';
    signal?: AbortSignal;
}

export const getPackageHistory = async ({
    packageName,
    action,
    dateFrom,
    dateTo,
    sortDir = 'desc',
    signal,
}: GetPackageHistoryParams = {}): Promise<SystemPackageHistoryResponse> => {
    const params = new URLSearchParams();
    if (packageName) params.set('package', packageName);
    if (action && action !== 'all') params.set('action', action);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (sortDir) params.set('sort_dir', sortDir);

    const url = `${getBaseUrl()}/system/packages/history?${params.toString()}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener historial de paquetes`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return { items: data } as SystemPackageHistoryResponse;
    }
    return data as SystemPackageHistoryResponse;
};

export const getPackageInstalledAt = async (
    packageName: string,
    signal?: AbortSignal
): Promise<SystemPackageInstalledAtResponse> => {
    const url = `${getBaseUrl()}/system/packages/history/installed-at/${encodeURIComponent(packageName)}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener fecha de instalacion`);
    }

    const data = await response.json();
    if (typeof data === 'string') {
        return { installed_at: data };
    }
    return data as SystemPackageInstalledAtResponse;
};

export const getDatabaseClassification = async (signal?: AbortSignal): Promise<DatabaseClassification[]> => {
    const url = `${getBaseUrl()}/services/clasification/databases`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener bases de datos`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return data as DatabaseClassification[];
    }
    return [];
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
        throw new Error(`HTTP ${response.status} while fetching metrics`);
    }

    const data = await response.json();
    console.log(data);
    if (!Array.isArray(data)) {
        return [];
    }

    return data as MetricSample[];
};

export interface ApplicationMetricSeriesRequest {
    applicationId: string;
    tsFrom?: string;
    tsTo?: string;
    stepSeconds?: number;
    signal?: AbortSignal;
}

const normalizeApplicationMetricPoint = (entry: unknown): [string, number | string | null] | null => {
    if (!Array.isArray(entry) || entry.length < 2) return null;
    const ts = entry[0];
    const value = entry[1];
    if (typeof ts !== 'string') return null;
    if (typeof value === 'number') return [ts, value];
    if (typeof value === 'string') return [ts, value];
    if (value === null) return [ts, null];
    return null;
};

export const getApplicationMetricSeries = async ({
    applicationId,
    tsFrom,
    tsTo,
    stepSeconds,
    signal,
}: ApplicationMetricSeriesRequest): Promise<ApplicationMetricSeriesResponse> => {
    const params = new URLSearchParams();
    if (tsFrom) params.set('ts_from', tsFrom);
    if (tsTo) params.set('ts_to', tsTo);
    if (typeof stepSeconds === 'number' && Number.isFinite(stepSeconds)) {
        params.set('step_seconds', String(stepSeconds));
    }

    const url = `${getBaseUrl()}/applications/${encodeURIComponent(applicationId)}/metrics/series?${params.toString()}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while fetching application metrics series`);
    }

    const data = (await response.json()) as unknown;
    if (!data || typeof data !== 'object') {
        return {
            application_id: applicationId,
            range: { from: tsFrom ?? '', to: tsTo ?? '', step_seconds: stepSeconds ?? 0, max_range_seconds: 0 },
            series: {},
        };
    }

    const seriesRaw = (data as any).series;
    const normalizedSeries: Record<string, [string, number | string | null][]> = {};
    if (seriesRaw && typeof seriesRaw === 'object') {
        for (const [key, value] of Object.entries(seriesRaw as Record<string, unknown>)) {
            if (!Array.isArray(value)) continue;
            normalizedSeries[key] = value
                .map(normalizeApplicationMetricPoint)
                .filter((point): point is [string, number | string | null] => Boolean(point));
        }
    }

    const rangeRaw = (data as any).range;
    const range = rangeRaw && typeof rangeRaw === 'object'
        ? {
            from: typeof (rangeRaw as any).from === 'string' ? (rangeRaw as any).from : (tsFrom ?? ''),
            to: typeof (rangeRaw as any).to === 'string' ? (rangeRaw as any).to : (tsTo ?? ''),
            step_seconds: Number((rangeRaw as any).step_seconds ?? stepSeconds ?? 0),
            max_range_seconds: Number((rangeRaw as any).max_range_seconds ?? 0),
        }
        : { from: tsFrom ?? '', to: tsTo ?? '', step_seconds: stepSeconds ?? 0, max_range_seconds: 0 };

    return {
        application_id: typeof (data as any).application_id === 'string' ? (data as any).application_id : applicationId,
        range,
        series: normalizedSeries,
    };
};

export const getApplicationRuntime = async (
    applicationId: string,
    signal?: AbortSignal
): Promise<ApplicationRuntimeResponse> => {
    const url = `${getBaseUrl()}/applications/${encodeURIComponent(applicationId)}/runtime`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while fetching application runtime`);
    }

    return response.json() as Promise<ApplicationRuntimeResponse>;
};

export interface CreateApplicationPayload {
    cwd: string;
    name: string;
    log_base_paths?: string[];
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
        throw new Error(`HTTP ${response.status} while creating application`);
    }

    return response.json();
};

export const deleteApplication = async (applicationId: string, signal?: AbortSignal): Promise<void> => {
    const url = `${getBaseUrl()}/applications/${encodeURIComponent(applicationId)}`;
    const response = await fetch(url, { method: 'DELETE', signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while deleting application`);
    }
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
    const url = `${getBaseUrl()}/applications/all/list`;
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
        throw new Error(`HTTP ${response.status} while fetching applications with logs`);
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

export const getExtensions = async (signal?: AbortSignal): Promise<ExtensionRecord[]> => {
    const url = `${getBaseUrl()}/extensions/all`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener extensiones`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return data as ExtensionRecord[];
    }
    if (data && typeof data === 'object' && Array.isArray((data as any).extensions)) {
        return (data as any).extensions as ExtensionRecord[];
    }
    return [];
};

export const enableExtension = async (extensionId: string, signal?: AbortSignal): Promise<ExtensionRecord> => {
    const url = `${getBaseUrl()}/extensions/${encodeURIComponent(extensionId)}/enable`;
    const response = await fetch(url, { method: 'PUT', signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al habilitar extension`);
    }

    return response.json() as Promise<ExtensionRecord>;
};

export const disableExtension = async (extensionId: string, signal?: AbortSignal): Promise<ExtensionRecord> => {
    const url = `${getBaseUrl()}/extensions/${encodeURIComponent(extensionId)}/disable`;
    const response = await fetch(url, { method: 'PUT', signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al deshabilitar extension`);
    }

    return response.json() as Promise<ExtensionRecord>;
};

export interface ChatRecord {
    id: string;
    title?: string | null;
    server_id?: string | null;
    created_at?: string | null;
}

export interface ChatMessageRecord {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string | null;
}

export interface ChatWithMessages extends ChatRecord {
    page: number;
    page_size: number;
    messages: ChatMessageRecord[];
}

export interface ChatAskResponse {
    answer?: string;
    response?: string;
    message?: string;
    result?: unknown;
}

export interface CreateChatPayload {
    title?: string | null;
    server_id?: string | null;
}

export const createChat = async (
    payload: CreateChatPayload,
    signal?: AbortSignal
): Promise<ChatRecord> => {
    const url = `${getBaseUrl()}/chat/create`;
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
        throw new Error(`HTTP ${response.status} al crear chat`);
    }

    return response.json() as Promise<ChatRecord>;
};

export const listChats = async (signal?: AbortSignal): Promise<ChatRecord[]> => {
    const url = `${getBaseUrl()}/chat/`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al listar chats`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return data as ChatRecord[];
    }
    return [];
};

export const updateChatTitle = async (
    chatId: string,
    title: string | null,
    signal?: AbortSignal
): Promise<ChatRecord> => {
    const url = `${getBaseUrl()}/chat/${encodeURIComponent(chatId)}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
        signal,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al actualizar chat`);
    }

    return response.json() as Promise<ChatRecord>;
};

export const deleteChat = async (chatId: string, signal?: AbortSignal): Promise<void> => {
    const url = `${getBaseUrl()}/chat/${encodeURIComponent(chatId)}`;
    const response = await fetch(url, { method: 'DELETE', signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al eliminar chat`);
    }
};

export const getChat = async (
    chatId: string,
    page = 1,
    signal?: AbortSignal
): Promise<ChatWithMessages> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    const url = `${getBaseUrl()}/chat/${encodeURIComponent(chatId)}?${params.toString()}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener chat`);
    }

    return response.json() as Promise<ChatWithMessages>;
};

export const askChat = async (
    chatId: string,
    question: string,
    signal?: AbortSignal
): Promise<string> => {
    const url = `${getBaseUrl()}/chat/ask`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id: chatId, question }),
        signal,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al preguntar al chatbot`);
    }

    const data = (await response.json()) as ChatAskResponse | string;
    if (typeof data === 'string') {
        return data;
    }
    if (data.answer || data.response || data.message) {
        return data.answer ?? data.response ?? data.message ?? 'No response';
    }
    if ('result' in data) {
        return JSON.stringify(data.result, null, 2);
    }
    return JSON.stringify(data, null, 2);
};

export interface ApplicationLogFilesResponse {
    page: number;
    page_size: number;
    total: number;
    items: string[];
}

const normalizeLogFilePath = (entry: unknown): string | null => {
    if (typeof entry === 'string') return entry;
    if (!entry || typeof entry !== 'object') return null;
    const candidate = (entry as any).file_path ?? (entry as any).path ?? (entry as any).name;
    return typeof candidate === 'string' ? candidate : null;
};

export const getApplicationLogFiles = async (
    applicationId: string,
    page = 1,
    pageSize = 20,
    signal?: AbortSignal
): Promise<ApplicationLogFilesResponse> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', String(pageSize));

    const url = `${getBaseUrl()}/logs/applications/${applicationId}/files?${params.toString()}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while fetching application log files`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        const items = data.map(normalizeLogFilePath).filter((value): value is string => Boolean(value));
        return { page, page_size: items.length, total: items.length, items };
    }
    if (data && typeof data === 'object' && Array.isArray((data as any).items)) {
        const items = (data as any).items
            .map(normalizeLogFilePath)
            .filter((value: string | null): value is string => Boolean(value));
        return {
            page: Number((data as any).page ?? page),
            page_size: Number((data as any).page_size ?? items.length),
            total: Number((data as any).total ?? items.length),
            items,
        };
    }

    return { page, page_size: 0, total: 0, items: [] };
};

const normalizeHistoryEntry = (entry: unknown, fallbackType: LogEvent['type']): LogEvent | null => {
    if (typeof entry === 'string') {
        return {
            path: '',
            message: entry,
            type: fallbackType,
        };
    }
    if (!entry || typeof entry !== 'object') return null;
    if ((entry as any).message && typeof (entry as any).message === 'string') {
        return {
            path: typeof (entry as any).path === 'string' ? (entry as any).path : '',
            message: (entry as any).message,
            level: (entry as any).level,
            timestamp: (entry as any).timestamp ?? (entry as any).time ?? (entry as any).ts,
            context: (entry as any).context,
            type: (entry as any).type ?? fallbackType,
        } as LogEvent;
    }
    const candidate = (entry as any).line ?? (entry as any).text;
    if (typeof candidate === 'string') {
        return {
            path: typeof (entry as any).path === 'string' ? (entry as any).path : '',
            message: candidate,
            type: fallbackType,
        };
    }
    return null;
};

export const getApplicationLogFileHistory = async (
    applicationId: string,
    filePath: string,
    limit = 200,
    signal?: AbortSignal
): Promise<LogEvent[]> => {
    const params = new URLSearchParams();
    params.set('file_path', filePath);
    params.set('limit', String(limit));

    const url = `${getBaseUrl()}/logs/applications/${applicationId}/files/history?${params.toString()}`;
    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while fetching application log history`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return data
            .map(entry => normalizeHistoryEntry(entry, 'history'))
            .filter((value): value is LogEvent => Boolean(value));
    }
    if (data && typeof data === 'object') {
        const raw = (data as any).items ?? (data as any).lines ?? (data as any).entries;
        if (Array.isArray(raw)) {
            return raw
                .map(entry => normalizeHistoryEntry(entry, 'history'))
                .filter((value: LogEvent | null): value is LogEvent => Boolean(value));
        }
    }

    return [];
};

export const rescanApplicationLogs = async (
    applicationId: string,
    signal?: AbortSignal
): Promise<{ added: number }> => {
    const url = `${getBaseUrl()}/logs/applications/${applicationId}/logs/rescan`;
    const response = await fetch(url, {
        method: 'POST',
        signal,
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while rescanning application logs`);
    }

    return response.json() as Promise<{ added: number }>;
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
