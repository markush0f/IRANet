import React, { useState } from 'react';
import type { SystemApplication } from '../../types';
import { useSystemApplicationsSection } from '../../hooks/useSystemApplicationsSection';
import SystemApplicationCard from './SystemApplicationCard';
import SystemApplicationModal from './SystemApplicationModal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';
import type { RemoteApplicationRecord } from '../../services/api';
import EditApplicationModal from '../common/EditApplicationModal';

interface SystemApplicationsSectionProps {
    applications: SystemApplication[];
}

const SystemApplicationsSection: React.FC<SystemApplicationsSectionProps> = ({ applications }) => {
    const [deleteTarget, setDeleteTarget] = useState<RemoteApplicationRecord | null>(null);
    const [editTarget, setEditTarget] = useState<RemoteApplicationRecord | null>(null);
    const [editSaving, setEditSaving] = useState(false);
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
        registeredDeletingId,
        deleteRegisteredApplication,
        updateRegisteredApplicationName,
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
                            registeredDeletingId={registeredDeletingId}
                            onDeleteRegistered={(applicationId) => {
                                const app = Array.from(registeredApplicationsByCwd.values()).find(entry => entry.id === applicationId) ?? null;
                                setDeleteTarget(app);
                            }}
                            onEditRegistered={(app) => setEditTarget(app)}
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

            <ConfirmDeleteModal
                isOpen={Boolean(deleteTarget)}
                title={deleteTarget ? `Delete "${deleteTarget.name || deleteTarget.identifier}"?` : 'Delete application?'}
                details={deleteTarget ? (
                    <div className="space-y-1">
                        <div>
                            <span className="text-zinc-500">ID: </span>
                            <span className="font-mono text-zinc-200">{deleteTarget.id}</span>
                        </div>
                        {deleteTarget.workdir && (
                            <div className="text-zinc-400 font-mono break-all">{deleteTarget.workdir}</div>
                        )}
                    </div>
                ) : null}
                busy={Boolean(deleteTarget && registeredDeletingId === deleteTarget.id)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    void deleteRegisteredApplication(deleteTarget.id).then(() => {
                        setDeleteTarget(null);
                    });
                }}
            />

            <EditApplicationModal
                isOpen={Boolean(editTarget)}
                title={editTarget ? `Edit "${editTarget.name || editTarget.identifier}"` : 'Edit application'}
                initialName={editTarget?.name ?? ''}
                busy={editSaving}
                details={editTarget ? (
                    <div className="space-y-1">
                        <div>
                            <span className="text-zinc-500">ID: </span>
                            <span className="font-mono text-zinc-200">{editTarget.id}</span>
                        </div>
                        {editTarget.workdir && (
                            <div className="text-zinc-400 font-mono break-all">{editTarget.workdir}</div>
                        )}
                    </div>
                ) : null}
                onClose={() => setEditTarget(null)}
                onSave={(name) => {
                    if (!editTarget) return;
                    setEditSaving(true);
                    void updateRegisteredApplicationName(editTarget.id, name).finally(() => {
                        setEditSaving(false);
                        setEditTarget(null);
                    });
                }}
            />
        </>
    );
};

export default SystemApplicationsSection;
