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

export interface SystemInfo {
    hostname: string;
    fqdn: string;
    os: string;
    os_version: string;
    kernel: string;
    architecture: string;
    processor: string;
    python_version: string;
    boot_time: number;
    cpu?: {
        cores_physical: number;
        cores_logical: number;
    };
    memory?: {
        total_bytes: number;
    };
    network?: {
        mac_address: string;
    };
    distribution: {
        name: string;
        version: string;
        codename: string;
    };
}

export interface DockerContainer {
    id: string;
    name: string;
    image: string[];
    status: string;
    state: string;
    created: string;
}
