import React from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { ChartType } from './ChartTypeSelector';

interface ChartDataPoint {
    time: string;
    value: number;
    fullTimestamp: string;
}

interface ChartCanvasProps {
    chartData: ChartDataPoint[];
    selectedChartType: ChartType;
    metric: string;
    strokeColor: string;
    fillColor: string;
    valueFormatter: (value: number) => string;
    yDomain?: [number, number];
}

const CustomTooltip = ({ active, payload, formatter }: { active?: boolean; payload?: any; formatter: (value: number) => string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                <p className="text-xs text-zinc-400 mb-1">{payload[0].payload.fullTimestamp}</p>
                <p className="text-lg font-bold text-emerald-300">{formatter(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

const ChartCanvas: React.FC<ChartCanvasProps> = ({
    chartData,
    selectedChartType,
    metric,
    strokeColor,
    fillColor,
    valueFormatter,
    yDomain,
}) => {
    const commonProps = {
        data: chartData,
        margin: { top: 5, right: 20, left: 0, bottom: 5 },
    };

    const commonXAxisProps = {
        dataKey: 'time',
        stroke: '#71717a',
        style: { fontSize: '12px' },
        tickLine: false,
        tick: { fill: '#a1a1aa', fontSize: 12 },
        interval: 'preserveStartEnd' as const,
    };

    const commonYAxisProps = {
        stroke: '#a1a1aa',
        style: { fontSize: '12px' },
        tickLine: false,
        tick: { fill: '#e5e7eb', fontSize: 12, fontWeight: 600 },
        tickFormatter: (value: number) => valueFormatter(value),
        width: 70,
        domain: yDomain,
    };

    if (!chartData.length) {
        return (
            <div className="flex h-[300px] items-center justify-center text-xs text-zinc-500">
                No data to display. You can start live tracking or choose a range.
            </div>
        );
    }

    const chartElement = (() => {
        if (selectedChartType === 'area') {
            return (
                <AreaChart {...commonProps}>
                    <defs>
                        <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={fillColor} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={fillColor} stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis {...commonXAxisProps} />
                    <YAxis {...commonYAxisProps} />
                    <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={3}
                        fill={`url(#gradient-${metric})`}
                        animationDuration={300}
                    />
                </AreaChart>
            );
        }

        if (selectedChartType === 'line') {
            return (
                <LineChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis {...commonXAxisProps} />
                    <YAxis {...commonYAxisProps} />
                    <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={3}
                        dot={{ fill: strokeColor, r: 2 }}
                        activeDot={{ r: 5 }}
                        animationDuration={300}
                    />
                </LineChart>
            );
        }

        if (selectedChartType === 'bar') {
            return (
                <BarChart {...commonProps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis {...commonXAxisProps} />
                    <YAxis {...commonYAxisProps} />
                    <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                    <Bar dataKey="value" fill={fillColor} radius={[4, 4, 0, 0]} animationDuration={300} />
                </BarChart>
            );
        }

        return (
            <ComposedChart {...commonProps}>
                <defs>
                    <linearGradient id={`gradient-composed-${metric}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={fillColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={fillColor} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis {...commonXAxisProps} />
                <YAxis {...commonYAxisProps} />
                <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                <Area type="monotone" dataKey="value" fill={`url(#gradient-composed-${metric})`} stroke="none" />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={strokeColor}
                    strokeWidth={3}
                    dot={false}
                />
            </ComposedChart>
        );
    })();

    return (
        <div className="h-[320px] sm:h-[380px] pt-12 sm:pt-14 pb-8 sm:pb-10">
            <ResponsiveContainer width="100%" height="100%">
                {chartElement}
            </ResponsiveContainer>
        </div>
    );
};

export default ChartCanvas;
