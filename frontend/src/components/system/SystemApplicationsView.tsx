import React from 'react';
import { MOCK_SYSTEM_APPLICATIONS } from '../../mockData';
import SystemApplicationsSection from './SystemApplicationsSection';

const SystemApplicationsView: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-8">
            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Applications</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">System applications</h2>
                <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                    Colección de directorios sobre los que el sistema ejecuta comandos críticos. Cada entrada muestra los binarios disponibles y permite añadir nuevas aplicaciones del sistema para monitorear.
                </p>
            </div>

            <SystemApplicationsSection applications={MOCK_SYSTEM_APPLICATIONS} />
        </div>
    );
};

export default SystemApplicationsView;
