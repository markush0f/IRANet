import React, { useEffect, useMemo, useState } from 'react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmKeyword?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    busy?: boolean;
    details?: React.ReactNode;
    onConfirm: () => void;
    onClose: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    title,
    description = 'This action cannot be undone.',
    confirmKeyword = 'DELETE',
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    busy = false,
    details,
    onConfirm,
    onClose,
}) => {
    const [input, setInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            setInput('');
        }
    }, [isOpen]);

    const canConfirm = useMemo(() => {
        if (busy) return false;
        return input.trim().toUpperCase() === confirmKeyword.toUpperCase();
    }, [busy, confirmKeyword, input]);

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
                        <p className="text-xs uppercase tracking-wide text-rose-300">Confirm delete</p>
                        <h3 className="mt-1 text-lg font-semibold text-zinc-100">{title}</h3>
                        <p className="mt-2 text-sm text-zinc-400">{description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
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
                    <label className="text-[10px] uppercase tracking-wide text-zinc-500">
                        Type {confirmKeyword} to confirm
                    </label>
                    <input
                        value={input}
                        onChange={event => setInput(event.target.value)}
                        placeholder={confirmKeyword}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-rose-500 focus:outline-none"
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
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-500/70 disabled:opacity-50"
                        disabled={!canConfirm}
                    >
                        {busy ? 'Deleting…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
