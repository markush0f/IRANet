import { useState, useEffect } from 'react';
import LogsViewer from './components/LogsViewer';
import Sidebar from './components/Sidebar';
import PerformanceView from './components/PerformanceView';
import UsersView from './components/UsersView';
import SystemInfoView from './components/SystemInfoView';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import EnvBadge from './components/EnvBadge';
import DashboardView from './components/DashboardView';
import DockerView from './components/DockerView';
import ProcessesView from './components/ProcessesView';
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
  const [currentView, setCurrentView] = useState('system');

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

  const handleRefreshAllServices = () => {
    services.forEach(s => handleCheckStatus(s.id));
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
        <AppHeader />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'system' ? (
            <SystemInfoView />
          ) : currentView === 'performance' ? (
            <PerformanceView />
          ) : currentView === 'users' ? (
            <UsersView />
          ) : currentView === 'docker' ? (
            <DockerView />
          ) : currentView === 'processes' ? (
            <ProcessesView />
          ) : (
            <DashboardView
              services={services}
              onAddService={handleAddService}
              onRefreshAll={handleRefreshAllServices}
              onCheck={handleCheckStatus}
              onViewLogs={handleViewLogs}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          )}

          <AppFooter />
        </div>
      </div>

      <LogsViewer
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        logs={currentLogs}
        serviceName={currentServiceName}
      />

      <EnvBadge />
    </div>
  );
}

export default App;
