import React, { useEffect, useState } from 'react';

const IraTermView: React.FC = () => {
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('http://localhost:8000/extensions/iraterm/status')
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error('Extension not available');
                }

                const data = await res.json();
                console.log('STATUS RESPONSE:', data);
                return data;
            })
            .then((data) => {
                setUrl(data.frontend_url);
            })
            .catch((err) => {
                setError(err.message);
            });
    }, []);


    if (error) {
        return (
            <div className="text-red-400 text-sm p-4">
                {error}
            </div>
        );
    }

    if (!url) {
        return (
            <div className="text-zinc-400 text-sm p-4">
                Loading IRATerm...
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-0 w-full">
            <iframe
                title="IRATerm"
                src={url}
                className="block w-full h-full"
                sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-downloads"
                allow="clipboard-read; clipboard-write"
                allowFullScreen
            />
        </div>
    );
};

export default IraTermView;
