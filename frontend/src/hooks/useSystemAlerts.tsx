import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AlertToast from '../components/layout/AlertToast';
import { getBaseUrl } from '../services/api';
import { parseAlertText } from '../utils/alerts';

export const useSystemAlerts = () => {
    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const showAlert = (message: string) => {
            toast.custom((t) => <AlertToast toast={ t } message = { message } />, {
                duration: 0,
            });
        };

        const baseUrl = getBaseUrl();
        const wsUrl = new URL(baseUrl);
        wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl.pathname = '/ws/alerts';
        const websocket = new WebSocket(wsUrl.toString());

        const handleMessage = (event: MessageEvent) => {
            showAlert(parseAlertText(event.data));
        };

        const handleError = () => {
            showAlert('No se pudo conectar con el canal de alertas del sistema.');
        };

        websocket.addEventListener('message', handleMessage);
        websocket.addEventListener('error', handleError);

        return () => {
            websocket.removeEventListener('message', handleMessage);
            websocket.removeEventListener('error', handleError);
            websocket.close();
        };
    }, []);
};
