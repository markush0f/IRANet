import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { ApplicationDiscoveryDetails, SystemApplication } from '../types';
import {
    createApplication,
    deleteApplication,
    getApplicationDiscoveryDetails,
    getApplicationsList,
    type RemoteApplicationRecord,
} from '../services/api';

export const useSystemApplicationsSection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<SystemApplication | null>(null);
    const [discoveryCwd, setDiscoveryCwd] = useState('');
    const [applicationName, setApplicationName] = useState('');
    const [discoveryDetails, setDiscoveryDetails] = useState<ApplicationDiscoveryDetails | null>(null);
    const [discoveryError, setDiscoveryError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [logBasePaths, setLogBasePaths] = useState<string[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [savingApplication, setSavingApplication] = useState(false);
    const [technicalDetailsOpen, setTechnicalDetailsOpen] = useState(false);
    const [fetchKey, setFetchKey] = useState(0);

    const [registeredApplications, setRegisteredApplications] = useState<RemoteApplicationRecord[]>([]);
    const [registeredLoading, setRegisteredLoading] = useState(false);

    const refreshRegisteredApplications = useCallback(async (signal?: AbortSignal) => {
        setRegisteredLoading(true);
        try {
            const apps = await getApplicationsList(signal);
            setRegisteredApplications(apps);
        } catch (err) {
            const aborted =
                err instanceof DOMException && err.name === 'AbortError' ||
                (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');
            if (!aborted) {
                console.error('Error loading registered applications', err);
            }
        } finally {
            setRegisteredLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        refreshRegisteredApplications(controller.signal);
        return () => controller.abort();
    }, [refreshRegisteredApplications]);

    const registeredApplicationsByCwd = useMemo(() => {
        const map = new Map<string, RemoteApplicationRecord>();
        for (const app of registeredApplications) {
            const cwd = (app.workdir ?? '').trim();
            if (!cwd) continue;
            map.set(cwd, app);
        }
        return map;
    }, [registeredApplications]);

    const deleteRegisteredApplication = useCallback(async (applicationId: string) => {
        const confirmed = window.confirm('Delete this application? This cannot be undone.');
        if (!confirmed) return;

        try {
            await deleteApplication(applicationId);
            toast.success('Application deleted', { duration: 3000 });
            await refreshRegisteredApplications();
        } catch (err) {
            console.error('Error deleting registered application', err);
            toast.error('The application could not be deleted.', { duration: 4000 });
        }
    }, [refreshRegisteredApplications]);

    const prepareDiscoveryRequest = useCallback(() => {
        setLoadingDetails(true);
        setDiscoveryError(null);
        setDiscoveryDetails(null);
        setLogBasePaths([]);
        setFetchKey(key => key + 1);
    }, []);

    const openModal = useCallback(
        (application: SystemApplication) => {
            setSelectedApplication(application);
            setDiscoveryCwd(application.cwd);
            setApplicationName(application.name ?? '');
            setTechnicalDetailsOpen(false);
            setIsModalOpen(true);
            prepareDiscoveryRequest();
        },
        [prepareDiscoveryRequest]
    );

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setDiscoveryCwd('');
        setApplicationName('');
        setSelectedApplication(null);
        setDiscoveryDetails(null);
        setLogBasePaths([]);
        setDiscoveryError(null);
        setSaveError(null);
        setLoadingDetails(false);
        setSavingApplication(false);
        setTechnicalDetailsOpen(false);
    }, []);

    const handleSaveApplication = useCallback(async () => {
        const cwd = discoveryCwd.trim();
        const name = applicationName.trim();
        const cleanedBasePaths = logBasePaths.map(path => path.trim()).filter(Boolean);

        if (!cwd || !name) {
            setSaveError('Name and CWD are required.');
            return;
        }

        setSavingApplication(true);
        setSaveError(null);

        try {
            await createApplication({
                cwd,
                name,
                log_base_paths: cleanedBasePaths,
            });
            toast.success('Application created successfully', { duration: 4000 });
            await refreshRegisteredApplications();
            closeModal();
        } catch (error) {
            console.error('Error creating system application', error);
            setSaveError('The application could not be saved. Please check the backend.');
        } finally {
            setSavingApplication(false);
        }
    }, [applicationName, closeModal, discoveryCwd, logBasePaths]);

    const handleRetryFetch = useCallback(() => {
        if (!discoveryCwd) {
            return;
        }

        prepareDiscoveryRequest();
    }, [discoveryCwd, prepareDiscoveryRequest]);

    const handleLogBasePathChange = useCallback((index: number, value: string) => {
        setLogBasePaths(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const handleAddLogBasePath = useCallback(() => {
        setLogBasePaths(prev => [...prev, '']);
    }, []);

    const handleRemoveLogBasePath = useCallback((index: number) => {
        setLogBasePaths(prev => prev.filter((_, idx) => idx !== index));
    }, []);

    useEffect(() => {
        if (!isModalOpen || !discoveryCwd) {
            return;
        }

        const controller = new AbortController();

        getApplicationDiscoveryDetails(discoveryCwd, 15, controller.signal)
            .then(data => {
                setDiscoveryDetails(data);
                setLogBasePaths(data.paths?.log_base_paths ?? []);
            })
            .catch(error => {
                if (error.name !== 'AbortError') {
                    const message =
                        error instanceof Error
                            ? error.message
                            : typeof error === 'string'
                            ? error
                            : 'Application information could not be retrieved';
                    setDiscoveryError(message);
                }
            })
            .finally(() => {
                setLoadingDetails(false);
            });

        return () => {
            controller.abort();
        };
    }, [discoveryCwd, fetchKey, isModalOpen]);

    useEffect(() => {
        if (!isModalOpen) {
            return;
        }
        if (applicationName.trim()) {
            return;
        }
        const suggestedName = discoveryDetails?.name ?? selectedApplication?.name ?? '';
        if (suggestedName) {
            setApplicationName(suggestedName);
        }
    }, [applicationName, discoveryDetails, isModalOpen, selectedApplication]);

    const runtimeTokens = useMemo(
        () =>
            discoveryDetails?.detected_runtimes?.filter(Boolean) ??
            discoveryDetails?.commands ??
            selectedApplication?.commands ??
            [],
        [discoveryDetails?.commands, discoveryDetails?.detected_runtimes, selectedApplication?.commands]
    );

    const iconCommands = useMemo(
        () =>
            discoveryDetails?.commands ??
            discoveryDetails?.detected_runtimes ??
            selectedApplication?.commands ??
            [],
        [discoveryDetails?.commands, discoveryDetails?.detected_runtimes, selectedApplication?.commands]
    );

    const accessPorts = discoveryDetails?.access?.ports ?? [];
    const accessUrls = discoveryDetails?.access?.urls ?? [];
    const accessAvailable = discoveryDetails?.access?.available;
    const detectedBasePaths = discoveryDetails?.paths?.log_base_paths ?? [];

    const modalDisplayName =
        discoveryDetails?.name ?? selectedApplication?.cwd ?? 'Detected application';
    const modalDisplayCwd = discoveryDetails?.cwd ?? discoveryCwd;

    return {
        isModalOpen,
        selectedApplication,
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
        refreshRegisteredApplications,
        deleteRegisteredApplication,
    };
};
