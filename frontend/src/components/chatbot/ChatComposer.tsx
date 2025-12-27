import React from 'react';

interface ChatComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled: boolean;
    hint?: string;
    placeholder?: string;
}

const ChatComposer: React.FC<ChatComposerProps> = ({
    value,
    onChange,
    onSend,
    disabled,
    hint = 'The first message creates the chat if it does not exist.',
    placeholder = 'Ask about users, services, disks, or alerts...',
}) => {
    return (
        <div className="mt-4 border-t border-zinc-800 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            onSend();
                        }
                    }}
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                    type="button"
                    onClick={onSend}
                    disabled={disabled}
                    className="rounded-xl bg-indigo-500 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-800"
                >
                    {disabled ? 'Sending...' : 'Send'}
                </button>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
                {hint}
            </p>
        </div>
    );
};

export default ChatComposer;
