import React, { useEffect, useState } from 'react';
import { MOCK_SYSTEM_INFO } from '../../mockData';
import type { SystemInfo } from '../../types';
import { getSystemInfo } from '../../services/api';
import InfoCard from './InfoCard';
import InfoRow from './InfoRow';
import SystemInfoHeader from './SystemInfoHeader';

const formatBytesToGiB = (bytes: number) => {
    return `${(bytes / (1024 ** 3)).toFixed(1)} GiB`;
};

const formatBootTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
};

const SystemInfoView: React.FC = () => {
    const [info, setInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchSystemInfo = async () => {
            try {
                setError(null);
                const data = await getSystemInfo(controller.signal);
                setInfo(data);
            } catch (e) {
                // Ignorar aborts provocados por React StrictMode / desmontaje
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }

                console.error('Error fetching system info', e);
                setError('System information could not be loaded. Showing fallback mock data.');
                setInfo(MOCK_SYSTEM_INFO);
            } finally {
                setLoading(false);
            }
        };

        fetchSystemInfo();

        return () => controller.abort();
    }, []);

    if (loading || !info) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm">
                <SystemInfoHeader loading />
            </div>
        );
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm">
            <SystemInfoHeader error={error} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <InfoCard title="Identity">
                    <InfoRow label="Hostname" value={info.hostname} />
                    <InfoRow label="FQDN" value={info.fqdn} />
                    <InfoRow label="MAC" value={info.network?.mac_address ?? 'N/A'} />
                </InfoCard>

                <InfoCard title="Operating system">
                    <InfoRow label="OS" value={info.os} />
                    <InfoRow label="Version" value={info.os_version} />
                    <InfoRow label="Kernel" value={info.kernel} />
                    <InfoRow
                        label="Distribution"
                        value={`${info.distribution.name} ${info.distribution.version} (${info.distribution.codename})`}
                    />
                </InfoCard>

                <InfoCard title="CPU and memory">
                    <InfoRow label="Architecture" value={info.architecture} />
                    <InfoRow label="Processor" value={info.processor} />
                    <InfoRow label="Physical cores" value={info.cpu?.cores_physical ?? 'N/A'} />
                    <InfoRow label="Logical cores" value={info.cpu?.cores_logical ?? 'N/A'} />
                    <InfoRow
                        label="Total memory"
                        value={info.memory ? formatBytesToGiB(info.memory.total_bytes) : 'N/A'}
                    />
                </InfoCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InfoCard title="Boot time">
                    <p className="text-[10px] text-zinc-500 mb-4">
                        Unix timestamp for system boot with a readable date.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold mb-1">Boot time (epoch)</div>
                            <div className="text-lg font-mono text-zinc-100">{info.boot_time}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold mb-1">Date and time</div>
                            <div className="text-sm font-mono text-zinc-100">{formatBootTime(info.boot_time)}</div>
                        </div>
                    </div>
                </InfoCard>

                <InfoCard
                    title="Runtime"
                    description={
                        <>
                            Data from <code className="font-mono text-[11px]">/system/info</code>. If the backend is unavailable, fallback mock data is shown.
                        </>
                    }
                >
                    <InfoRow label="Python" value={info.python_version} />
                </InfoCard>
            </div>

        </div>
    );
};

export default SystemInfoView;
