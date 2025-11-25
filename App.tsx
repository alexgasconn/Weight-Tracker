import React, { useState, useEffect, useMemo } from 'react';
import type { DailyLog, WeightRangeData } from './types';
import StatCard from './components/StatCard';
import WeightChart from './components/WeightChart';
import DataTable from './components/DataTable';
import WeeklyRangeChart from './components/WeeklyRangeChart';

const App: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [groupingPeriod, setGroupingPeriod] = useState<number>(7);

  useEffect(() => {
    const parseData = (csvText: string): DailyLog[] => {
      console.log('CSV preview:', csvText.slice(0, 1000)); // debug
      const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Accept several possible header names (SPAN/ENG)
      const diaCols = ['dia', 'day', 'date'];
      const pesCols = ['pes', 'peso', 'weight', 'wt'];
      const tendencyCols = ['tendency', 'tendencia', 'tend'];

      const diaIndex = headers.findIndex(h => diaCols.includes(h));
      const pesIndex = headers.findIndex(h => pesCols.includes(h));
      const tendencyIndex = headers.findIndex(h => tendencyCols.includes(h));

      if (diaIndex === -1 || pesIndex === -1 || tendencyIndex === -1) {
        console.error('CSV headers found:', headers);
        throw new Error('CSV must include columns: Dia/Day/Date, Pes/Weight, and Tendency (header names are flexible). Found: ' + headers.join(', '));
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const dateStr = values[diaIndex];
        if (!dateStr || dateStr.trim() === '') return null;

        // try several date formats: dd/MM/yyyy or yyyy-MM-dd
        let date: Date | null = null;
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            date = new Date(year, month - 1, day);
          }
        } else if (dateStr.includes('-')) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) date = d;
        }
        if (!date || isNaN(date.getTime())) return null;

        const safeParseFloat = (val: string | undefined) => {
          if (!val || val.trim() === '') return null;
          const v = parseFloat(val.replace(',', '.'));
          return isNaN(v) ? null : v;
        };

        return {
          date,
          dateString: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          weight: safeParseFloat(values[pesIndex]),
          tendency: safeParseFloat(values[tendencyIndex]),
        };
      }).filter((log): log is DailyLog => log !== null);

      return data.sort((a, b) => a.date.getTime() - b.date.getTime());
    };

    const fetchData = async () => {
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQHBxexfNwpTBj3uAfTsa-3Y3ZUK7d88pfQBroQdkVtHHABVCvoWVsQdim3MtbQjOCgGukDvqiO3hOB/pub?gid=0&single=true&output=csv';
      try {
        setLoading(true);
        const response = await fetch(sheetUrl);
        console.log('fetch status', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        console.log('CSV length:', csvText.length);
        const parsedData = parseData(csvText);
        setLogs(parsedData);
      } catch (err: any) {
        console.error('Load error:', err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    if (logs.length === 0) return null;

    const weightLogs = logs.filter(log => log.weight !== null);
    if (weightLogs.length === 0) return null;

    const firstWeight = weightLogs[0]?.weight ?? 0;
    const currentWeight = weightLogs[weightLogs.length - 1]?.weight ?? 0;
    const weightChange = currentWeight - firstWeight;

    return {
      currentWeight,
      weightChange,
      firstWeight,
      daysTracked: logs.length
    };
  }, [logs]);

  const rangeData = useMemo<WeightRangeData[]>(() => {
    const weightLogs = logs.filter(log => typeof log.weight === 'number');
    if (weightLogs.length === 0) return [];

    const chunks: DailyLog[][] = [];
    for (let i = 0; i < weightLogs.length; i += groupingPeriod) {
      chunks.push(weightLogs.slice(i, i + groupingPeriod));
    }

    return chunks.map((chunk) => {
      const weights = chunk.map(log => log.weight!);
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      const firstDate = chunk[0].dateString;

      return {
        periodLabel: firstDate,
        range: [minWeight, maxWeight]
      };
    });
  }, [logs, groupingPeriod]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <p className="text-2xl text-slate-400 animate-pulse">Cargando datos del panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <p className="text-2xl text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <p className="text-2xl text-slate-400">No hay datos de peso para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Panel de Peso</h1>
          <p className="text-slate-400 mt-1">Un resumen visual de tu progreso.</p>
        </header>

        <main>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Peso Actual" value={stats.currentWeight.toFixed(2)} unit="kg" />
            <StatCard title="Cambio Total" value={stats.weightChange.toFixed(2)} unit="kg" trend={stats.weightChange > 0 ? 'up' : 'down'} />
            <StatCard title="Peso Inicial" value={stats.firstWeight.toFixed(2)} unit="kg" />
            <StatCard title="Días Registrados" value={stats.daysTracked} />
          </div>

          <div className="bg-secondary rounded-xl p-4 sm:p-6 shadow-lg mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Evolución del Peso</h2>
            <WeightChart data={logs} />
          </div>

          <div className="bg-secondary rounded-xl p-4 sm:p-6 shadow-lg mb-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-white">Rango de Peso (Mín/Máx)</h2>
              <div className="flex items-center space-x-2 bg-primary p-1 rounded-lg">
                {[7, 14, 30].map(period => (
                  <button
                    key={period}
                    onClick={() => setGroupingPeriod(period)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${groupingPeriod === period ? 'bg-accent text-white shadow' : 'text-slate-300 hover:bg-slate-700'}`}
                  >
                    {period} días
                  </button>
                ))}
              </div>
            </div>
            <WeeklyRangeChart data={rangeData} />
          </div>

          <div className="bg-secondary rounded-xl p-4 sm:p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Registro Completo</h2>
            <DataTable data={logs} />
          </div>
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
          <p>Dashboard de Peso con React y Google Sheets.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
