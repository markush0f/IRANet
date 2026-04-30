import { useEffect, useMemo, useState } from 'react';
import { useServer } from '../contexts/ServerContext';
import type { RemoteUser, UsersSummary } from '../types';
import {
    fallbackSummary,
    getUsersFallbackByType,
    fetchUsersByType,
    fetchUsersSummary,
} from '../services/usersService';
import type { UserFilterOption } from '../services/usersService';

const isAbortError = (error: unknown): boolean => {
    return error instanceof DOMException && error.name === 'AbortError';
};

export const useUsersData = () => {
    const { selectedServerId } = useServer();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<UserFilterOption>('all');
    const [users, setUsers] = useState<RemoteUser[]>(getUsersFallbackByType('all'));
    const [summary, setSummary] = useState<UsersSummary>(fallbackSummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadSummary = async () => {
            try {
                setError(null);
                const summaryData = await fetchUsersSummary(selectedServerId, controller.signal);
                setSummary(summaryData);
            } catch (e) {
                if (isAbortError(e)) return;
                console.error('Error fetching users summary', e);
                setError('User summary could not be loaded. Showing fallback data.');
                setSummary(fallbackSummary);
            }
        };

        loadSummary();

        return () => controller.abort();
    }, [selectedServerId]);

    useEffect(() => {
        const controller = new AbortController();

        const loadUsers = async () => {
            try {
                setError(null);
                setLoading(true);
                const usersData = await fetchUsersByType(typeFilter, selectedServerId, controller.signal);
                setUsers(usersData);
            } catch (e) {
                if (isAbortError(e)) return;
                console.error('Error fetching users list', e);
                setError('Users could not be loaded. Using fallback data.');
                setUsers(getUsersFallbackByType(typeFilter));
            } finally {
                setLoading(false);
            }
        };

        loadUsers();

        return () => controller.abort();
    }, [selectedServerId, typeFilter]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const normalized = searchTerm.toLowerCase();
        return users.filter(user =>
            user.username.toLowerCase().includes(normalized) ||
            user.home.toLowerCase().includes(normalized) ||
            user.shell.toLowerCase().includes(normalized) ||
            user.type.toLowerCase().includes(normalized)
        );
    }, [searchTerm, users]);

    return {
        searchTerm,
        setSearchTerm,
        typeFilter,
        setTypeFilter,
        users,
        filteredUsers,
        summary,
        loading,
        error,
    };
};
