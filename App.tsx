
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Target, BrainCircuit, Menu, LogOut, User as UserIcon, FileText, Download, X, TrendingUp, Filter, Crown, Trophy, Users, PieChart as PieChartIcon, BarChart3, Key, Lock, CheckCircle } from 'lucide-react';
import { KPITargets, Sale, SalesStatus, TabView, User } from './types';
import { SalesTable } from './components/SalesTable';
import { KPISettings } from './components/KPISettings';
import { KPICard } from './components/KPICard';
import { Login } from './components/Login';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { generateSalesInsights } from './services/geminiService';
import { authService, dataService } from './services/mockBackend';

// Cores Sharks (Neon Blue, Emerald Green, Cyan, etc)
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function App() {
  // ESTADOS DE AUTENTICAÇÃO
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // ESTADOS DA APLICAÇÃO
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [sales, setSales] = useState<Sale[]>([]);
  const [targets, setTargets] = useState<KPITargets>({
    mrr: 0, revenue: 0, conversionRate: 0, dealsClosed: 0
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // ESTADO DE RELATÓRIO (PREVIEW)
  const [showReportPreview, setShowReportPreview] = useState(false);
  
  // Estado da IA
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // ESTADO MODAL SENHA
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // CARREGAR DADOS AO LOGAR
  useEffect(() => {
    if (user) {
      // Se for Admin, dataService retorna dados de TODA a equipe
      const { sales: loadedSales, targets: loadedTargets } = dataService.loadUserData(user.id, user.isAdmin);
      setSales(loadedSales);
      setTargets(loadedTargets);
      setAiInsight(""); 
    }
  }, [user]);

  // SALVAR DADOS AUTOMATICAMENTE (EFEITO COLATERAL)
  useEffect(() => {
    if (user) {
      dataService.saveSales(user.id, sales);
    }
  }, [sales, user]);

  useEffect(() => {
    if (user) {
      dataService.saveTargets(user.id, targets);
    }
  }, [targets, user]);

  // HANDLERS DE AUTH
  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
    } catch (e: any) {
      alert(e.message || "Erro no login");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setSales([]);
    setShowReportPreview(false);
    setShowPasswordModal(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          alert("As senhas não coincidem!");
          return;
      }
      if (newPassword.length < 4) {
          alert("A senha deve ter pelo menos 4 caracteres.");
          return;
      }
      
      if (user) {
          await authService.updatePassword(user.id, newPassword);
          setPasswordStatus('success');
          setTimeout(() => {
              setPasswordStatus('idle');
              setShowPasswordModal(false);
              setNewPassword('');
              setConfirmPassword('');
          }, 1500);
      }
  };

  // HANDLERS DE DADOS
  const handleAddSale = (sale: Sale) => {
      // Se for admin criando venda, atribui ao Admin, ou poderia selecionar o vendedor. 
      // Por simplificação, atribui ao próprio usuário logado.
      const saleWithSeller = { ...sale, sellerName: user?.name };
      setSales([...sales, saleWithSeller]);
  };
  
  const handleDeleteSale = (id: string) => setSales(sales.filter(s => s.id !== id));
  
  // Função atualizada para edição (Se ID existe, substitui. Se não, adiciona - tratado no Table)
  const handleUpdateSale = (updatedSale: Sale) => {
    setSales(sales.map(s => s.id === updatedSale.id ? updatedSale : s));
  };
  
  const fetchInsights = async () => {
    setLoadingAi(true);
    const result = await generateSalesInsights(sales, targets);
    setAiInsight(result);
    setLoadingAi(false);
  };

  // HANDLER DE IMPRESSÃO (PDF)
  const handlePrint = () => {
    window.print();
  };

  // --- LÓGICA DE CÁLCULO DE MÉTRICAS ---
  // Considera VENDIDO e VENDIDO PAGO como vendas realizadas
  const closedSales = sales.filter(s => s.status === SalesStatus.Sold || s.status === SalesStatus.SoldPaid);
  
  const totalRevenue = closedSales.reduce((acc, s) => acc + s.revenue, 0);
  const totalMRR = closedSales.reduce((acc, s) => acc + s.mrr, 0);
  
  const totalOpportunities = sales.length; 
  const conversionRate = totalOpportunities > 0 ? closedSales.length / totalOpportunities : 0;
  const closedCount = closedSales.length;

  // 1. Dados Financeiros (Barra)
  const comparisonData = [
    { name: 'MRR', Realizado: totalMRR, Meta: targets.mrr },
    { name: 'Faturamento', Realizado: totalRevenue, Meta: targets.revenue },
  ];

  // 2. Dados de Status (Pizza) - Atualizado com novas cores e categorias
  const statusData = [
    { name: 'Vendido Pago', value: sales.filter(s => s.status === SalesStatus.SoldPaid).length, color: '#0ea5e9' }, // Cyan Blue
    { name: 'Vendido', value: sales.filter(s => s.status === SalesStatus.Sold).length, color: '#10B981' }, // Emerald
    { name: 'Em Aberto', value: sales.filter(s => s.status === SalesStatus.Open).length, color: '#F59E0B' }, // Amber
    { name: 'Cancelado', value: sales.filter(s => s.status === SalesStatus.Cancelled).length, color: '#EF4444' }, // Red
  ].filter(item => item.value > 0);

  // 3. Dados por Plano
  const planCounts: Record<string, number> = {};
  closedSales.forEach(sale => {
    const planName = sale.plan || 'Não Informado';
    planCounts[planName] = (planCounts[planName] || 0) + 1;
  });
  const planData = Object.keys(planCounts).map(key => ({
    name: key,
    Quantidade: planCounts[key]
  })).sort((a, b) => b.Quantidade - a.Quantidade);

  // 4. Dados por Periodicidade
  const periodicityCounts: Record<string, number> = {};
  closedSales.forEach(sale => {
    const period = sale.periodicity || 'Não Informado';
    periodicityCounts[period] = (periodicityCounts[period] || 0) + 1;
  });
  const periodicityData = Object.keys(periodicityCounts).map((key, index) => ({
    name: key,
    value: periodicityCounts[key],
    color: COLORS[index % COLORS.length]
  }));

  // 5. RANKING DE VENDEDORES (APENAS PARA ADMIN)
  const rankingData = React.useMemo(() => {
    if (!user?.isAdmin) return [];
    
    const sellerStats: Record<string, number> = {};
    sales.forEach(s => {
        // Conta faturamento para Vendido e Vendido Pago
        if (s.status === SalesStatus.Sold || s.status === SalesStatus.SoldPaid) {
            const name = s.sellerName || 'Desconhecido';
            sellerStats[name] = (sellerStats[name] || 0) + s.revenue;
        }
    });

    return Object.keys(sellerStats)
        .map(key => ({ name: key, revenue: sellerStats[key] }))
        .sort((a, b) => b.revenue - a.revenue);
  }, [sales, user]);


  // RENDERIZAÇÃO CONDICIONAL: SE NÃO TIVER USUÁRIO, MOSTRA LOGIN
  if (!user) {
    return <Login onLogin={handleLogin} loading={authLoading} />;
  }

  // MODO DE PRÉ-VISUALIZAÇÃO DE RELATÓRIO
  if (showReportPreview) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex flex-col items-center justify-start overflow-y-auto">
        <div className="w-full max-w-[21cm] flex justify-between items-center mb-6 no-print">
           <button 
             onClick={() => setShowReportPreview(false)}
             className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-colors border border-slate-600"
           >
             <X size={20} />
             Voltar / Editar
           </button>
           
           <div className="text-white text-center">
             <h2 className="font-bold text-lg">Pré-visualização de Impressão</h2>
           </div>

           <button 
             onClick={handlePrint}
             className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-cyan-900/50 transition-all hover:scale-105"
           >
             <Download size={20} />
             SALVAR PDF
           </button>
        </div>

        {/* FOLHA A4 SIMULADA */}
        <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] p-[1cm] shadow-2xl rounded-sm mx-auto flex flex-col gap-6 text-slate-900 print:shadow-none">
           <div className="border-b-4 border-slate-900 pb-4 mb-2">
             <div className="flex justify-between items-end">
               <div>
                 <h1 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase">Relatório Sharks</h1>
                 <p className="text-slate-600 mt-1 font-medium text-base">
                    {user.isAdmin ? 'Relatório Gerencial de Equipe' : 'Performance Comercial & Análise de Vendas'}
                 </p>
               </div>
               <div className="text-right">
                 <p className="font-bold text-slate-900 text-base">{user.name}</p>
                 <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
               </div>
             </div>
          </div>

          <div>
            <h3 className="text-cyan-900 font-bold uppercase tracking-wider mb-3 border-l-4 border-cyan-600 pl-3 text-sm">Resumo Executivo</h3>
            <div className="grid grid-cols-4 gap-3">
               <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Oportunidades</p>
                  <p className="text-lg font-bold text-slate-900">{totalOpportunities}</p>
                  <p className="text-[10px] mt-1 text-slate-600">Total na Base</p>
               </div>
               <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Fechamentos</p>
                  <p className="text-lg font-bold text-slate-900">{closedCount}</p>
                  <p className="text-[10px] mt-1 text-slate-600">Conversão: {(conversionRate * 100).toFixed(1)}%</p>
               </div>
               <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Faturamento</p>
                  <p className="text-lg font-bold text-slate-900">R$ {totalRevenue.toLocaleString('pt-BR')}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">MRR</p>
                  <p className="text-lg font-bold text-slate-900">R$ {totalMRR.toLocaleString('pt-BR')}</p>
               </div>
            </div>
          </div>

          {/* NOVOS GRÁFICOS NO RELATÓRIO */}
          <div className="grid grid-cols-2 gap-6 page-break-inside-avoid">
             <div>
                <h3 className="text-cyan-900 font-bold uppercase tracking-wider mb-3 border-l-4 border-cyan-600 pl-3 text-sm">Mix de Planos (Vendidos)</h3>
                <div className="border border-slate-100 rounded p-2 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={planData} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{fontSize: 10}} />
                            <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10}} />
                            <Bar dataKey="Quantidade" fill="#0ea5e9" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
             <div>
                <h3 className="text-cyan-900 font-bold uppercase tracking-wider mb-3 border-l-4 border-cyan-600 pl-3 text-sm">Periodicidade</h3>
                <div className="border border-slate-100 rounded p-2 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={periodicityData} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {periodicityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px'}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
             </div>
          </div>

          {user.isAdmin && (
             <div className="page-break-inside-avoid">
                <h3 className="text-cyan-900 font-bold uppercase tracking-wider mb-3 border-l-4 border-cyan-600 pl-3 text-sm">Ranking de Vendas</h3>
                <div className="border border-slate-100 rounded p-2 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankingData} layout="vertical" margin={{left: 20}}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{fontSize: 10}} />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                            <Bar dataKey="revenue" fill="#f59e0b" barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
          )}

          <div className="page-break-inside-avoid flex-1">
             <h3 className="text-cyan-900 font-bold uppercase tracking-wider mb-3 border-l-4 border-cyan-600 pl-3 text-sm">Base de Vendas Detalhada</h3>
             <SalesTable 
                sales={sales} 
                onAddSale={() => {}} 
                onDeleteSale={() => {}} 
                onUpdateSale={() => {}} 
                readOnly={true} 
             />
          </div>
        </div>
      </div>
    );
  }

  // MODO PADRÃO DO APP
  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      
      {/* Sidebar - Dark Glass */}
      <aside className={`bg-slate-900/40 backdrop-blur-md text-white transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col border-r border-slate-700/30 no-print`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-700/50 h-20">
          {sidebarOpen ? (
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">SHARKS</h1>
              <span className="text-[10px] tracking-widest uppercase text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">Sales Team</span>
            </div>
          ) : (
             <span className="text-2xl font-black text-cyan-400 mx-auto italic drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">S</span>
          )}
        </div>

        {/* User Profile Mini */}
        {sidebarOpen && (
          <div className="px-6 py-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg border backdrop-blur ${user.isAdmin ? 'bg-amber-600/80 border-amber-400/30' : 'bg-cyan-600/80 border-cyan-400/30'}`}>
                {user.isAdmin ? <Crown size={20} /> : user.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate">{user.isAdmin ? 'Acesso Gestão' : 'Vendedor(a)'}</p>
                    <button onClick={() => setShowPasswordModal(true)} title="Alterar Senha" className="text-slate-500 hover:text-cyan-400 transition-colors">
                        <Key size={14} />
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-3 mt-8">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all border ${activeTab === 'dashboard' ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            {sidebarOpen && <span className="font-bold">Dashboard</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('base')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all border ${activeTab === 'base' ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <Database size={20} />
            {sidebarOpen && <span className="font-bold">Base</span>}
          </button>

          <button 
            onClick={() => setActiveTab('metas')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all border ${activeTab === 'metas' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <Target size={20} />
            {sidebarOpen && <span className="font-bold">Metas</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700/50 space-y-2">
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 flex justify-center transition-colors">
             <Menu size={20} />
           </button>
           <button 
             onClick={handleLogout}
             className="w-full p-2 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors gap-2"
           >
             <LogOut size={20} />
             {sidebarOpen && <span className="text-sm font-bold">Sair</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {/* MODAL TROCA DE SENHA */}
        {showPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-cyan-500/50 shadow-2xl animate-in fade-in zoom-in-95 relative">
                    <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                    
                    <div className="mb-6 text-center">
                        <div className="w-16 h-16 bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                            {passwordStatus === 'success' ? <CheckCircle size={32} className="text-emerald-400"/> : <Lock size={32} className="text-cyan-400"/>}
                        </div>
                        <h3 className="text-xl font-bold text-white">Alterar Senha de Acesso</h3>
                        <p className="text-slate-400 text-xs mt-1">Defina uma nova senha para sua conta</p>
                    </div>

                    {passwordStatus === 'success' ? (
                        <div className="text-center py-6">
                            <p className="text-emerald-400 font-bold text-lg">Senha atualizada com sucesso!</p>
                        </div>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Nova Senha</label>
                                <input 
                                    type="password" 
                                    required 
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white text-center tracking-widest"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Confirmar Senha</label>
                                <input 
                                    type="password" 
                                    required 
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white text-center tracking-widest"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-900/50 font-bold transition-all mt-2"
                            >
                                SALVAR NOVA SENHA
                            </button>
                        </form>
                    )}
                </div>
            </div>
        )}

        <div className="max-w-7xl mx-auto relative z-10">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2 drop-shadow-md">
                    {user.isAdmin ? '🏆 Painel da Diretoria' : '📊 Dashboard de Vendas'}
                  </h2>
                  <p className="text-cyan-200 mt-1 font-medium">{user.isAdmin ? 'Visão consolidada da performance do time.' : `Bem-vindo(a), ${user.name}.`}</p>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setShowReportPreview(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-800/60 text-white border border-slate-600 rounded-lg hover:bg-slate-700/80 hover:border-cyan-500 transition-all font-bold group shadow-lg backdrop-blur"
                   >
                     <FileText size={20} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                     Relatório
                   </button>
                   <button 
                    onClick={fetchInsights}
                    disabled={loadingAi}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600/80 text-white rounded-lg shadow-lg shadow-cyan-900/50 hover:shadow-cyan-500/30 hover:bg-cyan-500 transition-all disabled:opacity-70 font-bold border border-cyan-400/30 backdrop-blur"
                   >
                     <BrainCircuit size={20} />
                     {loadingAi ? 'Calculando...' : 'SHARK AI'}
                   </button>
                </div>
              </div>

              {/* SECTION: RANKING (SÓ ADMIN) */}
              {user.isAdmin && (
                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-amber-500/30 shadow-2xl overflow-hidden animate-in slide-in-from-top-4">
                    <div className="bg-gradient-to-r from-amber-600/20 to-transparent p-6 border-b border-amber-500/20 flex items-center justify-between">
                         <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                            <Trophy size={24} /> Ranking dos Tubarões
                         </h3>
                         <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">TOP PERFORMERS</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Gráfico Ranking */}
                        <div className="lg:col-span-2 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rankingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#fff', fontWeight: 600, fontSize: 12}} />
                                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}/>
                                    <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={25} name="Faturamento">
                                         {rankingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#475569'} />
                                         ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Pódio (Texto) */}
                        <div className="space-y-4">
                            {rankingData.slice(0, 3).map((seller, idx) => (
                                <div key={seller.name} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-700'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white">{seller.name}</p>
                                        <p className="text-xs text-slate-400">R$ {seller.revenue.toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              )}

              {/* CARD DE INSIGHTS DA IA */}
              {aiInsight && (
                <div className="bg-slate-900/70 border-l-4 border-cyan-500 p-6 rounded-r-xl shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4 backdrop-blur-md border border-slate-700/50">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <BrainCircuit size={100} className="text-cyan-500" />
                   </div>
                   <h3 className="text-cyan-400 font-bold mb-3 flex items-center gap-2 text-lg">
                     <BrainCircuit size={24} className="text-cyan-400" /> 
                     Análise Estratégica
                   </h3>
                   <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-line font-medium font-mono">
                     {aiInsight}
                   </div>
                </div>
              )}

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                  title={user.isAdmin ? "Oportunidades (Equipe)" : "Oportunidades (Você)"}
                  value={totalOpportunities.toString()} 
                  target="-"
                  achievement={0} 
                  isPercentage={false}
                />
                <KPICard 
                  title="Vendas Fechadas" 
                  value={closedCount.toString()} 
                  target={targets.dealsClosed.toString()}
                  achievement={targets.dealsClosed > 0 ? (closedCount / targets.dealsClosed) * 100 : 0}
                />
                <KPICard 
                  title="Conversão Global" 
                  value={`${(conversionRate * 100).toFixed(1)}%`} 
                  target={`${(targets.conversionRate * 100).toFixed(1)}%`}
                  achievement={targets.conversionRate > 0 ? (conversionRate / targets.conversionRate) * 100 : 0}
                />
                <KPICard 
                  title="Faturamento Total" 
                  value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`} 
                  target={`R$ ${targets.revenue.toLocaleString('pt-BR')}`}
                  achievement={targets.revenue > 0 ? (totalRevenue / targets.revenue) * 100 : 0}
                />
              </div>

              {/* FUNIL & FINANCEIRO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Card Resumo do Funil */}
                 <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl p-6 flex flex-col justify-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                       <Filter size={100} className="text-white"/>
                    </div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 z-10">
                      <TrendingUp className="text-cyan-400" size={20}/>
                      Raio-X do Funil
                    </h3>
                    <div className="space-y-4 z-10">
                       <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                          <span className="text-slate-400 text-sm">Recebidos</span>
                          <span className="text-white font-bold text-lg">{totalOpportunities}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                          <span className="text-amber-400 text-sm">Em Aberto</span>
                          <span className="text-amber-400 font-bold text-lg">{sales.filter(s => s.status === SalesStatus.Open).length}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-emerald-400 text-sm">Ganhos (Vend + Pago)</span>
                          <span className="text-emerald-400 font-bold text-lg">{closedCount}</span>
                       </div>
                    </div>
                 </div>

                 {/* Gráfico Financeiro */}
                 <div className="md:col-span-2 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl flex flex-col h-[320px]">
                    <h3 className="text-lg font-bold text-white p-6 pb-0 mb-2 flex items-center gap-2">
                      <span className="w-2 h-6 bg-cyan-500 rounded-sm shadow-[0_0_10px_#0ea5e9]"></span>
                      Desempenho Financeiro
                    </h3>
                    <div className="flex-1 w-full min-h-0 pr-6 pb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} margin={{ top: 20, right: 0, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                          <Tooltip 
                            cursor={{fill: '#1e293b'}}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}
                          />
                          <Bar dataKey="Realizado" name="Realizado" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={60} />
                          <Bar dataKey="Meta" name="Meta" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* GRÁFICOS ADICIONAIS: PLANOS E PERIODICIDADE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Mix de Planos */}
                 <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl flex flex-col h-[320px]">
                    <h3 className="text-lg font-bold text-white p-6 pb-0 mb-2 flex items-center gap-2">
                        <BarChart3 className="text-cyan-400" size={20} />
                        Ranking de Planos
                    </h3>
                    <div className="flex-1 w-full min-h-0 pr-6 pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}/>
                                <Bar dataKey="Quantidade" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20}>
                                    {planData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Periodicidade */}
                 <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-xl flex flex-col h-[320px]">
                    <h3 className="text-lg font-bold text-white p-6 pb-0 mb-2 flex items-center gap-2">
                        <PieChartIcon className="text-cyan-400" size={20} />
                        Perfil de Contratos
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={periodicityData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={90} 
                                    fill="#8884d8" 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {periodicityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}/>
                                <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{color: '#fff'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
              </div>

            </div>
          )}

          {activeTab === 'base' && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
               <div className="mb-4 bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 inline-block shadow-lg">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="text-cyan-400"/> {user.isAdmin ? 'Base Global da Equipe' : 'Minha Base de Vendas'}
                  </h2>
               </div>
               <SalesTable 
                  sales={sales} 
                  onAddSale={handleAddSale} 
                  onDeleteSale={handleDeleteSale} 
                  onUpdateSale={handleUpdateSale}
               />
            </div>
          )}

          {activeTab === 'metas' && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
               <KPISettings targets={targets} onUpdateTargets={setTargets} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
