import { useState, useEffect } from 'react';
import ServiceGrid from './components/ServiceGrid';
import ServiceCard from './components/ServiceCard';
import LogsViewer from './components/LogsViewer';
import Sidebar from './components/Sidebar';
import PerformanceView from './components/PerformanceView';
import UsersView from './components/UsersView';
import type { Service, LogEntry, ServiceType } from './types';
import { INITIAL_SERVICES, MOCK_LOGS, generateMockLog } from './mockData';

const detectServiceType = (url: string, name: string): ServiceType => {
  const lowerUrl = url.toLowerCase();
  const lowerName = name.toLowerCase();

  if (lowerUrl.includes('postgres') || lowerUrl.includes('mysql') || lowerUrl.includes('mongo') || lowerName.includes('db') || lowerName.includes('database')) return 'database';
  if (lowerUrl.includes('redis') || lowerName.includes('redis') || lowerName.includes('cache')) return 'redis';
  if (lowerUrl.includes('docker') || lowerUrl.includes('.sock') || lowerName.includes('docker') || lowerName.includes('swarm')) return 'docker';
  if (lowerUrl.includes('nginx') || lowerName.includes('nginx') || lowerName.includes('gateway') || lowerName.includes('balancer')) return 'nginx';
  if (lowerName.includes('linux') || lowerName.includes('server') || lowerName.includes('ubuntu') || lowerName.includes('centos')) return 'linux';

  return 'http';
};

function App() {
  const [services, setServices] = useState<Service[]>(() =>
    INITIAL_SERVICES.map(s => ({ ...s, type: detectServiceType(s.url, s.name) }))
  );
  const [logsOpen, setLogsOpen] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
  const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([]);
  const [currentView, setCurrentView] = useState('dashboard');

  // Simulate initial load status check
  useEffect(() => {
    const timer = setTimeout(() => {
      setServices(prev => prev.map(s => ({ ...s, status: Math.random() > 0.1 ? 'online' : 'offline' })));
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckStatus = async (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, status: 'loading' } : s));

    // Simulate network delay
    setTimeout(() => {
      const isOnline = Math.random() > 0.2; // 80% chance of being online
      setServices(prev => prev.map(s =>
        s.id === id ? { ...s, status: isOnline ? 'online' : 'error' } : s
      ));
    }, 1000 + Math.random() * 1000);
  };

  const handleUpdateService = (id: string, field: 'url' | 'healthEndpoint' | 'name', value: string) => {
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;
      const newService = { ...s, [field]: value };
      if (field === 'url' || field === 'name') {
        newService.type = detectServiceType(newService.url, newService.name);
      }
      return newService;
    }));
  };

  const handleAddService = () => {
    const defaultUrl = 'https://api.example.com';
    const defaultName = 'New Service';
    const newService: Service = {
      id: Date.now().toString(),
      name: defaultName,
      url: defaultUrl,
      healthEndpoint: '/health',
      description: 'Newly added service monitor',
      type: detectServiceType(defaultUrl, defaultName),
      status: 'offline', // Default to offline until checked
    };
    setServices(prev => [...prev, newService]);
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleViewLogs = (id: string) => {
    setCurrentServiceId(id);
    const existingLogs = MOCK_LOGS[id] || [];
    if (existingLogs.length === 0) {
      const startupLogs: LogEntry[] = [
        { id: 'start1', timestamp: new Date().toISOString(), level: 'info', message: 'System startup initiated', serviceId: id },
        { id: 'start2', timestamp: new Date().toISOString(), level: 'info', message: 'Configuration loaded from env', serviceId: id }
      ];
      setCurrentLogs(startupLogs);
    } else {
      setCurrentLogs(existingLogs);
    }
    setLogsOpen(true);
  };

  // Poll for new logs when modal is open
  useEffect(() => {
    if (!logsOpen || !currentServiceId) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40% chance of new log per tick
        const newLog = generateMockLog(currentServiceId);
        setCurrentLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [logsOpen, currentServiceId]);

  const currentServiceName = services.find(s => s.id === currentServiceId)?.name || 'Unknown Service';

  return (
    <div className="flex h-screen bg-zinc-950 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden">
      <Sidebar activeView={currentView} onNavigate={setCurrentView} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header - simplified since navigation is on sidebar */}
        <header className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 shrink-0 z-20">
          <div className="px-8 h-20 flex items-center justify-end">
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-xs text-zinc-400">Environment</span>
                <span className="text-xs font-bold text-zinc-200">Production (US-East)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Operational</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'performance' ? (
            <PerformanceView />
          ) : currentView === 'users' ? (
            <UsersView />
          ) : (
            <main className="max-w-7xl mx-auto px-8 py-12">

              <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                  <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">System Status</h2>
                  <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4 mb-4"></div>
                  <p className="text-zinc-400 mt-2 text-sm max-w-lg leading-relaxed">
                    Real-time monitoring protocol activated. <br />
                    Manage service endpoints and inspect aggregated logs below.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddService}
                    className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Service
                  </button>
                  <button
                    onClick={() => services.forEach(s => handleCheckStatus(s.id))}
                    className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Grid
                  </button>
                </div>
              </div>

              <ServiceGrid>
                {services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onCheck={handleCheckStatus}
                    onViewLogs={handleViewLogs}
                    onUpdate={handleUpdateService}
                    onDelete={handleDeleteService}
                  />
                ))}
              </ServiceGrid>
            </main>
          )}

          <footer className="border-t border-zinc-900 mt-auto bg-zinc-950/50 py-8 px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-6">
                <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">Documentation</a>
                <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">Support</a>
                <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">API Status</a>
              </div>
              <div className="text-zinc-600 text-xs font-mono">
                System v2.1.0-dark
              </div>
            </div>
          </footer>
        </div>
      </div>

      <LogsViewer
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        logs={currentLogs}
        serviceName={currentServiceName}
      />
    </div>
  );
}

export default App;
