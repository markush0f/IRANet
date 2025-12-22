import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../../types';

interface LogsViewerProps {
    logs: LogEntry[];
    serviceName: string;
    isOpen: boolean;
    onClose: () => void;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ logs, serviceName, isOpen, onClose }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-4xl h-[85vh] sm:h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-zinc-800" onClick={e => e.stopPropagation()}>
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-100">System Logs</h2>
                        <p className="text-sm text-zinc-500">Live stream from <span className="font-mono text-zinc-300">{serviceName}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-black/40 font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-600 italic">
                            No logs available for this session.
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="mb-1 flex gap-3 hover:bg-zinc-800/30 p-1.5 rounded border-l-2 border-transparent hover:border-zinc-700 transition-colors">
                                <span className="text-zinc-600 whitespace-nowrap text-xs py-0.5 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`uppercase text-[10px] font-bold w-12 text-center py-0.5 rounded px-1 tracking-wider
                  ${log.level === 'info' ? 'text-blue-400 bg-blue-400/10' : ''}
                  ${log.level === 'error' ? 'text-rose-400 bg-rose-400/10' : ''}
                  ${log.level === 'warn' ? 'text-amber-400 bg-amber-400/10' : ''}
                  ${log.level === 'debug' ? 'text-zinc-500 bg-zinc-500/10' : ''}
                `}>{log.level}</span>
                                <span className="text-zinc-300 break-all">{log.message}</span>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 text-right">
                    <span className="text-xs text-zinc-500 flex items-center justify-end gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                        Live Connection Active
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LogsViewer;
