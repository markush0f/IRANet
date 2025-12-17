import { useState, useEffect, useCallback } from 'react';
import type { Service } from '../types';
import { INITIAL_SERVICES } from '../mockData';

const detectServiceType = (url: string, name: string): Service['type'] => {
    const lowerUrl = url.toLowerCase();
    const lowerName = name.toLowerCase();

    if (
        lowerUrl.includes('postgres') || lowerUrl.includes('mysql') || lowerUrl.includes('mongo') ||
        lowerName.includes('db') || lowerName.includes('database')
    ) return 'database';
    if (lowerUrl.includes('redis') || lowerName.includes('redis') || lowerName.includes('cache')) return 'redis';
    if (
        lowerUrl.includes('docker') || lowerUrl.includes('.sock') ||
        lowerName.includes('docker') || lowerName.includes('swarm')
    ) return 'docker';
    if (
        lowerUrl.includes('nginx') || lowerName.includes('nginx') ||
        lowerName.includes('gateway') || lowerName.includes('balancer')
    ) return 'nginx';
    if (
        lowerName.includes('linux') || lowerName.includes('server') ||
        lowerName.includes('ubuntu') || lowerName.includes('centos')
    ) return 'linux';

    return 'http';
};

export const useServices = () => {
    const [services, setServices] = useState<Service[]>(() =>
        INITIAL_SERVICES.map(service => ({
            ...service,
            type: detectServiceType(service.url, service.name),
        }))
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            setServices(prev =>
                prev.map(service => ({
                    ...service,
                    status: Math.random() > 0.1 ? 'online' : 'offline',
                }))
            );
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleCheckStatus = useCallback((id: string) => {
        setServices(prev => prev.map(service =>
            service.id === id ? { ...service, status: 'loading' } : service
        ));

        setTimeout(() => {
            const isOnline = Math.random() > 0.2;
            setServices(prev => prev.map(service =>
                service.id === id ? { ...service, status: isOnline ? 'online' : 'error' } : service
            ));
        }, 1000 + Math.random() * 1000);
    }, []);

    const handleRefreshAll = useCallback(() => {
        services.forEach(service => handleCheckStatus(service.id));
    }, [services, handleCheckStatus]);

    const handleUpdateService = useCallback((id: string, field: 'url' | 'healthEndpoint' | 'name', value: string) => {
        setServices(prev => prev.map(service => {
            if (service.id !== id) return service;
            const updatedService = { ...service, [field]: value };
            if (field === 'url' || field === 'name') {
                updatedService.type = detectServiceType(updatedService.url, updatedService.name);
            }
            return updatedService;
        }));
    }, []);

    const handleAddService = useCallback(() => {
        const defaultUrl = 'https://api.example.com';
        const defaultName = 'New Service';
        const newService: Service = {
            id: Date.now().toString(),
            name: defaultName,
            url: defaultUrl,
            healthEndpoint: '/health',
            description: 'Newly added service monitor',
            type: detectServiceType(defaultUrl, defaultName),
            status: 'offline',
        };
        setServices(prev => [...prev, newService]);
    }, []);

    const handleDeleteService = useCallback((id: string) => {
        setServices(prev => prev.filter(service => service.id !== id));
    }, []);

    return {
        services,
        handleAddService,
        handleDeleteService,
        handleRefreshAll,
        handleCheckStatus,
        handleUpdateService,
    };
};
