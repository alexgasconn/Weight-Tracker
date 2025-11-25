import React from 'react';
import { AiInsight } from '../types';

interface InsightCardProps {
  insight: AiInsight | null;
  loading: boolean;
  onAnalyze: () => void;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, loading, onAnalyze }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-400 opacity-10 rounded-full blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Anàlisi Intel·ligent (IA)
          </h2>
          {!insight && !loading && (
             <button 
             onClick={onAnalyze}
             className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
           >
             Generar Informe
           </button>
          )}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-white bg-opacity-20 rounded w-3/4"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-1/2"></div>
            <div className="h-20 bg-white bg-opacity-10 rounded mt-4"></div>
          </div>
        ) : insight ? (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-10">
              <h3 className="text-xs uppercase tracking-wider text-indigo-200 mb-1">Resum de Tendència</h3>
              <p className="text-lg font-medium leading-snug">{insight.summary}</p>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 bg-white bg-opacity-10 rounded-xl p-4 border border-white border-opacity-10">
                 <h3 className="text-xs uppercase tracking-wider text-indigo-200 mb-1">Consell</h3>
                 <p className="text-sm opacity-90 italic">"{insight.advice}"</p>
              </div>
              <div className="flex flex-col justify-center items-center bg-white bg-opacity-10 rounded-xl p-4 w-24 border border-white border-opacity-10">
                 <h3 className="text-xs uppercase tracking-wider text-indigo-200 mb-2">Estat</h3>
                 {insight.trend === 'positive' && <span className="text-3xl">👍</span>}
                 {insight.trend === 'negative' && <span className="text-3xl">⚠️</span>}
                 {insight.trend === 'stable' && <span className="text-3xl">⚖️</span>}
              </div>
            </div>
             <button 
               onClick={onAnalyze}
               className="mt-2 text-xs text-indigo-200 hover:text-white underline opacity-80"
             >
               Actualitzar anàlisi
             </button>
          </div>
        ) : (
          <div className="text-center py-6 text-indigo-100 opacity-80">
            Prem el botó per analitzar els teus patrons de pes amb Gemini AI.
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightCard;