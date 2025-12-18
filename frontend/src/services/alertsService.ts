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

const fallbackAlerts: AlertRecord[] = [
    {
        id: 'fallback-1',
        level: 'info',
        message: 'No hay alertas recientes. Este es un mensaje de respaldo.',
        source: 'Sistema local',
        timestamp: new Date().toISOString(),
    },
];

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
    if (!body) {
        return {
            alerts: fallbackAlerts,
            page,
            page_size: pageSize,
            total: fallbackAlerts.length,
        };
    }

    return {
        alerts: (body.alerts ?? []) as AlertRecord[],
        page: typeof body.page === 'number' ? body.page : page,
        page_size: typeof body.page_size === 'number' ? body.page_size : pageSize,
        total: typeof body.total === 'number' ? body.total : (body.alerts ?? fallbackAlerts).length,
    };
};
