import React, { useState, useEffect } from 'react';
import { Sale, SalesStatus, PeriodicityType, PlanType } from '../types';
import { Plus, Search, Trash2, Filter, FileSpreadsheet, Calculator, Edit3, X } from 'lucide-react';

interface SalesTableProps {
  sales: Sale[];
  onAddSale: (sale: Sale) => void;
  onDeleteSale: (id: string) => void;
  onUpdateSale: (sale: Sale) => void; 
  readOnly?: boolean; 
}

const PLANS: PlanType[] = ['Click NF-e', 'Essencial', 'Controle', 'Completo', 'Gestão Integrada', 'Certificado'];
const PERIODICITIES: PeriodicityType[] = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onAddSale, onDeleteSale, onUpdateSale, readOnly = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Sale>>({
    date: new Date().toISOString().split('T')[0],
    status: SalesStatus.Open,
    periodicity: 'Mensal',
    plan: 'Essencial',
    paymentMethod: 'Cartão de Crédito',
    revenue: 0,
    mrr: 0,
    customerId: '',
    customerName: ''
  });

  // Cálculo Automático: Faturamento / Periodicidade = MRR
  // EXCEÇÃO: Se for CERTIFICADO, MRR é sempre 0.
  useEffect(() => {
    // Regra do Certificado: MRR é sempre 0
    if (formData.plan === 'Certificado') {
      if (formData.mrr !== 0) {
        setFormData(prev => ({ ...prev, mrr: 0 }));
      }
      return;
    }

    // Regra Padrão
    if (formData.revenue !== undefined && formData.periodicity) {
      let divisor = 1;
      switch (formData.periodicity) {
        case 'Mensal': divisor = 1; break;
        case 'Trimestral': divisor = 3; break;
        case 'Semestral': divisor = 6; break;
        case 'Anual': divisor = 12; break;
      }
      
      const calculatedMrr = (formData.revenue || 0) / divisor;

      // Só atualiza se o valor mudou para evitar loops, mantendo precisão de 2 casas
      if (Math.abs((formData.mrr || 0) - calculatedMrr) > 0.01) {
          setFormData(prev => ({
            ...prev,
            mrr: parseFloat(calculatedMrr.toFixed(2))
          }));
      }
    }
  }, [formData.revenue, formData.periodicity, formData.plan]);

  const resetForm = () => {
    setFormData({ 
      id: undefined,
      customerId: '',
      customerName: '', 
      date: new Date().toISOString().split('T')[0],
      revenue: 0, 
      mrr: 0, 
      plan: 'Essencial',
      periodicity: 'Mensal',
      paymentMethod: 'Cartão de Crédito',
      status: SalesStatus.Open,
      notes: '',
      hubLink: ''
    });
    setIsEditing(false);
    setShowForm(false);
  };

  const handleRowClick = (sale: Sale) => {
    if (readOnly) return;
    setFormData({ ...sale });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const saleToSave: Sale = {
      id: formData.id || Date.now().toString(), // Se tem ID, mantém (edição). Se não, cria novo.
      customerId: formData.customerId || '',
      customerName: formData.customerName || 'Desconhecido',
      date: formData.date || new Date().toISOString().split('T')[0],
      revenue: Number(formData.revenue) || 0,
      mrr: Number(formData.mrr) || 0,
      plan: formData.plan || 'Essencial',
      periodicity: (formData.periodicity as PeriodicityType) || 'Mensal',
      paymentMethod: formData.paymentMethod || 'Outro',
      purchaseDate: formData.date || new Date().toISOString().split('T')[0],
      status: formData.status as SalesStatus,
      hubLink: formData.hubLink || '',
      notes: formData.notes || '',
      sellerName: formData.sellerName // Mantém o vendedor original se existir
    };

    if (isEditing) {
        onUpdateSale(saleToSave);
    } else {
        onAddSale(saleToSave);
    }
    
    resetForm();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, sale: Sale) => {
    e.stopPropagation(); // Impede que o clique no dropdown abra o modal de edição
    if (readOnly) return;
    onUpdateSale({ ...sale, status: e.target.value as SalesStatus });
  };

  const filteredSales = sales.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.customerId && s.customerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.sellerName && s.sellerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: SalesStatus) => {
    switch (status) {
        case SalesStatus.SoldPaid:
            return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
        case SalesStatus.Sold:
            return 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30';
        case SalesStatus.Cancelled:
            return 'bg-red-500/20 text-red-400 border border-red-500/30';
        default: // Open
            return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Oculta barra de ferramentas se for readOnly (Relatório) */}
      {!readOnly && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="text-cyan-400" />
              BASE DE DADOS
            </h2>
            <p className="text-slate-400 text-sm">Gestão detalhada de todas as transações.</p>
          </div>
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/40 font-bold border border-cyan-500/30"
          >
            <Plus size={18} />
            Nova Venda
          </button>
        </div>
      )}

      {showForm && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-4xl p-6 rounded-2xl border border-cyan-500/50 shadow-2xl animate-in fade-in zoom-in-95 relative overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button onClick={resetForm} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-6 text-white border-b border-slate-700 pb-4 flex items-center gap-2">
                {isEditing ? <Edit3 className="text-cyan-400" /> : <Plus className="text-cyan-400" />}
                {isEditing ? 'Editar Registro' : 'Nova Entrada de Venda'}
            </h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">ID Cliente</label>
                  <input required type="text" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-slate-600" 
                      placeholder="Ex: 12345"
                      value={formData.customerId || ''} onChange={e => setFormData({...formData, customerId: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Nome do Cliente</label>
                  <input required type="text" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-slate-600" 
                      placeholder="Nome da Empresa ou Pessoa"
                      value={formData.customerName || ''} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                </div>
                <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Data Venda</label>
                <input required type="date" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                
                <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Plano</label>
                <select className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white"
                    value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                    {PLANS.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                </select>
                </div>
                <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Periodicidade</label>
                <select className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white"
                    value={formData.periodicity} onChange={e => setFormData({...formData, periodicity: e.target.value as any})}>
                    {PERIODICITIES.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                </select>
                </div>
                <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Faturamento (Total)</label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500 text-sm">R$</span>
                    <input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-10 pr-3 py-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white font-bold"
                        value={formData.revenue} 
                        onChange={e => setFormData({...formData, revenue: parseFloat(e.target.value)})} 
                    />
                </div>
                </div>
                <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                   MRR {formData.plan === 'Certificado' ? '(N/A)' : '(Auto)'}
                </label>
                <div className="relative">
                     <span className="absolute left-3 top-3 text-slate-600 text-sm">R$</span>
                    <input type="number" 
                        readOnly 
                        className={`w-full bg-slate-900/30 border border-slate-800 rounded-lg pl-10 pr-3 py-3 font-mono ${formData.plan === 'Certificado' ? 'text-slate-600' : 'text-slate-400'} cursor-not-allowed`}
                        value={formData.mrr} 
                    />
                </div>
                </div>
                
                <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Status</label>
                <select className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as SalesStatus})}>
                    {Object.values(SalesStatus).map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                </select>
                </div>
                <div className="md:col-span-3">
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">Obs / Link Hub</label>
                <input type="text" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 outline-none text-white"
                    placeholder="Link ou observações"
                    value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
                
                <div className="md:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-700">
                <button type="button" onClick={resetForm} className="px-6 py-3 text-slate-400 hover:text-white font-medium hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-900/50 font-bold transition-all transform hover:-translate-y-1">
                    {isEditing ? 'SALVAR ALTERAÇÕES' : 'REGISTRAR VENDA'}
                </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!readOnly && (
        <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md p-2 rounded-lg border border-slate-700/50 shadow-lg w-full md:w-96 no-print">
          <Search size={18} className="text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, ID, plano..." 
            className="w-full outline-none text-sm p-1 bg-transparent text-white placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Filter size={16} className="text-slate-400 mr-2" />
        </div>
      )}

      {/* Table - Container Glass */}
      <div className={`bg-slate-900/60 backdrop-blur-md rounded-xl ${readOnly ? 'border-none shadow-none bg-transparent' : 'shadow-2xl border border-slate-700/50'} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm text-left ${readOnly ? 'text-black' : 'text-slate-300'}`}>
            {/* CABEÇALHO */}
            <thead className={`text-xs uppercase border-b-4 border-cyan-500 ${readOnly ? 'bg-slate-200 text-black' : 'bg-slate-950/80 text-white'}`}>
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Data</th>
                <th className="px-6 py-4 font-bold tracking-wider">ID</th>
                <th className="px-6 py-4 font-bold tracking-wider">Cliente</th>
                <th className="px-6 py-4 font-bold tracking-wider">Vendedor</th>
                <th className="px-6 py-4 font-bold tracking-wider">Plano</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Faturamento</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">MRR</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                {!readOnly && <th className="px-6 py-4 font-bold tracking-wider text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${readOnly ? 'divide-slate-200' : 'divide-slate-700/50'}`}>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 8 : 9} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr 
                    key={sale.id} 
                    onClick={() => handleRowClick(sale)}
                    className={`${readOnly ? 'bg-white' : 'bg-slate-800/30 hover:bg-cyan-900/30 cursor-pointer'} transition-all group`}
                    title="Clique para editar detalhes"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-mono text-xs opacity-70">{sale.customerId || '-'}</td>
                    <td className={`px-6 py-4 font-semibold ${readOnly ? 'text-slate-900' : 'text-white group-hover:text-cyan-300'}`}>{sale.customerName}</td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-slate-500">{sale.sellerName || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`py-1 px-3 rounded-full text-xs border font-medium ${readOnly ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-700/50 text-cyan-100 border-cyan-500/30'}`}>
                        {sale.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">R$ {sale.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className={`px-6 py-4 text-right font-bold ${readOnly ? 'text-slate-900' : 'text-cyan-400'}`}>R$ {sale.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    
                    {/* EDITABLE STATUS COLUMN */}
                    <td className="px-6 py-4 text-center">
                      {readOnly ? (
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(sale.status)}`}>
                          {sale.status}
                        </span>
                      ) : (
                        <div onClick={(e) => e.stopPropagation()}>
                            <select 
                            value={sale.status}
                            onChange={(e) => handleStatusChange(e, sale)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide outline-none cursor-pointer appearance-none transition-all hover:opacity-80
                                ${getStatusColor(sale.status)}`}
                            >
                            {Object.values(SalesStatus).map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
                            </select>
                        </div>
                      )}
                    </td>

                    {!readOnly && (
                      <td className="px-6 py-4 text-center">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteSale(sale.id); }} 
                            className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-900/20 rounded-full"
                            title="Excluir Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};