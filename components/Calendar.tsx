import React, { useMemo, useState } from 'react';
import { WeightRecord } from '../types';
import { formatNumber } from '../utils/formatUtils';

interface CalendarProps {
    data: WeightRecord[];
}

const weekdayLabels = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const Calendar: React.FC<CalendarProps> = ({ data }) => {
    const [visibleMonth, setVisibleMonth] = useState(() => new Date());
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
    const [colorize, setColorize] = useState<boolean>(false);

    const recordsByDay = useMemo(() => {
        const map = new Map<string, WeightRecord>();
        data.forEach(r => {
            const key = `${r.date.getFullYear()}-${r.date.getMonth()}-${r.date.getDate()}`;
            map.set(key, r);
        });
        return map;
    }, [data]);

    // global min/max across all data (used for conditional coloring)
    const globalMinMax = useMemo(() => {
        if (!data || data.length === 0) return null;
        const vals = data.map(d => d.weight);
        return { min: Math.min(...vals), max: Math.max(...vals) };
    }, [data]);

    const weightToColor = (w: number | null) => {
        if (w === null || !globalMinMax) return undefined;
        const { min, max } = globalMinMax;
        if (min === max) return `hsl(60, 70%, 85%)`;
        const ratio = (w - min) / (max - min);
        // apply a mild non-linear curve to increase perceptual differences slightly
        const adj = Math.pow(ratio, 0.75);
        // hue: green (120) for low -> red (0) for high
        const hue = (1 - adj) * 120;
        // increase saturation and reduce lightness slightly with higher values
        const saturation = Math.round(65 + adj * 15); // 65% -> 80%
        const lightness = Math.round(94 - adj * 8);   // 94% -> 86%
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const monthGrid = useMemo(() => {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();
        const firstOfMonth = new Date(year, month, 1);

        // Monday start: convert JS Sunday=0 -> Monday index
        const startOffset = (firstOfMonth.getDay() + 6) % 7;
        const startDate = new Date(firstOfMonth);
        startDate.setDate(firstOfMonth.getDate() - startOffset);

        const days: Date[] = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            days.push(d);
        }
        return days;
    }, [visibleMonth]);

    const weekGrid = useMemo(() => {
        // week starting Monday for the visibleMonth date
        const center = new Date(visibleMonth);
        const day = center.getDay();
        const mondayOffset = (day + 6) % 7; // 0=Monday
        const start = new Date(center);
        start.setDate(center.getDate() - mondayOffset);
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [visibleMonth]);

    const yearTiles = useMemo(() => {
        const year = visibleMonth.getFullYear();
        const months = [] as { month: number; avg: number | null }[];
        for (let m = 0; m < 12; m++) {
            const start = new Date(year, m, 1);
            const end = new Date(year, m + 1, 1);
            const monthRecords = data.filter(d => d.date >= start && d.date < end).map(d => d.weight);
            const avg = monthRecords.length ? monthRecords.reduce((a, b) => a + b, 0) / monthRecords.length : null;
            months.push({ month: m, avg });
        }
        return months;
    }, [visibleMonth, data]);

    const goMonth = (delta: number) => {
        const next = new Date(visibleMonth);
        next.setMonth(next.getMonth() + delta);
        setVisibleMonth(next);
    };

    const goWeek = (delta: number) => {
        const next = new Date(visibleMonth);
        next.setDate(next.getDate() + delta * 7);
        setVisibleMonth(next);
    };

    const goYear = (delta: number) => {
        const next = new Date(visibleMonth);
        next.setFullYear(next.getFullYear() + delta);
        setVisibleMonth(next);
    };

    const findPreviousRecord = (currentDate: Date) => {
        // find last record strictly before currentDate
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i].date.getTime() < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime()) {
                return data[i];
            }
        }
        return null;
    };

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">Calendari</h3>
                    <p className="text-sm text-gray-500">Navega per setmana/mes/any i veu el pes diari amb la seva variació</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-md bg-gray-50 p-1">
                        <button onClick={() => setViewMode('weekly')} className={`px-3 py-1 text-sm ${viewMode === 'weekly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Setmana</button>
                        <button onClick={() => setViewMode('monthly')} className={`px-3 py-1 text-sm ${viewMode === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Mes</button>
                        <button onClick={() => setViewMode('yearly')} className={`px-3 py-1 text-sm ${viewMode === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Any</button>
                    </div>

                    {viewMode === 'weekly' && (
                        <>
                            <button onClick={() => goWeek(-1)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">‹</button>
                            <div className="px-3 py-1 rounded-md bg-gray-50 text-sm font-medium">{visibleMonth.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <button onClick={() => goWeek(1)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">›</button>
                        </>
                    )}

                    {viewMode === 'monthly' && (
                        <>
                            <button onClick={() => goMonth(-1)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">‹</button>
                            <div className="px-3 py-1 rounded-md bg-gray-50 text-sm font-medium">{visibleMonth.toLocaleString('ca-ES', { month: 'long', year: 'numeric' })}</div>
                            <button onClick={() => goMonth(1)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">›</button>
                        </>
                    )}

                    {viewMode === 'yearly' && (
                        <>
                            <button onClick={() => goYear(-1)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">‹</button>
                            <div className="px-3 py-1 rounded-md bg-gray-50 text-sm font-medium">{visibleMonth.getFullYear()}</div>
                            <button onClick={() => goYear(1)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">›</button>
                        </>
                    )}

                    <button onClick={() => setColorize(c => !c)} className={`ml-3 px-3 py-1 rounded-md text-sm ${colorize ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border'}`}>{colorize ? 'Color activat' : 'Colorir per valors'}</button>
                </div>
            </div>

            {viewMode === 'monthly' && (
                <div className="grid grid-cols-7 gap-2 text-center">
                    {weekdayLabels.map(w => (
                        <div key={w} className="text-xs font-semibold text-gray-500">{w}</div>
                    ))}

                    {monthGrid.map((d) => {
                        const inMonth = d.getMonth() === visibleMonth.getMonth();
                        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                        const record = recordsByDay.get(key);
                        const prev = record ? findPreviousRecord(d) : null;
                        const delta = record && prev ? parseFloat((record.weight - prev.weight).toFixed(2)) : null;

                        const deltaClass = delta === null ? 'text-gray-400' : delta > 0 ? 'text-rose-600' : delta < 0 ? 'text-emerald-600' : 'text-gray-600';

                        // subtle highlight for days with data
                        const hasDataBg = record ? 'bg-indigo-50 border border-indigo-100' : (inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400');
                        const bgStyle = colorize && record ? { background: weightToColor(record.weight) } : undefined;

                        return (
                            <div key={key} style={bgStyle} className={`p-2 rounded-lg min-h-[64px] flex flex-col items-center justify-start text-sm ${hasDataBg}`}>
                                <div className="w-full flex justify-between items-start">
                                    <span className={`text-xs font-medium ${inMonth ? '' : 'opacity-60'}`}>{d.getDate()}</span>
                                </div>

                                {record ? (
                                    <div className="mt-1 text-center">
                                        <div className="text-sm font-semibold text-indigo-700">{formatNumber(record.weight)} kg</div>
                                        <div className={`text-[11px] mt-0.5 ${deltaClass}`}>{delta === null ? '—' : delta > 0 ? `+${formatNumber(delta)} ↑` : delta < 0 ? `${formatNumber(Math.abs(delta))} ↓` : '0.00'}</div>
                                    </div>
                                ) : (
                                    <div className="mt-1 text-[12px] text-gray-300">—</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {viewMode === 'weekly' && (
                <div className="grid grid-cols-7 gap-2 text-center">
                    {weekdayLabels.map(w => (
                        <div key={w} className="text-xs font-semibold text-gray-500">{w}</div>
                    ))}
                    {weekGrid.map((d) => {
                        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                        const record = recordsByDay.get(key);
                        const prev = record ? findPreviousRecord(d) : null;
                        const delta = record && prev ? parseFloat((record.weight - prev.weight).toFixed(2)) : null;
                        const deltaClass = delta === null ? 'text-gray-400' : delta > 0 ? 'text-rose-600' : delta < 0 ? 'text-emerald-600' : 'text-gray-600';
                        const bgStyle = colorize && record ? { background: weightToColor(record.weight) } : undefined;
                        return (
                            <div key={key} style={bgStyle} className={`p-2 rounded-lg min-h-[64px] flex flex-col items-center justify-start text-sm bg-white`}>
                                <div className="w-full flex justify-between items-start">
                                    <span className={`text-xs font-medium`}>{d.getDate()}</span>
                                </div>
                                {record ? (
                                    <div className="mt-1 text-center">
                                        <div className="text-sm font-semibold text-indigo-700">{formatNumber(record.weight)} kg</div>
                                        <div className={`text-[11px] mt-0.5 ${deltaClass}`}>{delta === null ? '—' : delta > 0 ? `+${formatNumber(delta)} ↑` : delta < 0 ? `${formatNumber(Math.abs(delta))} ↓` : '0.00'}</div>
                                    </div>
                                ) : (
                                    <div className="mt-1 text-[12px] text-gray-300">—</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {viewMode === 'yearly' && (
                <div className="grid grid-cols-4 gap-3">
                    {yearTiles.map((t) => {
                        const monthName = new Date(visibleMonth.getFullYear(), t.month, 1).toLocaleString('ca-ES', { month: 'short' });
                        const bgStyle = colorize && t.avg !== null ? { background: weightToColor(t.avg) } : undefined;
                        return (
                            <div key={t.month} style={bgStyle} className="p-3 rounded-md border border-gray-100 flex flex-col items-start">
                                <div className="text-xs text-gray-500 font-medium">{monthName}</div>
                                <div className="text-sm font-semibold text-gray-800 mt-1">{t.avg !== null ? `${formatNumber(t.avg)} kg` : '—'}</div>
                                <button onClick={() => { setVisibleMonth(new Date(visibleMonth.getFullYear(), t.month, 1)); setViewMode('monthly'); }} className="mt-2 text-xs text-gray-500 underline">Veure mes</button>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default Calendar;
