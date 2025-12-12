import React, { type ReactNode } from 'react';

interface ServiceGridProps {
    children: ReactNode;
}

const ServiceGrid: React.FC<ServiceGridProps> = ({ children }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {children}
        </div>
    );
};

export default ServiceGrid;
