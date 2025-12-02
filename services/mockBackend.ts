import { KPITargets, Sale, SalesStatus, User } from "../types";

// --- CONFIGURAÇÃO DA EQUIPE SHARKS ---
const TEAM_MEMBERS = [
  { name: 'BRUNA MONTEIRO', email: 'bruna@sharks.com.br', id: 'user_bruna' },
  { name: 'ALESSANDRO', email: 'alessandro@sharks.com', id: 'user_alessandro' },
  { name: 'JANAINA', email: 'janaina@sharks.com', id: 'user_janaina' },
  { name: 'KAROLINE', email: 'karoline@sharks.com', id: 'user_karoline' },
  { name: 'ANA CAROLISE', email: 'anacarolise@sharks.com', id: 'user_anacarolise' },
  { name: 'LUCAS', email: 'lucas@sharks.com', id: 'user_lucas' },
  { name: 'DAVI', email: 'davi@sharks.com', id: 'user_davi' },
  { name: 'GIKA', email: 'gika@sharks.com', id: 'user_gika' },
];

const DEFAULT_TARGETS: KPITargets = {
  mrr: 7200,
  revenue: 44200,
  conversionRate: 0.65,
  dealsClosed: 34
};

// Gera dados iniciais APENAS se o vendedor não tiver dados salvos, para o dashboard não ficar vazio
const generateInitialDataForSeller = (sellerName: string, userId: string): Sale[] => {
  // Bruna tem dados específicos do exemplo
  if (sellerName === 'BRUNA MONTEIRO') {
    return [
      { 
        id: '001', customerId: '001', date: '2025-11-28', customerName: 'Cliente Exemplo 01', revenue: 1500, plan: 'Essencial', periodicity: 'Mensal', mrr: 1500, paymentMethod: 'Cartão', purchaseDate: '2025-11-28', status: SalesStatus.SoldPaid, hubLink: '', notes: '', sellerName: sellerName
      },
      { 
        id: '002', customerId: '002', date: '2025-11-29', customerName: 'Cliente Exemplo 02', revenue: 3000, plan: 'Controle', periodicity: 'Mensal', mrr: 3000, paymentMethod: 'Boleto', purchaseDate: '2025-11-29', status: SalesStatus.Open, hubLink: '', notes: '', sellerName: sellerName
      }
    ];
  }

  // Para os outros, gera 2 ou 3 vendas simuladas para popular o ranking
  const sales: Sale[] = [];
  const numSales = Math.floor(Math.random() * 4) + 2; // 2 a 5 vendas
  
  for(let i=0; i<numSales; i++) {
    const isSold = Math.random() > 0.3;
    const revenue = Math.floor(Math.random() * 4000) + 1200;
    sales.push({
        id: `${userId}_init_${i}`,
        customerId: `ID-${Math.floor(Math.random()*1000)}`,
        date: new Date().toISOString().split('T')[0],
        customerName: `Cliente ${i+1} (${sellerName})`,
        revenue: revenue,
        plan: Math.random() > 0.5 ? 'Essencial' : 'Completo',
        periodicity: 'Mensal',
        mrr: revenue,
        paymentMethod: 'Cartão',
        purchaseDate: new Date().toISOString().split('T')[0],
        status: isSold ? SalesStatus.SoldPaid : SalesStatus.Open,
        hubLink: '',
        notes: 'Carga Inicial',
        sellerName: sellerName
    });
  }
  return sales;
};

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // LOGIN DE GESTÃO (ADMIN)
    if (email === 'gestao@sharks.com') {
        const storedAdminPass = localStorage.getItem('sharks_pwd_admin_master');
        const validPass = storedAdminPass ? storedAdminPass === password : password === '12345678';

        if (validPass) {
            return {
                id: 'admin_master',
                email: email,
                name: 'DIRETORIA SHARKS',
                isAdmin: true
            };
        } else {
            throw new Error("Senha incorreta.");
        }
    }

    // LOGIN DA EQUIPE (Dinâmico)
    const member = TEAM_MEMBERS.find(m => m.email.toLowerCase() === email.toLowerCase());
    
    if (member) {
        // Verifica se existe uma senha personalizada salva no LocalStorage
        const storedPass = localStorage.getItem(`sharks_pwd_${member.id}`);
        // Se existir senha salva, compara com ela. Se não, compara com a padrão.
        const validPass = storedPass ? storedPass === password : password === '12345678';

        if (validPass) {
             return {
                id: member.id, 
                email: member.email,
                name: member.name,
                isAdmin: false
            };
        } else {
            throw new Error("Senha incorreta.");
        }
    }

    throw new Error("Usuário não encontrado na equipe Sharks.");
  },

  updatePassword: async (userId: string, newPassword: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem(`sharks_pwd_${userId}`, newPassword);
  },

  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

export const dataService = {
  loadUserData: (userId: string, isAdmin: boolean = false) => {
    // SE FOR ADMIN:
    // 1. Percorre a lista de membros OFICIAIS da equipe.
    // 2. Tenta carregar o localStorage de cada um.
    // 3. Se não tiver nada no localStorage, gera dados iniciais para aquele membro.
    if (isAdmin) {
        let allTeamSales: Sale[] = [];
        
        TEAM_MEMBERS.forEach(member => {
            const storedSales = localStorage.getItem(`sharks_sales_${member.id}`);
            if (storedSales) {
                // Se o vendedor já usou o sistema, usa os dados reais dele
                allTeamSales = [...allTeamSales, ...JSON.parse(storedSales)];
            } else {
                // Se nunca usou, usa dados simulados para o gráfico não ficar vazio
                const initialData = generateInitialDataForSeller(member.name, member.id);
                allTeamSales = [...allTeamSales, ...initialData];
            }
        });

        return {
            sales: allTeamSales,
            targets: { ...DEFAULT_TARGETS, revenue: 150000, mrr: 25000, dealsClosed: 100 }
        };
    }

    // SE FOR VENDEDOR:
    const storedSales = localStorage.getItem(`sharks_sales_${userId}`);
    const storedTargets = localStorage.getItem(`sharks_targets_${userId}`);

    // Se não tem vendas salvas, carrega as iniciais (Bruna ou Aleatórios)
    let sales = storedSales ? JSON.parse(storedSales) : [];
    if (!storedSales) {
        // Encontra o nome do usuário atual
        const memberName = TEAM_MEMBERS.find(m => m.id === userId)?.name || 'Vendedor';
        sales = generateInitialDataForSeller(memberName, userId);
    }

    return {
      sales: sales,
      targets: storedTargets ? JSON.parse(storedTargets) : DEFAULT_TARGETS
    };
  },

  saveSales: (userId: string, sales: Sale[]) => {
    if (userId === 'admin_master') return; 
    localStorage.setItem(`sharks_sales_${userId}`, JSON.stringify(sales));
  },

  saveTargets: (userId: string, targets: KPITargets) => {
     if (userId === 'admin_master') return;
    localStorage.setItem(`sharks_targets_${userId}`, JSON.stringify(targets));
  }
};