import { getBaseUrl } from './api';

export interface AlertRecord {
    id: string;
    host?: string;
    metric?: string;
    level: 'info' | 'warning' | 'critical' | 'debug' | 'error';
    value?: number;
    threshold?: number;
    status?: string;
    message: string;
    source?: string;
    timestamp?: string;
    first_seen_at?: string;
    last_seen_at?: string;
    resolved_at?: string | null;
}

export interface AlertsResponse {
    alerts: AlertRecord[];
    page: number;
    page_size: number;
    total: number;
}

type AlertPayload = Partial<AlertRecord> & Record<string, unknown>;

const fallbackAlerts: AlertRecord[] = [
    {
        id: 'fallback-1',
        level: 'info',
        message: 'No hay alertas recientes. Este es un mensaje de respaldo.',
        source: 'Sistema local',
        timestamp: new Date().toISOString(),
    },
];

const coerceLevel = (value: unknown): AlertRecord['level'] => {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'warn') return 'warning';
        if (normalized === 'err') return 'error';
        if (normalized === 'crit') return 'critical';
        if (normalized === 'information') return 'info';
        if (normalized === 'fatal') return 'critical';
        if (normalized === 'trace') return 'debug';
        if (['info', 'warning', 'critical', 'debug', 'error'].includes(normalized)) {
            return normalized as AlertRecord['level'];
        }
    }
    return 'info';
};

const coerceAlertRecord = (raw: unknown, index: number): AlertRecord => {
    const payload = (raw && typeof raw === 'object' ? raw : {}) as AlertPayload;
    const id =
        (payload.id as string | undefined) ??
        (payload.alert_id as string | undefined) ??
        (payload.uuid as string | undefined) ??
        `${payload.timestamp ?? payload.first_seen_at ?? payload.last_seen_at ?? 'alert'}-${index}`;

    const message =
        (payload.message as string | undefined) ??
        (payload.alert as string | undefined) ??
        (payload.description as string | undefined) ??
        'Alerta recibida.';

    return {
        id,
        level: coerceLevel(payload.level ?? payload.severity ?? payload.priority),
        message,
        host: (payload.host as string | undefined) ?? (payload.hostname as string | undefined),
        metric: (payload.metric as string | undefined) ?? (payload.rule as string | undefined),
        value: payload.value as number | undefined,
        threshold: payload.threshold as number | undefined,
        status: payload.status as string | undefined,
        source: (payload.source as string | undefined) ?? (payload.origin as string | undefined),
        timestamp: payload.timestamp as string | undefined,
        first_seen_at: payload.first_seen_at as string | undefined,
        last_seen_at: payload.last_seen_at as string | undefined,
        resolved_at: payload.resolved_at as string | null | undefined,
    };
};

const normalizeAlertsResponse = (
    body: unknown,
    page: number,
    pageSize: number
): AlertsResponse => {
    if (!body) {
        return {
            alerts: fallbackAlerts,
            page,
            page_size: pageSize,
            total: fallbackAlerts.length,
        };
    }

    let rawAlerts: unknown[] = [];
    if (Array.isArray(body)) {
        rawAlerts = body;
    } else if (typeof body === 'object' && body !== null) {
        const payload = body as Record<string, unknown>;
        if (Array.isArray(payload.alerts)) {
            rawAlerts = payload.alerts;
        } else if (Array.isArray(payload.items)) {
            rawAlerts = payload.items;
        } else if (Array.isArray(payload.results)) {
            rawAlerts = payload.results;
        } else if (Array.isArray(payload.data)) {
            rawAlerts = payload.data;
        } else if (
            payload.data &&
            typeof payload.data === 'object' &&
            Array.isArray((payload.data as Record<string, unknown>).alerts)
        ) {
            rawAlerts = (payload.data as Record<string, unknown>).alerts as unknown[];
        }
    }

    const alerts = rawAlerts.map(coerceAlertRecord);
    const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    const total =
        (typeof payload.total === 'number' ? payload.total : undefined) ??
        (typeof payload.total_count === 'number' ? payload.total_count : undefined) ??
        (typeof payload.count === 'number' ? payload.count : undefined) ??
        alerts.length;
    const responsePage =
        (typeof payload.page === 'number' ? payload.page : undefined) ??
        (typeof payload.current_page === 'number' ? payload.current_page : undefined) ??
        page;
    const responsePageSize =
        (typeof payload.page_size === 'number' ? payload.page_size : undefined) ??
        (typeof payload.per_page === 'number' ? payload.per_page : undefined) ??
        (typeof payload.pageSize === 'number' ? payload.pageSize : undefined) ??
        pageSize;

    return {
        alerts,
        page: responsePage,
        page_size: responsePageSize,
        total,
    };
};

export const fetchAlerts = async (
    page = 1,
    pageSize = 50,
    signal?: AbortSignal
): Promise<AlertsResponse> => {
    const url = new URL(`${getBaseUrl()}/alerts`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));

    const response = await fetch(url.toString(), {
        signal,
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} al obtener alertas`);
    }

    const body = await response.json();
    return normalizeAlertsResponse(body, page, pageSize);
};
