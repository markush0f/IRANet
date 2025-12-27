import React from 'react';
import { useApplicationsLogs } from '../../hooks/useApplicationsLogs';
import ApplicationLogDetails from './ApplicationLogDetails';
import ApplicationsLogsTable from './ApplicationsLogsTable';

const ApplicationsLogsView: React.FC = () => {
    const {
        applications,
        loading,
        error,
        selectedApp,
        selectApp,
        closeDetails,
        logFiles,
        filesLoading,
        filesError,
        selectedFile,
        selectFile,
        liveEnabled,
        liveStatus,
        liveError,
        liveLines,
        toggleLive,
        clearLive,
        liveLevelFilter,
        updateLiveLevelFilter,
        liveSearchQuery,
        updateLiveSearchQuery,
        clearLiveSearch,
        rescanLoading,
        rescanLogs,
        liveContainerRef,
    } = useApplicationsLogs();

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm space-y-6">
            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Logs</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Applications with logs</h2>
                <p className="text-[10px] text-zinc-500 mt-2 max-w-2xl">
                    List of applications that have configured log paths.
                </p>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                    {error}
                </div>
            )}

            <ApplicationsLogsTable
                applications={applications}
                loading={loading}
                onShowLogs={selectApp}
                onRescanLogs={rescanLogs}
                rescanLoading={rescanLoading}
            />

            {selectedApp && (
                <ApplicationLogDetails
                    app={selectedApp}
                    logFiles={logFiles}
                    filesLoading={filesLoading}
                    filesError={filesError}
                    selectedFile={selectedFile}
                    onSelectFile={selectFile}
                    onClose={closeDetails}
                    live={{
                        enabled: liveEnabled,
                        status: liveStatus,
                        error: liveError,
                        lines: liveLines,
                        onToggle: toggleLive,
                        onClear: clearLive,
                        levelFilter: liveLevelFilter,
                        onLevelFilterChange: updateLiveLevelFilter,
                        searchQuery: liveSearchQuery,
                        onSearchQueryChange: updateLiveSearchQuery,
                        onClearSearch: clearLiveSearch,
                        containerRef: liveContainerRef,
                    }}
                />
            )}
        </div>
    );
};

export default ApplicationsLogsView;
