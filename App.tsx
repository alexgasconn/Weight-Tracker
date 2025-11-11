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
      const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const diaIndex = headers.indexOf('dia');
      const pesIndex = headers.indexOf('pes');
      const tendencyIndex = headers.indexOf('tendency');

      if (diaIndex === -1 || pesIndex === -1 || tendencyIndex === -1) {
        throw new Error('Las cabeceras del CSV deben incluir: Dia, Pes, Tendency');
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const dateStr = values[diaIndex];
        if (!dateStr || dateStr.trim() === '') return null;

        const dateParts = dateStr.split('/');
        if (dateParts.length !== 3) return null;
        
        const [day, month, year] = dateParts.map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year) || year < 2000) return null;

        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return null;

        const safeParseFloat = (val: string | undefined) => {
          if (!val || val.trim() === '') return null;
          return parseFloat(val.replace(',', '.'));
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
        if (!response.ok) {
          throw new Error(`Error al cargar los datos: ${response.statusText}`);
        }
        const csvText = await response.text();
        const parsedData = parseData(csvText);
        setLogs(parsedData);
      } catch (err: any) {
        setError(err.message);
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
