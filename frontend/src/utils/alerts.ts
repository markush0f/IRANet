export const parseAlertText = (raw: string) => {
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
            if (typeof parsed.alert === 'string') return parsed.alert;
            if (typeof parsed.message === 'string') return parsed.message;
            const fallbackString = Object.values(parsed).find(value => typeof value === 'string');
            if (typeof fallbackString === 'string') {
                return fallbackString;
            }
        }
    } catch {
        // If parsing fails fall back to raw string
    }

    return raw;
};
