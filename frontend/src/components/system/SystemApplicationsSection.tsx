import React from 'react';
import type { SystemApplication } from '../../types';
import { useSystemApplicationsSection } from '../../hooks/useSystemApplicationsSection';
import SystemApplicationCard from './SystemApplicationCard';
import SystemApplicationModal from './SystemApplicationModal';

interface SystemApplicationsSectionProps {
    applications: SystemApplication[];
}

const SystemApplicationsSection: React.FC<SystemApplicationsSectionProps> = ({ applications }) => {
    const {
        isModalOpen,
        discoveryCwd,
        setDiscoveryCwd,
        applicationName,
        setApplicationName,
        discoveryDetails,
        discoveryError,
        saveError,
        logBasePaths,
        loadingDetails,
        savingApplication,
        technicalDetailsOpen,
        setTechnicalDetailsOpen,
        openModal,
        closeModal,
        handleSaveApplication,
        handleRetryFetch,
        handleLogBasePathChange,
        handleAddLogBasePath,
        handleRemoveLogBasePath,
        runtimeTokens,
        iconCommands,
        accessPorts,
        accessUrls,
        accessAvailable,
        detectedBasePaths,
        modalDisplayName,
        modalDisplayCwd,
        registeredApplicationsByCwd,
        registeredLoading,
        deleteRegisteredApplication,
    } = useSystemApplicationsSection();

    return (
        <>
            <section className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Applications</p>
                        <h3 className="text-lg font-semibold text-zinc-100">System applications</h3>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {applications.map(application => (
                        <SystemApplicationCard
                            key={application.cwd}
                            application={application}
                            onOpen={openModal}
                            registeredApp={registeredApplicationsByCwd.get(application.cwd.trim()) ?? null}
                            registeredLoading={registeredLoading}
                            onDeleteRegistered={deleteRegisteredApplication}
                        />
                    ))}
                </div>
            </section>

            <SystemApplicationModal
                isOpen={isModalOpen}
                onClose={closeModal}
                iconCommands={iconCommands}
                modalDisplayName={modalDisplayName}
                modalDisplayCwd={modalDisplayCwd}
                discoveryDetails={discoveryDetails}
                discoveryError={discoveryError}
                saveError={saveError}
                loadingDetails={loadingDetails}
                savingApplication={savingApplication}
                applicationName={applicationName}
                onApplicationNameChange={setApplicationName}
                discoveryCwd={discoveryCwd}
                onDiscoveryCwdChange={setDiscoveryCwd}
                runtimeTokens={runtimeTokens}
                detectedBasePaths={detectedBasePaths}
                logBasePaths={logBasePaths}
                onAddLogBasePath={handleAddLogBasePath}
                onLogBasePathChange={handleLogBasePathChange}
                onRemoveLogBasePath={handleRemoveLogBasePath}
                accessPorts={accessPorts}
                accessUrls={accessUrls}
                accessAvailable={accessAvailable}
                technicalDetailsOpen={technicalDetailsOpen}
                onToggleTechnicalDetails={() => setTechnicalDetailsOpen(open => !open)}
                onRetryFetch={handleRetryFetch}
                onSaveApplication={handleSaveApplication}
            />
        </>
    );
};

export default SystemApplicationsSection;
