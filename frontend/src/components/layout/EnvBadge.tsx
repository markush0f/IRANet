import React from 'react';

const EnvBadge: React.FC = () => {
    const envName = (import.meta.env.VITE_ENV_NAME as string | undefined) ?? 'unknown';
    const mode = import.meta.env.MODE;

    return (
        <div className="env-badge">
            env: {envName} ({mode})
        </div>
    );
};

export default EnvBadge;
