import React, { useState, useEffect } from 'react';

const PerformanceView: React.FC = () => {
    // Mock data state
    const [dataPoints, setDataPoints] = useState<number[]>(Array.from({ length: 20 }, () => Math.random() * 40 + 30));
    const [memoryPoints, setMemoryPoints] = useState<number[]>(Array.from({ length: 20 }, () => Math.random() * 20 + 60));
    const [networkTx, setNetworkTx] = useState<number[]>(Array.from({ length: 20 }, () => Math.random() * 500 + 100));
    const [networkRx, setNetworkRx] = useState<number[]>(Array.from({ length: 20 }, () => Math.random() * 800 + 200));

    useEffect(() => {
        const interval = setInterval(() => {
            setDataPoints(prev => [...prev.slice(1), Math.random() * 40 + 30]);
            setMemoryPoints(prev => [...prev.slice(1), Math.random() * 20 + 60]);
            setNetworkTx(prev => [...prev.slice(1), Math.random() * 500 + 100]);
            setNetworkRx(prev => [...prev.slice(1), Math.random() * 800 + 200]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const generatePolyline = (data: number[], height: number, max: number) => {
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = height - (val / max) * height;
            return `${x},${y}`;
        }).join(' ');
        return points;
    };

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">System Performance</h2>
                <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4"></div>
                <p className="text-zinc-400 mt-2 text-sm">Real-time telemetry from cluster nodes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* CPU Usage Card */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-200">CPU Usage</h3>
                                <p className="text-xs text-zinc-500 font-mono">Core 0-15</p>
                            </div>
                        </div>
                        <span className="text-2xl font-mono font-bold text-zinc-100">{Math.round(dataPoints[dataPoints.length - 1])}%</span>
                    </div>

                    <div className="h-40 w-full bg-zinc-950/50 rounded-lg border border-zinc-800/50 relative overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Grid Lines */}
                            <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeWidth="0.5" />
                            <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="0.5" />
                            <line x1="0" y1="75" x2="100" y2="75" stroke="#27272a" strokeWidth="0.5" />

                            {/* Area Fill */}
                            <polygon
                                points={`0,100 ${generatePolyline(dataPoints, 100, 100)} 100,100`}
                                fill="url(#cpuGradient)"
                                className="opacity-20"
                            />
                            {/* Line Chart */}
                            <polyline
                                points={generatePolyline(dataPoints, 100, 100)}
                                fill="none"
                                stroke="#818cf8"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                            <defs>
                                <linearGradient id="cpuGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Memory Usage Card */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-200">Memory</h3>
                                <p className="text-xs text-zinc-500 font-mono">32GB Total</p>
                            </div>
                        </div>
                        <span className="text-2xl font-mono font-bold text-zinc-100">{Math.round(memoryPoints[memoryPoints.length - 1])}%</span>
                    </div>
                    <div className="h-40 w-full bg-zinc-950/50 rounded-lg border border-zinc-800/50 relative overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeWidth="0.5" />
                            <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="0.5" />
                            <line x1="0" y1="75" x2="100" y2="75" stroke="#27272a" strokeWidth="0.5" />

                            <polygon
                                points={`0,100 ${generatePolyline(memoryPoints, 100, 100)} 100,100`}
                                fill="url(#memGradient)"
                                className="opacity-20"
                            />
                            <polyline
                                points={generatePolyline(memoryPoints, 100, 100)}
                                fill="none"
                                stroke="#34d399"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                            <defs>
                                <linearGradient id="memGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Network I/O Card */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-200">Network I/O</h3>
                                <p className="text-xs text-zinc-500 font-mono">TX / RX (KB/s)</p>
                            </div>

                        </div>
                        <div className="text-right">
                            <div className="text-xs font-mono font-bold text-indigo-400">TX: {Math.round(networkTx[networkTx.length - 1])}</div>
                            <div className="text-xs font-mono font-bold text-rose-400">RX: {Math.round(networkRx[networkRx.length - 1])}</div>
                        </div>
                    </div>
                    <div className="h-40 w-full bg-zinc-950/50 rounded-lg border border-zinc-800/50 relative overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="0" y1="25" x2="100" y2="25" stroke="#27272a" strokeWidth="0.5" />
                            <line x1="0" y1="50" x2="100" y2="50" stroke="#27272a" strokeWidth="0.5" />
                            <line x1="0" y1="75" x2="100" y2="75" stroke="#27272a" strokeWidth="0.5" />

                            <polyline
                                points={generatePolyline(networkTx, 100, 1000)}
                                fill="none"
                                stroke="#818cf8"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                            <polyline
                                points={generatePolyline(networkRx, 100, 1500)}
                                fill="none"
                                stroke="#fb7185"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                                strokeDasharray="4 2"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Mock Process List Table */}
            <div className="mt-8 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-200">Top Processes</h3>
                </div>
                <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950/50 text-zinc-500 font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3">PID</th>
                            <th className="px-6 py-3">Process</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">CPU %</th>
                            <th className="px-6 py-3">Mem %</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-3 font-mono">1192</td>
                            <td className="px-6 py-3 font-bold text-white">postgres</td>
                            <td className="px-6 py-3">postgres</td>
                            <td className="px-6 py-3 text-emerald-400">12.4</td>
                            <td className="px-6 py-3 text-emerald-400">28.1</td>
                            <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Running</span></td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-3 font-mono">8221</td>
                            <td className="px-6 py-3 font-bold text-white">redis-server</td>
                            <td className="px-6 py-3">redis</td>
                            <td className="px-6 py-3 text-zinc-400">4.2</td>
                            <td className="px-6 py-3 text-zinc-400">14.1</td>
                            <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Running</span></td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-3 font-mono">4452</td>
                            <td className="px-6 py-3 font-bold text-white">nginx: master</td>
                            <td className="px-6 py-3">root</td>
                            <td className="px-6 py-3 text-zinc-400">1.8</td>
                            <td className="px-6 py-3 text-zinc-400">3.5</td>
                            <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Running</span></td>
                        </tr>
                        <tr className="hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-3 font-mono">9921</td>
                            <td className="px-6 py-3 font-bold text-white">node</td>
                            <td className="px-6 py-3">app</td>
                            <td className="px-6 py-3 text-amber-400">45.2</td>
                            <td className="px-6 py-3 text-amber-400">33.4</td>
                            <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">High CPU</span></td>
                        </tr>
                    </tbody>
                </table>

            </div>
        </div>
    );
};

export default PerformanceView;
