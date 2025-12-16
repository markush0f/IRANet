import React, { useEffect, useMemo, useState } from 'react';
import { MOCK_USERS } from '../../mockData';
import type { RemoteUser, UsersSummary } from '../../types';
import { getUsersList, getUsersSummary, getHumanUsers, getSystemUsers } from '../../services/api';

const fallbackSummary: UsersSummary = {
    total: MOCK_USERS.length,
    human: MOCK_USERS.filter(u => u.role !== 'viewer').length,
    system: MOCK_USERS.filter(u => u.role === 'viewer').length,
    login_allowed: 3,
    active: 0,
    active_users: []
};

const fallbackUsers: RemoteUser[] = MOCK_USERS.map((user, index) => ({
    username: user.email.split('@')[0],
    uid: index + 1000,
    gid: index + 1000,
    home: `/home/${user.email.split('@')[0]}`,
    shell: '/bin/bash',
    type: user.role === 'viewer' ? 'system' : 'human'
}));

const summaryCards = [
    { key: 'total', label: 'Usuarios', color: 'text-indigo-300' },
    { key: 'human', label: 'Humanos', color: 'text-emerald-300' },
    { key: 'system', label: 'Sistema', color: 'text-amber-300' },
    { key: 'active', label: 'Activos', color: 'text-rose-300' },
];

const UsersView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<RemoteUser[]>(fallbackUsers);
    const [summary, setSummary] = useState<UsersSummary>(fallbackSummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<'all' | 'human' | 'system'>('all');

    const fetchUsersByType = async (signal?: AbortSignal) => {
        switch (typeFilter) {
            case 'human':
                return getHumanUsers(signal);
            case 'system':
                return getSystemUsers(signal);
            default:
                return getUsersList(signal);
        }
    };

    const fallbackUsersByType = (type: typeof typeFilter) => {
        if (type === 'all') return fallbackUsers;
        return fallbackUsers.filter(u => u.type === type);
    };

    useEffect(() => {
        const controller = new AbortController();

        const fetchSummary = async () => {
            try {
                const summaryData = await getUsersSummary(controller.signal);
                setSummary(summaryData);
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                console.error('Error fetching users summary', e);
                setError('No se pudo cargar el resumen de usuarios. Mostrando datos de respaldo.');
                setSummary(fallbackSummary);
            }
        };

        fetchSummary();

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const fetchUsers = async () => {
            try {
                setError(null);
                setLoading(true);
                const usersData = await fetchUsersByType(controller.signal);
                setUsers(usersData);
            } catch (e) {
                if (e instanceof DOMException && e.name === 'AbortError') return;
                console.error('Error fetching users data', e);
                setError('No se pudo cargar usuarios. Usando datos de respaldo.');
                setUsers(fallbackUsersByType(typeFilter));
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();

        return () => controller.abort();
    }, [typeFilter]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchUsersData = async () => {
            try {
                setError(null);
                setLoading(true);
                const [summaryData, usersData] = await Promise.all([
                    getUsersSummary(controller.signal),
                    getUsersList(controller.signal),
                ]);
                setSummary(summaryData);
                setUsers(usersData);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching users data', e);
                setError('No se pudo cargar información de usuarios, usando datos de respaldo.');
                setSummary(fallbackSummary);
                setUsers(fallbackUsers);
            } finally {
                setLoading(false);
            }
        };

        fetchUsersData();

        return () => controller.abort();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const q = searchTerm.toLowerCase();
        return users.filter(user =>
            user.username.toLowerCase().includes(q) ||
            user.home.toLowerCase().includes(q) ||
            user.shell.toLowerCase().includes(q) ||
            user.type.toLowerCase().includes(q)
        );
    }, [searchTerm, users]);

    return (
        <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                        <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">User Directory</h2>
                        <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4"></div>
                        <p className="text-zinc-400 mt-2 text-sm">
                            Controla los usuarios conocidos por el sistema y revisa el resumen actualizado desde el backend.
                        </p>
                        {error && (
                            <p className="mt-2 text-xs text-amber-400">{error}</p>
                        )}
                    </div>
                    <div className="w-full md:w-64">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar usuario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {summaryCards.map(card => (
                    <div key={card.key} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                        <p className={`text-xs uppercase tracking-wide ${card.color}`}>{card.label}</p>
                        <p className="text-2xl font-semibold text-zinc-100">
                            {summary[card.key as keyof UsersSummary] ?? 0}
                        </p>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                {(['all', 'human', 'system'] as const).map(option => (
                    <button
                        key={option}
                        onClick={() => setTypeFilter(option)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                            typeFilter === option
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                    >
                        {option === 'all' ? 'Todos' : option === 'human' ? 'Humanos' : 'Sistema'}
                    </button>
                ))}
                <span className="text-[11px] text-zinc-400 font-mono">
                    Filtrando <strong>{typeFilter}</strong>
                </span>
            </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800 text-xs">
                        <thead className="bg-zinc-950/70">
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
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-400">
                                        No se encontraron usuarios con ese filtro.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={`${user.username}-${user.uid}`} className="hover:bg-zinc-800/40 transition-colors">
                                        <td className="px-4 py-3 text-zinc-200 font-semibold">{user.username}</td>
                                        <td className="px-4 py-3 font-mono text-zinc-400">{user.uid}</td>
                                        <td className="px-4 py-3 font-mono text-zinc-400">{user.gid}</td>
                                        <td className="px-4 py-3 text-zinc-300">{user.home}</td>
                                        <td className="px-4 py-3 text-zinc-300">{user.shell}</td>
                                        <td className="px-4 py-3 text-zinc-300">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                                                user.type === 'human'
                                                    ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                                                    : 'bg-rose-500/10 border border-rose-500/40 text-rose-300'
                                            }`}>
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
                    <div className="px-4 py-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex justify-between items-center">
                        <span>
                            Mostrando <span className="text-zinc-200 font-semibold">{filteredUsers.length}</span> usuarios
                        </span>
                        <span className="font-mono text-[10px]">
                            login_allowed={summary.login_allowed} · active={summary.active}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersView;
