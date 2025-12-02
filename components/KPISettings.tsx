import React, { useState } from 'react';
import { KPITargets } from '../types';
import { Save, Target } from 'lucide-react';

interface KPISettingsProps {
  targets: KPITargets;
  onUpdateTargets: (targets: KPITargets) => void;
}

export const KPISettings: React.FC<KPISettingsProps> = ({ targets, onUpdateTargets }) => {
  const [localTargets, setLocalTargets] = useState<KPITargets>(targets);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateTargets(localTargets);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleChange = (key: keyof KPITargets, value: string) => {
    // For conversion rate, input 65 becomes 0.65
    let numValue = parseFloat(value);
    if (key === 'conversionRate') {
      numValue = numValue / 100;
    }
    setLocalTargets(prev => ({ ...prev, [key]: numValue }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2 drop-shadow-md">
            <Target className="text-emerald-400" />
            DEFINIÇÃO DE METAS
          </h2>
          <p className="text-slate-400">Ajuste os objetivos da equipe Sharks.</p>
        </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-2xl border border-emerald-500/30 overflow-hidden">
        {/* CABEÇALHO VERDE */}
        <div className="bg-emerald-600/90 px-8 py-5 border-b border-emerald-500">
          <h3 className="text-white font-bold text-lg flex items-center gap-2 uppercase tracking-wide">
            Configuração do Período Atual
          </h3>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Meta de MRR</label>
              <div className="relative group">
                <span className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-400">R$</span>
                <input 
                  type="number" 
                  value={localTargets.mrr}
                  onChange={(e) => handleChange('mrr', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-600 bg-slate-800/50 rounded-lg focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-semibold text-lg text-white"
                />
              </div>
              <p className="text-xs text-slate-500">Receita Recorrente Mensal esperada.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Meta de Faturamento</label>
              <div className="relative group">
                <span className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-400">R$</span>
                <input 
                  type="number" 
                  value={localTargets.revenue}
                  onChange={(e) => handleChange('revenue', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-600 bg-slate-800/50 rounded-lg focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-semibold text-lg text-white"
                />
              </div>
              <p className="text-xs text-slate-500">Total de vendas brutas.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Meta de Conversão</label>
              <div className="relative group">
                <input 
                  type="number" 
                  value={(localTargets.conversionRate * 100).toFixed(1)}
                  onChange={(e) => handleChange('conversionRate', e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-600 bg-slate-800/50 rounded-lg focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-semibold text-lg text-white"
                />
                <span className="absolute right-3 top-3 text-slate-500 group-focus-within:text-emerald-400">%</span>
              </div>
              <p className="text-xs text-slate-500">Taxa de fechamento sobre leads.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Meta de Fechamentos</label>
              <input 
                type="number" 
                value={localTargets.dealsClosed}
                onChange={(e) => handleChange('dealsClosed', e.target.value)}
                className="w-full px-4 py-3 border border-slate-600 bg-slate-800/50 rounded-lg focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-semibold text-lg text-white"
              />
              <p className="text-xs text-slate-500">Número absoluto de vendas.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700/50 flex justify-end">
            <button 
              onClick={handleSave}
              className={`flex items-center gap-2 px-8 py-4 rounded-lg text-white font-bold uppercase tracking-wider transition-all transform active:scale-95 shadow-lg shadow-emerald-900/40 ${
                isSaved ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <Save size={20} />
              {isSaved ? 'Metas Atualizadas!' : 'Salvar Metas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};