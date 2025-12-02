import { GoogleGenAI } from "@google/genai";
import { KPITargets, Sale, SalesStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSalesInsights = async (
  sales: Sale[],
  targets: KPITargets
): Promise<string> => {
  try {
    // 1. DADOS DE OPORUNIDADES (FUNIL)
    const totalOpportunities = sales.length;
    // Considera VENDIDO e VENDIDO PAGO como fechado (sucesso)
    const closedSales = sales.filter((s) => s.status === SalesStatus.Sold || s.status === SalesStatus.SoldPaid);
    const openSales = sales.filter((s) => s.status === SalesStatus.Open);
    const lostSales = sales.filter((s) => s.status === SalesStatus.Cancelled);
    
    // 2. DADOS FINANCEIROS
    const totalRevenue = closedSales.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalMRR = closedSales.reduce((acc, curr) => acc + curr.mrr, 0);
    
    // 3. CÁLCULO DE GAPS (O QUE FALTA)
    const revenueGap = targets.revenue - totalRevenue;
    const mrrGap = targets.mrr - totalMRR;
    
    // 4. CÁLCULO DE PROJEÇÃO (Ticket Médio)
    const avgTicket = closedSales.length > 0 ? totalRevenue / closedSales.length : 0;
    const avgMrr = closedSales.length > 0 ? totalMRR / closedSales.length : 0;

    // Quantas vendas faltam para bater a meta de faturamento baseado no ticket médio?
    const salesNeededForRevenue = avgTicket > 0 && revenueGap > 0 
      ? Math.ceil(revenueGap / avgTicket) 
      : 0;

    const salesNeededForMrr = avgMrr > 0 && mrrGap > 0
      ? Math.ceil(mrrGap / avgMrr)
      : 0;

    // Escolhe o maior desafio (Revenue ou MRR) para focar
    const salesNeeded = Math.max(salesNeededForRevenue, salesNeededForMrr);

    const prompt = `
      Atue como um Analista de Performance de Vendas da equipe "Sharks". Sua resposta deve ser puramente baseada em MATEMÁTICA e ESTRATÉGIA NUMÉRICA.
      
      DADOS DO CENÁRIO ATUAL:
      - Oportunidades Recebidas (Leads Totais): ${totalOpportunities}
      - Vendas Fechadas (Vendido + Vendido Pago): ${closedSales.length}
      - Em Aberto (Pipeline): ${openSales.length}
      - Canceladas/Perdidas: ${lostSales.length}
      - Taxa de Conversão Real: ${totalOpportunities > 0 ? ((closedSales.length / totalOpportunities) * 100).toFixed(1) : 0}% (Meta: ${(targets.conversionRate * 100).toFixed(1)}%)
      
      FINANCEIRO:
      - Faturamento Atual: R$ ${totalRevenue.toFixed(2)} (Meta: R$ ${targets.revenue.toFixed(2)})
      - Gap (Falta): R$ ${revenueGap.toFixed(2)}
      - Ticket Médio Atual: R$ ${avgTicket.toFixed(2)}
      
      PROJEÇÃO MATEMÁTICA:
      Para bater a meta financeira, faltam aproximadamente R$ ${revenueGap.toFixed(2)}.
      Com o ticket médio atual, isso significa que precisamos de mais ${salesNeeded} vendas.
      
      INSTRUÇÕES DE RESPOSTA (EM PORTUGUÊS):
      1. Comece DIRETAMENTE com o número mágico: "Para bater a meta, você precisa de X vendas."
      2. Analise o Funil: Cite quantas oportunidades entraram vs quantas fecharam. Se a conversão estiver baixa, aponte isso numericamente.
      3. Dê uma tática numérica para o Pipeline em Aberto (ex: "Você tem X clientes em aberto, precisa converter Y% deles para atingir o objetivo").
      4. Seja breve, analítico e use bullet points. Nada de textos longos motivacionais. Foco no resultado.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Sem dados suficientes para análise numérica.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Erro ao calcular métricas avançadas.";
  }
};