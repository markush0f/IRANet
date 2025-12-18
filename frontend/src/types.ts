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

export interface SystemApplication {
    cwd: string;
    commands: string[];
}

export interface MetricSample {
    ts: string;
    value: number;
}

export interface DockerContainer {
    id: string;
    name: string;
    image: string[];
    status: string;
    state: string;
    created: string;
}

export interface ProcessState {
    code: string;
    label: string;
}

export interface ProcessCpuInfo {
    time_formatted: string;
}

export interface ProcessMemoryInfo {
    virt_kb: number;
    res_kb: number;
    shared_kb: number;
}

export interface ProcessInfo {
    pid: number;
    ppid: number;
    name: string;
    user: string;
    state: ProcessState;
    cpu: ProcessCpuInfo;
    memory: ProcessMemoryInfo;
    priority: number;
    nice: number;
}

export interface ProcessesSnapshotHeader {
    uptime: string;
    load_average: {
        load_1m: number;
        load_5m: number;
        load_15m: number;
    };
    tasks: {
        total: number;
        running: number;
        sleeping: number;
        stopped: number;
        zombie: number;
    };
    cpu: {
        us: number;
        ni: number;
        sy: number;
        id: number;
        wa: number;
        hi: number;
        si: number;
        st: number;
    };
    memory: {
        total_kb: number;
        used_kb: number;
        free_kb: number;
        buffers_kb: number;
        cached_kb: number;
        available_kb: number;
        available_percent: number;
        pressure: string;
    };
    swap: {
        total_kb: number;
        used_kb: number;
        free_kb: number;
        state: string;
    };
}

export interface ProcessesSnapshot {
    timestamp: number;
    limit: number;
    header: ProcessesSnapshotHeader;
    processes: ProcessInfo[];
}

export interface RemoteUser {
    username: string;
    uid: number;
    gid: number;
    home: string;
    shell: string;
    type: 'human' | 'system';
}

export interface UsersSummary {
    total: number;
    human: number;
    system: number;
    login_allowed: number;
    active: number;
    active_users: string[];
}
