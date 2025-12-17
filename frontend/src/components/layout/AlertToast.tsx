import React from 'react';
import type { Toast } from 'react-hot-toast';
import { toast as toastController } from 'react-hot-toast';

interface AlertToastProps {
    toast: Toast;
    message: string;
}

const AlertToast: React.FC<AlertToastProps> = ({ toast, message }) => {
    const handleClose = () => {
        toastController.dismiss(toast.id);
        toastController.remove(toast.id);
    };

    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-rose-500/60 bg-rose-950/90 px-4 py-3 text-sm text-rose-50 shadow-lg">
            <div className="flex flex-1 items-start gap-3">
                <span role="img" aria-label="alert" className="text-lg leading-none">
                    ⚠️
                </span>
                <p className="text-left leading-relaxed">{message}</p>
            </div>
            <button
                type="button"
                className="text-xs font-semibold uppercase tracking-wide text-rose-200 underline-offset-4 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                onClick={handleClose}
            >
                Cerrar
            </button>
        </div>
    );
};

export default AlertToast;
