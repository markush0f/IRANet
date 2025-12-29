import React, { useEffect, useMemo, useState } from 'react';

interface EditApplicationModalProps {
    isOpen: boolean;
    initialName: string;
    title?: string;
    busy?: boolean;
    details?: React.ReactNode;
    onClose: () => void;
    onSave: (name: string) => void;
}

const EditApplicationModal: React.FC<EditApplicationModalProps> = ({
    isOpen,
    initialName,
    title = 'Edit application',
    busy = false,
    details,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState(initialName);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
        }
    }, [initialName, isOpen]);

    const trimmed = name.trim();
    const canSave = useMemo(() => {
        if (busy) return false;
        if (!trimmed) return false;
        return trimmed !== initialName.trim();
    }, [busy, initialName, trimmed]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 sm:py-10">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => {
                    if (!busy) onClose();
                }}
            />
            <div
                className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                onClick={event => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-indigo-300">Edit</p>
                        <h3 className="mt-1 text-lg font-semibold text-zinc-100">{title}</h3>
                        <p className="mt-2 text-sm text-zinc-400">Update the application name.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50"
                        disabled={busy}
                    >
                        ✕
                    </button>
                </div>

                {details && (
                    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-300">
                        {details}
                    </div>
                )}

                <div className="mt-4 space-y-2">
                    <label className="text-[10px] uppercase tracking-wide text-zinc-500">Name</label>
                    <input
                        value={name}
                        onChange={event => setName(event.target.value)}
                        placeholder="IRABackend"
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                        disabled={busy}
                        autoFocus
                    />
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-50"
                        disabled={busy}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(trimmed)}
                        className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-200 transition hover:border-indigo-500/70 disabled:opacity-50"
                        disabled={!canSave}
                    >
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditApplicationModal;

