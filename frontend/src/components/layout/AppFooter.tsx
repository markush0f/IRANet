import React from 'react';

const AppFooter: React.FC = () => {
    return (
        <footer className="border-t border-zinc-900 mt-auto bg-zinc-950/50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">Documentation</a>
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">Support</a>
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">API Status</a>
                </div>
                <div className="text-zinc-600 text-xs font-mono">
                    v1.0.0
                </div>
            </div>
        </footer>
    );
};

export default AppFooter;
