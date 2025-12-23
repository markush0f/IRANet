import React from 'react';
import type { RemoteApplicationRecord } from '../../services/api';

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

interface ApplicationsLogsTableProps {
    applications: RemoteApplicationRecord[];
    loading: boolean;
    onShowLogs: (app: RemoteApplicationRecord) => void;
}

const ApplicationsLogsTable: React.FC<ApplicationsLogsTableProps> = ({ applications, loading, onShowLogs }) => {
    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 shadow-lg">
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-zinc-800">
                    <thead className="bg-zinc-950/70">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Workdir</th>
                            <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Created</th>
                            <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Log paths</th>
                            <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? (
                            <tr>
                                <td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>
                                    Loading applications...
                                </td>
                            </tr>
                        ) : applications.length === 0 ? (
                            <tr>
                                <td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>
                                    No applications with configured logs.
                                </td>
                            </tr>
                        ) : (
                            applications.map(app => (
                                <tr key={app.id ?? app.identifier} className="hover:bg-zinc-900/60 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-zinc-100">
                                        {app.name || app.identifier}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300 font-mono">
                                        {app.workdir ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 font-mono">
                                        {formatDate(app.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300">
                                        {(app.log_paths ?? []).map((path, index) => (
                                            <div key={`${app.identifier}-log-${index}`} className="text-[11px] leading-relaxed">
                                                <span className="font-mono text-zinc-200">{path}</span>
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => onShowLogs(app)}
                                            className="inline-flex items-center rounded-full border border-emerald-500/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Show logs
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApplicationsLogsTable;
