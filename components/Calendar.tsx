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

    const recordsByDay = useMemo(() => {
        const map = new Map<string, WeightRecord>();
        data.forEach(r => {
            const key = `${r.date.getFullYear()}-${r.date.getMonth()}-${r.date.getDate()}`;
            map.set(key, r);
        });
        return map;
    }, [data]);

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

    const goMonth = (delta: number) => {
        const next = new Date(visibleMonth);
        next.setMonth(next.getMonth() + delta);
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
                    <p className="text-sm text-gray-500">Navega mesos i veu el pes diari amb la seva variació</p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => goMonth(-1)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">‹</button>
                    <div className="px-3 py-1 rounded-md bg-gray-50 text-sm font-medium">{visibleMonth.toLocaleString('ca-ES', { month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => goMonth(1)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">›</button>
                </div>
            </div>

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

                    return (
                        <div key={key} className={`p-2 rounded-lg min-h-[64px] flex flex-col items-center justify-start text-sm ${inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}>
                            <div className="w-full flex justify-between items-start">
                                <span className="text-xs font-medium">{d.getDate()}</span>
                            </div>

                            {record ? (
                                <div className="mt-1 text-center">
                                    <div className="text-sm font-semibold">{formatNumber(record.weight)} kg</div>
                                    <div className={`text-[11px] mt-0.5 ${deltaClass}`}>{delta === null ? '—' : delta > 0 ? `+${formatNumber(delta)} ↑` : delta < 0 ? `${formatNumber(Math.abs(delta))} ↓` : '0.00'}</div>
                                </div>
                            ) : (
                                <div className="mt-1 text-[12px] text-gray-300">—</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default Calendar;
