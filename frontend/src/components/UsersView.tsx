import React, { useState } from 'react';
import { MOCK_USERS } from '../mockData';

const UsersView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = MOCK_USERS.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'busy': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'inactive': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
            case 'offline': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400';
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-indigo-500/20 text-indigo-300';
            case 'editor': return 'bg-sky-500/20 text-sky-300';
            default: return 'bg-zinc-800 text-zinc-400';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">User Management</h2>
                    <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4"></div>
                    <p className="text-zinc-400 mt-2 text-sm">Manage access and view active sessions.</p>
                </div>
                <div className="w-full md:w-auto">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full md:w-64 pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-950 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 sm:text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800">
                        <thead className="bg-zinc-950/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Login</th>
                                <th scope="col" className="relative px-6 py-4">
                                    <span className="sr-only">Edit</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 relative">
                                                <img className="h-10 w-10 rounded-full border border-zinc-700 shadow-sm" src={user.avatarUrl} alt="" />
                                                <div className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-zinc-900 ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'busy' ? 'bg-amber-500' : 'bg-zinc-500'}`} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{user.name}</div>
                                                <div className="text-sm text-zinc-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full uppercase tracking-wide ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-mono">
                                        {user.lastLogin}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-400 hover:text-indigo-300 transition-colors opacity-0 group-hover:opacity-100 font-semibold">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-zinc-950/30 px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                        Showing <span className="font-semibold text-zinc-300">{filteredUsers.length}</span> users
                    </span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersView;
