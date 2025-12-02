import React from 'react';
import { ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  target: string;
  achievement: number; // 0-100+
  isPercentage?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  target, 
  achievement, 
  isPercentage = false 
}) => {
  const isPositive = achievement >= 100;
  
  return (
    // Card com efeito Dark Glass (Vidro Escuro) para destacar o fundo
    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-xl border border-slate-700/50 p-6 flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-cyan-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-black text-white mt-1 tracking-tight drop-shadow-md">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'} border border-white/5`}>
          {isPositive ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
        </div>
      </div>
      
      <div className="mt-auto relative z-10">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Target size={14} /> Meta: <span className="text-slate-200">{target}</span>
          </span>
          <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {achievement.toFixed(1)}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${isPositive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} 
            style={{ width: `${Math.min(achievement, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};