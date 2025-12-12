export type ServiceStatus = 'online' | 'offline' | 'loading' | 'error';
export type ServiceType = 'http' | 'database' | 'nginx' | 'docker' | 'linux' | 'redis' | 'other';

export interface Service {
    id: string;
    name: string;
    url: string;
    healthEndpoint: string;
    description?: string;
    type: ServiceType;
    status: ServiceStatus;
    lastChecked?: Date;
    latency?: number;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    serviceId: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    status: 'active' | 'inactive' | 'busy';
    lastLogin: string;
    avatarUrl?: string;
}
