import React, { useEffect, useState, useMemo } from 'react';
import { fetchWeightData, getDemoData } from './services/dataService';
import { WeightRecord, TimeRange } from './types';
import StatsCard from './components/StatsCard';
import WeightChart from './components/WeightChart';
import AggregatedStats from './components/AggregatedStats';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import BmiSection from './components/BmiSection';
import PredictionSection from './components/PredictionSection';
import { formatNumber } from './utils/formatUtils';

// Icons
const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
const TrendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

function App() {
  const [data, setData] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.ALL);
  const [usingDemoData, setUsingDemoData] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await fetchWeightData();
      if (records.length === 0) throw new Error("No data found");
      setData(records);
      setUsingDemoData(false);
    } catch (err) {
      console.error(err);
      setError("No s'ha pogut connectar amb el Google Sheet (possiblement per CORS). Mostrant dades de demostració.");
      const demo = getDemoData();
      setData(demo);
      setUsingDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  // Compute Statistics
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const currentRecord = data[data.length - 1];
    const current = currentRecord.weight;
    const currentBmi = currentRecord.bmi;
    
    const start = data[0].weight;
    const totalChange = current - start;
    
    // Last 30 days change
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRecords = data.filter(d => d.date >= thirtyDaysAgo);
    const monthAvg = recentRecords.length ? recentRecords.reduce((a, b) => a + b.weight, 0) / recentRecords.length : current;

    const min = Math.min(...data.map(d => d.weight));
    const max = Math.max(...data.map(d => d.weight));

    return {
      current,
      currentBmi,
      start,
      totalChange,
      monthAvg,
      min,
      max
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-12 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md">
              <ScaleIcon />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Seguiment de Pes</h1>
          </div>
          {usingDemoData && (
             <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full border border-yellow-200">
               Mode Demostració
             </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Error Notification */}
        {error && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-md shadow-sm flex justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">{error}</p>
              </div>
            </div>
            <button onClick={loadData} className="text-sm text-orange-600 hover:text-orange-800 underline font-medium">Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 animate-pulse">Carregant dades...</p>
          </div>
        ) : stats ? (
          <>
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Pes Actual" 
                value={`${formatNumber(stats.current)} kg`}
                subtitle={`${stats.totalChange > 0 ? '+' : ''}${formatNumber(stats.totalChange)} kg des de l'inici`}
                trend={stats.totalChange < 0 ? 'down' : stats.totalChange > 0 ? 'up' : 'neutral'}
                color="blue"
                icon={<ScaleIcon />}
              />
              <StatsCard 
                title="Mitjana (30 dies)" 
                value={`${formatNumber(stats.monthAvg)} kg`}
                subtitle="Últim mes"
                color="purple"
                icon={<CalendarIcon />}
              />
              <StatsCard 
                title="Mínim Assolit" 
                value={`${formatNumber(stats.min)} kg`}
                subtitle="Millor registre"
                color="green"
                trend="down"
              />
              <StatsCard 
                title="Màxim Registrat" 
                value={`${formatNumber(stats.max)} kg`}
                subtitle="Pic històric"
                color="red"
                trend="up"
              />
            </div>

            {/* Main Chart Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendIcon />
                    Evolució del Pes
                  </h2>
                  <p className="text-sm text-gray-500">Tendència diària i suavitzat</p>
                </div>
                
                {/* Time Range Selector */}
                <div className="bg-gray-100 p-1 rounded-lg inline-flex self-start sm:self-center">
                  {[
                    { label: '1 Mes', value: TimeRange.MONTH1 },
                    { label: '3 Mesos', value: TimeRange.MONTH3 },
                    { label: '1 Any', value: TimeRange.YEAR1 },
                    { label: 'Tot', value: TimeRange.ALL },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimeRange(option.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        timeRange === option.value
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <WeightChart data={data} timeRange={timeRange} />
            </section>

             {/* PREDICTION SECTION (New) */}
            <section>
              <PredictionSection data={data} />
            </section>

            {/* Advanced Analytics Section */}
            <section>
               <AdvancedAnalytics data={data} />
            </section>
            
            {/* BMI Section (Moved down as requested) */}
            <section>
              <BmiSection data={data} currentBmi={stats.currentBmi!} />
            </section>

            {/* Aggregated Stats Table Section */}
            <section>
              <AggregatedStats data={data} />
            </section>

          </>
        ) : (
          <div className="text-center py-20">
             <p className="text-gray-500">No s'han trobat dades vàlides al full de càlcul.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;