import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import type { Server } from '../types';
import { getServers } from '../services/api';

interface ServerContextValue {
    servers: Server[];
    selectedServerId: string;
    selectedServer: Server | null;
    loading: boolean;
    error: string | null;
    selectServer: (id: string) => void;
    refreshServers: () => void;
}

const ServerContext = createContext<ServerContextValue | null>(null);

export const useServer = (): ServerContextValue => {
    const ctx = useContext(ServerContext);
    if (!ctx) {
        throw new Error('useServer must be used within ServerProvider');
    }
    return ctx;
};

interface ServerProviderProps {
    children: React.ReactNode;
    defaultServerId?: string;
}

export const ServerProvider: React.FC<ServerProviderProps> = ({
    children,
    defaultServerId,
}) => {
    const [servers, setServers] = useState<Server[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<string>(
        defaultServerId ?? import.meta.env.VITE_SERVER_ID ?? ''
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshServers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getServers();
            setServers(data);
        } catch (err) {
            console.error('Error loading servers', err);
            setError('Servers could not be loaded.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshServers();
    }, [refreshServers]);

    useEffect(() => {
        if (!servers.length) {
            return;
        }

        const currentExists = servers.some(server => server.id === selectedServerId);
        if (!currentExists) {
            setSelectedServerId(servers[0].id);
        }
    }, [selectedServerId, servers]);

    const selectServer = useCallback((id: string) => {
        setSelectedServerId(id);
    }, []);

    const selectedServer = servers.find(s => s.id === selectedServerId) ?? null;

    return (
        <ServerContext.Provider
            value={{
                servers,
                selectedServerId,
                selectedServer,
                loading,
                error,
                selectServer,
                refreshServers,
            }}
        >
            {children}
        </ServerContext.Provider>
    );
};
