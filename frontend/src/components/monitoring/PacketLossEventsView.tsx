import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Flex, Text, Title } from '@tremor/react';
import { getPacketLossEvents, getSystemInfo, type PacketLossEvent } from '../../services/api';

const DEFAULT_LOOKBACK_MS = 60 * 60 * 1000;

const createLocalDatetimeValue = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoString = (value: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }
    return parsed.toISOString();
};

const formatTimestamp = (value: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const getSeverityStyles = (maxPercent: number) => {
    if (maxPercent >= 50) {
        return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
    }
    if (maxPercent >= 20) {
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
    }
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
};

const PacketLossEventsView: React.FC = () => {
    const [hostname, setHostname] = useState<string | null>(null);
    const [loadingHost, setLoadingHost] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overrideHost, setOverrideHost] = useState('');
    const [events, setEvents] = useState<PacketLossEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [manualStart, setManualStart] = useState(() => createLocalDatetimeValue(new Date(Date.now() - DEFAULT_LOOKBACK_MS)));
    const [manualEnd, setManualEnd] = useState(() => createLocalDatetimeValue(new Date()));

    useEffect(() => {
        const controller = new AbortController();

        const fetchSystemInfo = async () => {
            try {
                setError(null);
                setLoadingHost(true);
                const data = await getSystemInfo(controller.signal);
                setHostname(data.hostname);
            } catch (err) {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');

                if (aborted) {
                    return;
                }

                console.error('Error loading system info for packet loss view', err);
                setError('No se pudo cargar el hostname del sistema.');
            } finally {
                setLoadingHost(false);
            }
        };

        fetchSystemInfo();

        return () => controller.abort();
    }, []);

    const hostToUse = overrideHost.trim() || hostname || '';

    const summary = useMemo(() => {
        if (!events.length) {
            return { max: 0, avg: 0, total: 0 };
        }
        const max = Math.max(...events.map(event => event.max_percent));
        const avg = events.reduce((sum, event) => sum + event.avg_percent, 0) / events.length;
        return { max, avg, total: events.length };
    }, [events]);

    const handleFetch = async () => {
        if (!hostToUse) {
            setError('Necesitas un hostname válido para consultar los eventos.');
            return;
        }

        const fromTs = toIsoString(manualStart);
        const toTs = toIsoString(manualEnd);

        if (!fromTs || !toTs) {
            setError('Verifica que las fechas estén bien formadas.');
            return;
        }

        if (fromTs >= toTs) {
            setError('La fecha final debe ser posterior a la inicial.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getPacketLossEvents({
                host: hostToUse,
                fromTs,
                toTs,
            });
            setEvents(data);
        } catch (err) {
            console.error('Error loading packet loss events', err);
            setError('No se pudieron cargar los eventos de packet loss.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            <Card className="space-y-6 p-6">
                <Flex alignItems="start" justifyContent="between" className="gap-6">
                    <div className="space-y-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Internet</Text>
                        <Title className="text-3xl text-zinc-100">Eventos de pérdida de paquetes</Title>
                        <Text className="text-sm text-zinc-400 max-w-3xl">
                            Consulta eventos de packet loss por rango de tiempo para el host seleccionado.
                            Revisa duración, máximos y promedios para identificar picos de degradación.
                        </Text>
                    </div>
                    <Badge color="rose" size="xs">
                        Packet loss
                    </Badge>
                </Flex>

                <Flex justifyContent="between" className="gap-4 flex-wrap">
                    <Text className="text-sm text-zinc-400">
                        {loadingHost && 'Cargando información del host…'}
                        {!loadingHost && hostname && `Host detectado: ${hostname}`}
                        {!loadingHost && !hostname && 'No se detectó ningún hostname por defecto.'}
                    </Text>
                    <div className="flex flex-col gap-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Host override</Text>
                        <input
                            id="packet-host-input"
                            type="text"
                            placeholder="DESKTOP-B5V272O"
                            className="w-56 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none"
                            value={overrideHost}
                            onChange={event => setOverrideHost(event.target.value)}
                        />
                    </div>
                </Flex>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex flex-col gap-2">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Desde</Text>
                            <input
                                type="datetime-local"
                                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none"
                                value={manualStart}
                                onChange={event => setManualStart(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Hasta</Text>
                            <input
                                type="datetime-local"
                                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none"
                                value={manualEnd}
                                onChange={event => setManualEnd(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Acciones</Text>
                            <button
                                type="button"
                                onClick={handleFetch}
                                disabled={loading}
                                className="h-[42px] rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
                            >
                                {loading ? 'Consultando…' : 'Consultar eventos'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Eventos</Text>
                            <div className="text-2xl font-semibold text-zinc-100">{summary.total}</div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Máximo observado</Text>
                            <div className="text-2xl font-semibold text-zinc-100">{summary.max.toFixed(1)}%</div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Promedio</Text>
                            <div className="text-2xl font-semibold text-zinc-100">{summary.avg.toFixed(1)}%</div>
                        </div>
                    </div>

                    {events.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-500">
                            No hay eventos en el rango seleccionado.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {events.map((event, index) => (
                                <div
                                    key={`${event.start}-${event.end}-${index}`}
                                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-1">
                                            <div className="text-sm font-semibold text-zinc-100">
                                                {formatTimestamp(event.start)} → {formatTimestamp(event.end)}
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                Duración: {event.duration_seconds.toFixed(2)}s
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityStyles(event.max_percent)}`}>
                                                Max {event.max_percent.toFixed(0)}%
                                            </span>
                                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                                                Avg {event.avg_percent.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default PacketLossEventsView;
