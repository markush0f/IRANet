import React from 'react';
import type { LogEvent } from '../../types';

const LEVEL_LABELS: Record<number, string> = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal',
};

const LEVEL_STYLES: Record<string, string> = {
    trace: 'bg-zinc-700/40 text-zinc-200',
    debug: 'bg-sky-500/10 text-sky-200',
    info: 'bg-emerald-500/10 text-emerald-200',
    warn: 'bg-amber-500/10 text-amber-200',
    error: 'bg-rose-500/10 text-rose-200',
    fatal: 'bg-rose-500/20 text-rose-100',
};

const LEVEL_TEXT_STYLES: Record<string, string> = {
    trace: 'text-zinc-300',
    debug: 'text-sky-300',
    info: 'text-emerald-300',
    warn: 'text-amber-300',
    error: 'text-rose-300',
    fatal: 'text-rose-200',
};

interface ParsedLine {
    timestamp?: string;
    levelLabel?: string;
    message: string;
    context?: string;
}

const TEXT_LEVEL_REGEX: Array<[RegExp, string]> = [
    [/\bTRACE\b/i, 'trace'],
    [/\bDEBUG\b/i, 'debug'],
    [/\bINFO\b/i, 'info'],
    [/\bWARN(ING)?\b/i, 'warn'],
    [/\bERROR\b/i, 'error'],
    [/\bFATAL\b/i, 'fatal'],
];

const stripAnsi = (value: string): string =>
    value.replace(/\u001b\[[0-9;]*m/g, '');

const normalizeLine = (line: string): string =>
    stripAnsi(line).replace(/\r?\n/g, '').trim();

const formatTimestamp = (value: unknown): string | undefined => {
    if (value === null || value === undefined) return undefined;

    if (typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? undefined
            : date.toLocaleTimeString();
    }

    if (typeof value === 'string') {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? value
            : date.toLocaleTimeString();
    }

    return undefined;
};

const parseLogLine = (line: string | LogEvent): ParsedLine => {
    if (typeof line !== 'string') {
        return {
            timestamp: formatTimestamp(line.timestamp),
            levelLabel: line.level,
            message: normalizeLine(line.message),
            context: line.context,
        };
    }

    const trimmed = normalizeLine(line);

    if (!trimmed) {
        return { message: '' };
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            const payload = JSON.parse(trimmed) as Record<string, unknown>;

            const timestamp = formatTimestamp(
                payload.time ?? payload.timestamp ?? payload.ts
            );

            const levelValue =
                typeof payload.level === 'number' ? payload.level : undefined;

            const levelLabel =
                levelValue !== undefined
                    ? LEVEL_LABELS[levelValue]
                    : typeof payload.level === 'string'
                        ? payload.level.toLowerCase()
                        : typeof payload.level_name === 'string'
                            ? payload.level_name.toLowerCase()
                            : undefined;

            const message =
                (typeof payload.msg === 'string' && payload.msg) ||
                (typeof payload.message === 'string' && payload.message) ||
                trimmed;

            const context =
                (typeof payload.name === 'string' && payload.name) ||
                (typeof payload.context === 'string' && payload.context) ||
                undefined;

            return { timestamp, levelLabel, message, context };
        } catch {
            // Fall through to text parsing
        }
    }

    for (const [regex, level] of TEXT_LEVEL_REGEX) {
        if (regex.test(trimmed)) {
            return {
                levelLabel: level,
                message: trimmed,
            };
        }
    }

    return { message: trimmed };
};

interface LogLineProps {
    line: string | LogEvent;
}

const LogLine: React.FC<LogLineProps> = ({ line }) => {
    const parsed = parseLogLine(line);

    if (!parsed.message) {
        return null;
    }

    const badgeStyle = parsed.levelLabel
        ? LEVEL_STYLES[parsed.levelLabel] ?? LEVEL_STYLES.info
        : undefined;

    const messageStyle = parsed.levelLabel
        ? LEVEL_TEXT_STYLES[parsed.levelLabel] ?? 'text-zinc-200'
        : 'text-zinc-200';

    return (
        <div className="flex flex-wrap items-start gap-2 text-xs leading-relaxed">
            {parsed.timestamp && (
                <span className="text-zinc-500">
                    {parsed.timestamp}
                </span>
            )}

            {parsed.levelLabel && (
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeStyle}`}
                >
                    {parsed.levelLabel}
                </span>
            )}

            <span className={`font-mono break-all ${messageStyle}`}>
                {parsed.message}
            </span>

            {parsed.context && (
                <span className="text-zinc-500">
                    ({parsed.context})
                </span>
            )}
        </div>
    );
};

export default LogLine;
