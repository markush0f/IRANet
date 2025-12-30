import React from 'react';

const IraTermView: React.FC = () => {
    return (
        <div className="flex-1 min-h-0 w-full">
            <iframe
                title="IRATerm"
                src="http://localhost:3010/"
                className="block w-full h-full"
                sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-downloads"
                allow="clipboard-read; clipboard-write"
                allowFullScreen
            />
        </div>
    );
};

export default IraTermView;
