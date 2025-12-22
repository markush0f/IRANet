import { useState } from 'react';
import LogsViewer from './components/dashboard/LogsViewer';
import Sidebar from './components/layout/Sidebar';
import PerformanceView from './components/monitoring/PerformanceView';
import UsersView from './components/users/UsersView';
import SystemInfoView from './components/system/SystemInfoView';
import SystemDiskView from './components/system/SystemDiskView';
import CpuMetricsView from './components/monitoring/CpuMetricsView';
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';
import EnvBadge from './components/layout/EnvBadge';
import DashboardView from './components/dashboard/DashboardView';
import DockerView from './components/monitoring/DockerView';
import ProcessesView from './components/monitoring/ProcessesView';
import MemoryMetricsView from './components/monitoring/MemoryMetricsView';
import NetworkMetricsView from './components/monitoring/NetworkMetricsView';
import PacketLossEventsView from './components/monitoring/PacketLossEventsView';
import AlertsView from './components/alerts/AlertsView';
import ApplicationsView from './components/applications/ApplicationsView';
import SystemApplicationsView from './components/system/SystemApplicationsView';
import ApplicationsLogsView from './components/logs/ApplicationsLogsView';
import SystemServicesView from './components/system/SystemServicesView';
import SystemPackagesView from './components/system/SystemPackagesView';
import { Toaster } from 'react-hot-toast';
import { useServices } from './hooks/useServices';
import { useLogsModal } from './hooks/useLogsModal';
import { useSystemAlerts } from './hooks/useSystemAlerts';

function App() {
  const { services, handleAddService, handleDeleteService, handleRefreshAll, handleCheckStatus, handleUpdateService } = useServices();
  const { logsOpen, currentLogs, currentServiceId, openLogs, closeLogs } = useLogsModal();
  const [currentView, setCurrentView] = useState('system');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useSystemAlerts();

  const currentServiceName = services.find(s => s.id === currentServiceId)?.name || 'Unknown Service';

  return (
    <div className="flex min-h-screen lg:h-screen bg-zinc-950 selection:bg-indigo-500/30 selection:text-indigo-200 lg:overflow-hidden">
      <Sidebar
        activeView={currentView}
        onNavigate={(viewId) => {
          setCurrentView(viewId);
          setIsSidebarOpen(false);
        }}
        isMobileOpen={isSidebarOpen}
        onMobileClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 overflow-hidden">
        <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-900 bg-zinc-950/90 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Menú
          </button>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            IRANet
          </span>
        </div>
        {/* <AppHeader /> */}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'system' ? (
            <SystemInfoView />
          ) : currentView === 'system-disk' ? (
            <SystemDiskView />
          ) : currentView === 'cpu-metrics' ? (
            <CpuMetricsView />
          ) : currentView === 'memory-metrics' ? (
            <MemoryMetricsView />
          ) : currentView === 'network-metrics' ? (
            <NetworkMetricsView />
          ) : currentView === 'packet-loss-events' ? (
            <PacketLossEventsView />
          ) : currentView === 'performance' ? (
            <PerformanceView />
          ) : currentView === 'users' ? (
            <UsersView />
          ) : currentView === 'docker' ? (
            <DockerView />
          ) : currentView === 'processes' ? (
            <ProcessesView />
          ) : currentView === 'alerts' ? (
            <AlertsView />
          ) : currentView === 'applications' ? (
            <ApplicationsView />
          ) : currentView === 'system-applications' ? (
            <SystemApplicationsView />
          ) : currentView === 'system-services' ? (
            <SystemServicesView />
          ) : currentView === 'system-packages' ? (
            <SystemPackagesView />
          ) : currentView === 'logs' ? (
            <ApplicationsLogsView />
          ) : currentView === 'dashboard' ? (
            <DashboardView
              services={services}
              onAddService={handleAddService}
              onRefreshAll={handleRefreshAll}
              onCheck={handleCheckStatus}
              onViewLogs={openLogs}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          ) : (
            <DashboardView
              services={services}
              onAddService={handleAddService}
              onRefreshAll={handleRefreshAll}
              onCheck={handleCheckStatus}
              onViewLogs={openLogs}
              onUpdateService={handleUpdateService}
              onDeleteService={handleDeleteService}
            />
          )}

          <AppFooter />
        </div>
      </div>

      <LogsViewer
        isOpen={logsOpen}
        onClose={closeLogs}
        logs={currentLogs}
        serviceName={currentServiceName}
      />

      <EnvBadge />
      <Toaster
        position="top-center"
        gutter={12}
        reverseOrder={false}
        containerStyle={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'center',
          pointerEvents: 'none',
          left: 0,
          right: 0,
          marginTop: '1rem',
        }}
        toastOptions={{
          duration: 5000,
          style: { pointerEvents: 'auto' },
        }}
      />
    </div>
  );
}

export default App;
