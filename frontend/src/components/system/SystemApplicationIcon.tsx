import React from 'react';

const KNOWN_LOGOS = [
    { matcher: 'python', label: '🐍', gradient: 'from-sky-500 to-emerald-500' },
    { matcher: 'node', label: '📗', gradient: 'from-lime-500 to-emerald-600' },
    { matcher: 'npm', label: '📦', gradient: 'from-red-500 to-pink-600' },
    { matcher: 'uvicorn', label: '🦄', gradient: 'from-indigo-500 to-purple-600' },
    { matcher: 'fastapi', label: '⚡', gradient: 'from-teal-500 to-cyan-600' },
    { matcher: 'django', label: '🎸', gradient: 'from-green-600 to-emerald-700' },
    { matcher: 'flask', label: '🧪', gradient: 'from-gray-600 to-gray-800' },
    { matcher: 'react', label: '⚛️', gradient: 'from-blue-400 to-cyan-500' },
    { matcher: 'next', label: '▲', gradient: 'from-slate-800 to-zinc-900' },
    { matcher: 'vue', label: '💚', gradient: 'from-emerald-500 to-green-600' },
    { matcher: 'angular', label: '🅰️', gradient: 'from-red-600 to-pink-700' },
    { matcher: 'express', label: '🚂', gradient: 'from-gray-700 to-slate-800' },
    { matcher: 'nest', label: '🐱', gradient: 'from-red-500 to-rose-600' },
    { matcher: 'rust', label: '🦀', gradient: 'from-orange-600 to-red-700' },
    { matcher: 'go', label: '🐹', gradient: 'from-cyan-500 to-blue-600' },
    { matcher: 'java', label: '☕', gradient: 'from-orange-500 to-red-600' },
];

interface SystemApplicationIconProps {
    commands: string[];
}

const SystemApplicationIcon: React.FC<SystemApplicationIconProps> = ({ commands }) => {
    const normalized = commands.map(command => command.toLowerCase());
    const match = KNOWN_LOGOS.find(entry => normalized.some(command => command.includes(entry.matcher)));
    const label = match?.label ?? (commands[0]?.slice(0, 2).toUpperCase() ?? '??');
    const gradient = match?.gradient ?? 'from-zinc-700 to-zinc-900';

    return (
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <span className="text-xl">{label}</span>
        </div>
    );
};

export default SystemApplicationIcon;
