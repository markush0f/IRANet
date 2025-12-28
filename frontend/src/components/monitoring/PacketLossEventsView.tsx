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

const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '—';
    if (seconds < 0.001) return '0 ms';
    if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
    if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 2 : 1)} s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
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
                setError('System hostname could not be loaded.');
            } finally {
                setLoadingHost(false);
            }
        };

        fetchSystemInfo();

        return () => controller.abort();
    }, []);

    const hostToUse = hostname || '';

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
            setError('Host information is not available yet.');
            return;
        }

        const fromTs = toIsoString(manualStart);
        const toTs = toIsoString(manualEnd);

        if (!fromTs || !toTs) {
            setError('Please verify the dates are valid.');
            return;
        }

        if (fromTs >= toTs) {
            setError('The end date must be after the start date.');
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
            setError('Packet loss events could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex-1 min-h-0 px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm flex flex-col">
            <Card className="space-y-3 p-3 sm:p-4 flex-1 min-h-0 flex flex-col">
                <Flex alignItems="start" justifyContent="between" className="gap-4 flex-wrap">
                    <div className="space-y-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Internet</Text>
                        <Title className="text-2xl sm:text-3xl text-zinc-100">Packet loss events</Title>
                        <Text className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                            Query packet loss events over a time range for the selected host.
                            Review duration, max, and average to identify degradation spikes.
                        </Text>
                    </div>
                    <Badge color="rose" size="xs">
                        Packet loss
                    </Badge>
                </Flex>

                {loadingHost && (
                    <Text className="text-xs text-zinc-500 leading-relaxed">
                        Loading…
                    </Text>
                )}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4 shadow-xl flex-1 min-h-0 flex flex-col gap-2">
                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="flex flex-col gap-1">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">From</Text>
                            <input
                                type="datetime-local"
                                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none"
                                value={manualStart}
                                onChange={event => setManualStart(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">To</Text>
                            <input
                                type="datetime-local"
                                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none"
                                value={manualEnd}
                                onChange={event => setManualEnd(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Actions</Text>
                            <button
                                type="button"
                                onClick={handleFetch}
                                disabled={loading}
                                className="h-[38px] rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
                            >
                                {loading ? 'Querying…' : 'Query events'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Events</Text>
                            <div className="text-2xl font-semibold text-zinc-100">{summary.total}</div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Max observed</Text>
                            <div className="text-2xl font-semibold text-zinc-100">{summary.max.toFixed(1)}%</div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                            <Text className="text-xs uppercase tracking-wide text-zinc-500">Average</Text>
                            <div className="text-2xl font-semibold text-zinc-100">{summary.avg.toFixed(1)}%</div>
                        </div>
                    </div>

                    {events.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center text-xs text-zinc-400 leading-relaxed">
                            No events in the selected range.
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-strong space-y-1">
                            {events.map((event, index) => (
                                <div
                                    key={`${event.start}-${event.end}-${index}`}
	                                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
	                                >
	                                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
	                                        <div className="space-y-1">
	                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
	                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
	                                                    Start
	                                                </span>
	                                                <span className="font-mono text-sm font-semibold text-zinc-100">
	                                                    {formatTimestamp(event.start)}
	                                                </span>
	                                                <span className="text-zinc-600">→</span>
	                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
	                                                    End
	                                                </span>
	                                                <span className="font-mono text-sm font-semibold text-zinc-100">
	                                                    {formatTimestamp(event.end)}
	                                                </span>
	                                            </div>
	                                            <div className="flex flex-wrap items-center gap-2">
	                                                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-zinc-200">
	                                                    Duration <span className="font-mono">{formatDuration(event.duration_seconds)}</span>
	                                                </span>
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
