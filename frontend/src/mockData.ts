import type { Service, LogEntry, SystemInfo, SystemApplication, SystemDiskResponse } from './types';

export const INITIAL_SERVICES: Service[] = [
    {
        id: '1',
        name: 'Auth Service',
        url: 'https://auth.example.com',
        healthEndpoint: '/health',
        description: 'User authentication and authorization provider',
        type: 'http',
        status: 'loading',
    },
    {
        id: '2',
        name: 'Primary Database',
        url: 'postgres://db-prod-01:5432',
        healthEndpoint: 'SELECT 1',
        description: 'Main transactional database cluster',
        type: 'database',
        status: 'loading',
    },
    {
        id: '3',
        name: 'NGINX Load Balancer',
        url: '10.0.0.15',
        healthEndpoint: '/stub_status',
        description: 'Edge gateway and static asset server',
        type: 'nginx',
        status: 'loading',
    },
    {
        id: '4',
        name: 'Docker Swarm Manager',
        url: 'unix:///var/run/docker.sock',
        healthEndpoint: '/info',
        description: 'Container orchestration management node',
        type: 'docker',
        status: 'loading',
    },
    {
        id: '5',
        name: 'Redis Cache',
        url: 'redis://cache-01:6379',
        healthEndpoint: 'PING',
        description: 'Session store and verified caching layer',
        type: 'redis',
        status: 'loading',
    },
    {
        id: '6',
        name: 'Legacy Linux Server',
        url: 'ssh://192.168.1.100',
        healthEndpoint: 'uptime',
        description: 'Legacy accounting system host',
        type: 'linux',
        status: 'loading',
    },
    {
        id: '7',
        name: 'User Data Mongo',
        url: 'mongodb://mongo-01:27017',
        healthEndpoint: 'db.stats()',
        description: 'User profile document store',
        type: 'database',
        status: 'loading',
    },
    {
        id: '8',
        name: 'Payment Gateway Proxy',
        url: 'https://proxy.payments.internal',
        healthEndpoint: '/status',
        description: 'Secure proxy for external payment APIs',
        type: 'nginx',
        status: 'loading',
    }
];

export const MOCK_LOGS: Record<string, LogEntry[]> = {
    '1': [
        { id: 'l1', timestamp: new Date().toISOString(), level: 'info', message: 'Service started successfully on port 8080', serviceId: '1' },
        { id: 'l2', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'Health check probe received', serviceId: '1' },
        { id: 'l3', timestamp: new Date(Date.now() - 120000).toISOString(), level: 'warn', message: 'High latency detected in DB connection pool', serviceId: '1' },
    ],
    '2': [
        { id: 'l4', timestamp: new Date().toISOString(), level: 'info', message: 'Processing transaction TX-99283', serviceId: '2' },
        { id: 'l5', timestamp: new Date(Date.now() - 30000).toISOString(), level: 'error', message: 'Gateway timeout from upstream provider', serviceId: '2' },
    ]
};

export const generateMockLog = (serviceId: string): LogEntry => {
    const levels: LogEntry['level'][] = ['info', 'info', 'info', 'warn', 'error', 'debug'];
    const messages = [
        'Request received from 192.168.1.1',
        'Cache hit for key user_123',
        'Database query took 24ms',
        'Validating token signature',
        'Job queue processing item #8821',
        'Rate limit approaching for client X',
        'Connection closed unexpectedly',
        'Garbage collection started'
    ];

    return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        serviceId
    };
};

export const MOCK_USERS = [
    {
        id: 'u1',
        name: 'Alex Rutherford',
        email: 'alex.r@nexus.io',
        role: 'admin',
        status: 'active',
        lastLogin: '2 mins ago',
        avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Rutherford&background=6366f1&color=fff'
    },
    {
        id: 'u2',
        name: 'Sarah Chen',
        email: 'sarah.c@nexus.io',
        role: 'editor',
        status: 'busy',
        lastLogin: '1 hour ago',
        avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=10b981&color=fff'
    },
    {
        id: 'u3',
        name: 'Mike Johnson',
        email: 'mike.j@nexus.io',
        role: 'viewer',
        status: 'offline',
        lastLogin: '2 days ago',
        avatarUrl: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=f59e0b&color=fff'
    },
    {
        id: 'u4',
        name: 'Emily Davis',
        email: 'emily.d@nexus.io',
        role: 'editor',
        status: 'active',
        lastLogin: '5 mins ago',
        avatarUrl: 'https://ui-avatars.com/api/?name=Emily+Davis&background=ec4899&color=fff'
    },
    {
        id: 'u5',
        name: 'David Wilson',
        email: 'david.w@nexus.io',
        role: 'viewer',
        status: 'inactive',
        lastLogin: '1 week ago',
        avatarUrl: 'https://ui-avatars.com/api/?name=David+Wilson&background=64748b&color=fff'
    }
];

export const MOCK_SYSTEM_INFO: SystemInfo = {
    hostname: 'markus-pc',
    fqdn: 'markus-pc.local',
    os: 'Linux',
    os_version: '#42-Ubuntu SMP',
    kernel: '6.5.0-18-generic',
    architecture: 'x86_64',
    processor: 'AMD Ryzen 5 5600X',
    python_version: '3.11.6',
    boot_time: 1734269187.0,
    cpu: {
        cores_physical: 6,
        cores_logical: 12
    },
    memory: {
        total_bytes: 34359738368
    },
    network: {
        mac_address: '0x1c697a9b3c1a'
    },
    distribution: {
        name: 'Ubuntu',
        version: '22.04',
        codename: 'jammy'
    }
};

export const MOCK_SYSTEM_DISK: SystemDiskResponse = {
    partitions: [
        {
            mountpoint: '/',
            filesystem: 'ext4',
            device: '/dev/sdc',
            total_bytes: 1081101176832,
            used_bytes: 161450713088,
            free_bytes: 864658108416,
            used_percent: 15.7,
            status: 'ok',
        },
        {
            mountpoint: '/mnt/wslg/distro',
            filesystem: 'ext4',
            device: '/dev/sdc',
            total_bytes: 1081101176832,
            used_bytes: 161450713088,
            free_bytes: 864658108416,
            used_percent: 15.7,
            status: 'ok',
        },
        {
            mountpoint: '/mnt/wsl/docker-desktop/docker-desktop-user-distro',
            filesystem: 'ext4',
            device: '/dev/sdd',
            total_bytes: 1081101176832,
            used_bytes: 60317696,
            free_bytes: 1026048503808,
            used_percent: 0,
            status: 'ok',
        },
        {
            mountpoint: '/mnt/wsl/docker-desktop/cli-tools',
            filesystem: 'iso9660',
            device: '/dev/loop0',
            total_bytes: 516966400,
            used_bytes: 516966400,
            free_bytes: 0,
            used_percent: 100,
            status: 'critical',
        },
        {
            mountpoint: '/mnt/wsl/docker-desktop-bind-mounts/Ubuntu/e9671acd244849c57167c658fa2f969752048f7ab184a3dcf5c46cb4d56ae124',
            filesystem: 'ext4',
            device: '/dev/sdc',
            total_bytes: 1081101176832,
            used_bytes: 161450713088,
            free_bytes: 864658108416,
            used_percent: 15.7,
            status: 'ok',
        },
        {
            mountpoint: '/mnt/wsl/docker-desktop-bind-mounts/Ubuntu/e7a41e89de2226762f2d051c9f74291ef99f11025d9f20dd76fbf76bd17129cc',
            filesystem: 'ext4',
            device: '/dev/sdc',
            total_bytes: 1081101176832,
            used_bytes: 161450713088,
            free_bytes: 864658108416,
            used_percent: 15.7,
            status: 'ok',
        },
        {
            mountpoint: '/mnt/wsl/docker-desktop-bind-mounts/Ubuntu/40c5566262bb36594fa18e7cbac550299a1baaadb1907fb3c6f526128dd781c3',
            filesystem: 'ext4',
            device: '/dev/sdc',
            total_bytes: 1081101176832,
            used_bytes: 161450713088,
            free_bytes: 864658108416,
            used_percent: 15.7,
            status: 'ok',
        },
    ],
};

export const MOCK_SYSTEM_APPLICATIONS: SystemApplication[] = [
    {
        cwd: '/mnt/c/Users/abram/AppData/Local/Programs/Microsoft VS Code',
        commands: ['node'],
    },
    {
        cwd: '/home/markus/projects/IRANet/ira',
        commands: ['node', 'python', 'python3', 'uvicorn'],
    },
    {
        cwd: '/home/markus/projects/IRANet/frontend',
        commands: ['node'],
    },
];
