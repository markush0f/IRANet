import React, { useState } from 'react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    active?: boolean;
}

interface SidebarProps {
    activeView: string;
    onNavigate: (viewId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [servicesOpen, setServicesOpen] = useState(true);

    const navItems: NavItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            id: 'system',
            label: 'System Info',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M6 10h12M6 6h12M6 14h12M5 6l1-3h12l1 3" />
                </svg>
            )
        },
        {
            id: 'cpu-metrics',
            label: 'CPU Metrics',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h7m-7 6h16M12 6v12" />
                </svg>
            )
        },
        {
            id: 'services',
            label: 'Services',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
            )
        },
        {
            id: 'performance',
            label: 'Performance',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            id: 'processes',
            label: 'Processes',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6M4 6h16M4 10h16M4 14h16M5 20h14a1 1 0 001-1v-3H4v3a1 1 0 001 1z" />
                </svg>
            )
        },
        {
            id: 'users',
            label: 'Users',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            id: 'deployments',
            label: 'Deployments',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )
        },
        {
            id: 'logs',
            label: 'Global Logs',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        }
    ];

    return (
        <div className={`h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} sticky top-0`}>
            {/* Header / Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-zinc-900 justify-between">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-zinc-100 tracking-tight">IRANet</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-full flex justify-center">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors hidden lg:block"
                >
                    <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map(item => (
                    <React.Fragment key={item.id}>
                        <button
                            onClick={() => {
                                if (item.id === 'services') {
                                    setServicesOpen(prev => !prev);
                                }
                                onNavigate(item.id);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                                ${activeView === item.id
                                    ? 'bg-indigo-600/10 text-indigo-400'
                                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                                }
                                ${isCollapsed ? 'justify-center' : ''}
                            `}
                        >
                            <div className={`${activeView === item.id ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                {item.icon}
                            </div>

                            {!isCollapsed && (
                                <span className="font-medium text-sm flex-1 flex items-center justify-between">
                                    <span>{item.label}</span>
                                    {item.id === 'services' && (
                                        <svg
                                            className={`w-3 h-3 text-zinc-500 ml-1 transition-transform ${servicesOpen ? 'rotate-90' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </span>
                            )}

                            {activeView === item.id && !isCollapsed && (
                                <div className="absolute right-2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
                            )}
                        </button>

                        {!isCollapsed && item.id === 'services' && servicesOpen && (
                            <button
                                onClick={() => onNavigate('docker')}
                                className={`ml-8 mt-1 w-[calc(100%-2rem)] flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                                    ${activeView === 'docker'
                                        ? 'bg-indigo-600/10 text-indigo-400'
                                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                                    }
                                `}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M5 6h6m-6 8h4m2 6h4a4 4 0 004-4v-6H3v6a4 4 0 004 4z" />
                                </svg>
                                <span>Docker containers</span>
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </nav>

            {/* User Profile */}
            <div className={`p-4 border-t border-zinc-900 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                        AD
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-zinc-300 truncate">Admin User</p>
                            <p className="text-[10px] text-zinc-500 truncate">admin@nexus.io</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
