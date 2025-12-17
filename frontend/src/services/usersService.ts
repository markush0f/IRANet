import { MOCK_USERS } from '../mockData';
import type { RemoteUser, UsersSummary } from '../types';
import { getUsersList, getUsersSummary, getSystemUsers, getHumanUsers } from './api';

export type UserFilterOption = 'all' | 'human' | 'system';

export const fallbackSummary: UsersSummary = {
    total: MOCK_USERS.length,
    human: MOCK_USERS.filter(user => user.role !== 'viewer').length,
    system: MOCK_USERS.filter(user => user.role === 'viewer').length,
    login_allowed: 3,
    active: 0,
    active_users: [],
};

const buildFallbackUsers = (): RemoteUser[] => {
    return MOCK_USERS.map((user, index) => ({
        username: user.email.split('@')[0],
        uid: index + 1000,
        gid: index + 1000,
        home: `/home/${user.email.split('@')[0]}`,
        shell: '/bin/bash',
        type: user.role === 'viewer' ? 'system' : 'human',
    }));
};

export const fallbackUsers = buildFallbackUsers();

const filterFallbackUsers = (type: UserFilterOption): RemoteUser[] => {
    if (type === 'all') {
        return fallbackUsers;
    }
    return fallbackUsers.filter(user => user.type === type);
};

export const fetchUsersSummary = async (signal?: AbortSignal): Promise<UsersSummary> => {
    return getUsersSummary(signal);
};

export const fetchUsersByType = async (type: UserFilterOption, signal?: AbortSignal): Promise<RemoteUser[]> => {
    switch (type) {
        case 'human':
            return getHumanUsers(signal);
        case 'system':
            return getSystemUsers(signal);
        default:
            return getUsersList(signal);
    }
};

export const getUsersFallbackByType = (type: UserFilterOption): RemoteUser[] => {
    return filterFallbackUsers(type);
};
