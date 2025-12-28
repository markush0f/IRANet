import React from 'react';
import type { RemoteUser, UsersSummary } from '../../types';

interface UsersTableProps {
    users: RemoteUser[];
    loading: boolean;
    summary: UsersSummary;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, loading, summary }) => (
    <div className="flex flex-col max-h-[min(70vh,720px)]">
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-strong">
            <table className="min-w-full divide-y divide-zinc-800 text-xs">
                <thead className="bg-zinc-950 sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Username</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">UID</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">GID</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Home</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Shell</th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Type</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-400">
                                Loading users...
                            </td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-400">
                                No users found for that filter.
                            </td>
                        </tr>
                    ) : (
                        users.map(user => (
                            <tr
                                key={`${user.username}-${user.uid}`}
                                className="hover:bg-zinc-800/40 transition-colors"
                            >
                                <td className="px-4 py-3 text-zinc-200 font-semibold">{user.username}</td>
                                <td className="px-4 py-3 font-mono text-zinc-400">{user.uid}</td>
                                <td className="px-4 py-3 font-mono text-zinc-400">{user.gid}</td>
                                <td className="px-4 py-3 text-zinc-300">{user.home}</td>
                                <td className="px-4 py-3 text-zinc-300">{user.shell}</td>
                                <td className="px-4 py-3 text-zinc-300">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${user.type === 'human'
                                            ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                                            : 'bg-rose-500/10 border border-rose-500/40 text-rose-300'
                                            }`}
                                    >
                                        {user.type}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {!loading && (
            <div className="shrink-0 px-4 py-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between bg-zinc-950/30">
                <span>
                    Showing <span className="text-zinc-200 font-semibold">{users.length}</span> users
                </span>
                <span className="font-mono text-[10px]">
                    login_allowed={summary.login_allowed} · active={summary.active}
                </span>
            </div>
        )}
    </div>
);

export default UsersTable;
