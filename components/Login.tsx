
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Info } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  loading: boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email && password) {
      if (password.length < 4) {
          setError('A senha é muito curta.');
          return;
      }
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header Visual */}
        <div className="p-8 text-center relative overflow-hidden border-b border-slate-700/50">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-600"></div>
           <div className="mb-4 flex justify-center">
              {/* Shark Logo - Link Permanente Confiável */}
              <div className="w-40 h-40 relative group filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <img 
                  src="https://img.icons8.com/fluency/512/shark.png" 
                  alt="Shark Logo" 
                  className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                />
              </div>
           </div>
           
           <h1 className="text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
             SHARKS
           </h1>
           <p className="text-cyan-400 font-bold tracking-widest text-xs uppercase mt-1 drop-shadow-md">Sales Team Performance</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Email Corporativo</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="voce@sharks.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500 shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500 shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
                <div className="text-red-400 text-sm font-bold text-center bg-red-900/20 border border-red-900/50 p-2 rounded backdrop-blur-sm">
                    {error}
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-cyan-900/50 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed border border-cyan-500/20"
            >
              {loading ? (
                <span className="animate-pulse">Autenticando...</span>
              ) : (
                <>
                  ACESSAR SISTEMA
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Dica de Acesso / Rodapé Interativo */}
          <div className="mt-6 text-center group relative">
            <p className="text-xs text-slate-500 cursor-help flex items-center justify-center gap-1 hover:text-cyan-400 transition-colors">
              <Info size={12} />
              Lista de Acesso SHARKS
            </p>
            
            {/* Tooltip com Credenciais */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-800 border border-slate-600 p-4 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-xs text-left max-h-64 overflow-y-auto custom-scrollbar">
              <p className="font-bold text-cyan-400 mb-2 border-b border-slate-700 pb-1">Senha Padrão: 12345678</p>
              
              <div className="space-y-3">
                 <div className="bg-slate-700/50 p-2 rounded border border-amber-500/30">
                    <span className="block text-amber-400 font-bold uppercase text-[10px]">Gestão (Visão Total)</span>
                    <span className="text-white font-mono select-all block">gestao@sharks.com</span>
                 </div>
                 
                 <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-2">Equipe de Vendas</p>
                    {[
                        'bruna@sharks.com.br',
                        'alessandro@sharks.com',
                        'janaina@sharks.com',
                        'karoline@sharks.com',
                        'anacarolise@sharks.com',
                        'lucas@sharks.com',
                        'davi@sharks.com',
                        'gika@sharks.com'
                    ].map(email => (
                        <div key={email} className="border-b border-slate-700 pb-1 last:border-0">
                            <span className="text-slate-200 font-mono select-all block hover:text-cyan-300 transition-colors">{email}</span>
                        </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};