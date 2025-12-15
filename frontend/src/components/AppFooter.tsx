import React from 'react';

const AppFooter: React.FC = () => {
    return (
        <footer className="border-t border-zinc-900 mt-auto bg-zinc-950/50 py-8 px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">Documentation</a>
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">Support</a>
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">API Status</a>
                </div>
                <div className="text-zinc-600 text-xs font-mono">
                    System v2.1.0-dark
                </div>
            </div>
        </footer>
    );
};

export default AppFooter;

