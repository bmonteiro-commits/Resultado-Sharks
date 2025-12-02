export enum SalesStatus {
  Sold = "Vendido",
  SoldPaid = "Vendido Pago",
  Open = "Em Aberto",
  Cancelled = "Cancelado"
}

export type PeriodicityType = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

export type PlanType = 'Click NF-e' | 'Essencial' | 'Controle' | 'Completo' | 'Gestão Integrada' | 'Certificado';

export interface Sale {
  id: string; // Internal system ID (React Key)
  customerId: string; // Business ID (Código do Cliente)
  date: string; // ISO String YYYY-MM-DD
  customerName: string;
  revenue: number; // Faturamento (Calculado: MRR * Multiplicador)
  plan: string;
  periodicity: PeriodicityType;
  mrr: number;
  paymentMethod: string;
  purchaseDate: string;
  status: SalesStatus;
  hubLink: string;
  notes: string;
  sellerName?: string; // Para identificar de quem é a venda na visão de gestão
}

export interface KPITargets {
  mrr: number;
  revenue: number;
  conversionRate: number; // 0.0 to 1.0
  dealsClosed: number;
}

export interface KPIResult {
  actual: number;
  target: number;
  achievement: number; // Percentage
  delta: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export type TabView = 'dashboard' | 'base' | 'metas';