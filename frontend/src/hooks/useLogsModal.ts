import { useState, useEffect, useCallback } from 'react';
import type { LogEntry } from '../types';
import { MOCK_LOGS, generateMockLog } from '../mockData';

export const useLogsModal = () => {
    const [logsOpen, setLogsOpen] = useState(false);
    const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([]);
    const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

    const handleViewLogs = useCallback((id: string) => {
        setCurrentServiceId(id);
        const existingLogs = MOCK_LOGS[id] || [];
        if (existingLogs.length === 0) {
            const startupLogs: LogEntry[] = [
                { id: 'start1', timestamp: new Date().toISOString(), level: 'info', message: 'System startup initiated', serviceId: id },
                { id: 'start2', timestamp: new Date().toISOString(), level: 'info', message: 'Configuration loaded from env', serviceId: id },
            ];
            setCurrentLogs(startupLogs);
        } else {
            setCurrentLogs(existingLogs);
        }
        setLogsOpen(true);
    }, []);

    const handleCloseLogs = useCallback(() => {
        setLogsOpen(false);
    }, []);

    useEffect(() => {
        if (!logsOpen || !currentServiceId) return undefined;

        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const newLog = generateMockLog(currentServiceId);
                setCurrentLogs(prev => [...prev.slice(-49), newLog]);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [logsOpen, currentServiceId]);

    return {
        logsOpen,
        currentLogs,
        currentServiceId,
        openLogs: handleViewLogs,
        closeLogs: handleCloseLogs,
    };
};
