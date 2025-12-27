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
    placeholder = 'Ask about users, services, disks, or alerts...',
}) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-end gap-3">
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            onSend();
                        }
                    }}
                    className="flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <button
                    type="button"
                    onClick={onSend}
                    disabled={disabled}
                    className="h-[42px] shrink-0 rounded-xl bg-indigo-500 px-5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-800"
                >
                    {disabled ? 'Sending…' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatComposer;
