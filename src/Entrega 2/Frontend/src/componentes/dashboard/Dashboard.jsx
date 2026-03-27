import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import FiltrosBar from './FiltrosBar';
import KPIGrid from './KPIGrid';
import GraficosGrid from './GraficosGrid';
import CampanhasDashboard from './CampanhasDashboard';
import SugestoesDashboard from './SugestoesDashboard';
import AnaliseInferencial from './AnaliseInferencial';
import InsightsSection from './InsightsSection';
import GraficosAdicionais from './GraficosAdicionais';
import Modal from './Modal';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', content: '' });

  // Dados simulados
  const [kpis, setKpis] = useState([
    { id: 'pedidos', title: 'Total de Pedidos', value: '2.847', change: '12.5%', changeType: 'positive', icon: '📦' },
    { id: 'receita', title: 'Receita Total', value: 'R$ 89.432', change: '8.3%', changeType: 'positive', icon: '💰' },
    { id: 'ticket', title: 'Ticket Médio', value: 'R$ 31,42', change: '3.2%', changeType: 'positive', icon: '🎫' },
    { id: 'clientes', title: 'Clientes Ativos', value: '3.421', change: '18.7%', changeType: 'positive', icon: '👥' },
    { id: 'recorrencia', title: 'Taxa de Recorrência', value: '34,2%', change: '5.1%', changeType: 'positive', icon: '🔄' },
    { id: 'conversao', title: 'Taxa de Conversão', value: '12,8%', change: '2.3%', changeType: 'positive', icon: '📊' },
  ]);

  const [vendasData, setVendasData] = useState({
    atual: [42, 48, 52, 58, 63, 68],
    anterior: [38, 42, 45, 48, 52, 55],
  });

  const [segmentacaoData, setSegmentacaoData] = useState({
    recorrentes: 34.2,
    novos: 65.8,
  });

  const campanhas = [
    { nome: 'Black Friday 2024', mensagens: '2.345', conversao: '8.2%', vendas: '192', roi: '320%' },
    { nome: 'Natal Especial', mensagens: '1.876', conversao: '6.5%', vendas: '122', roi: '245%' },
    { nome: 'Aniversário LI', mensagens: '2.109', conversao: '9.1%', vendas: '192', roi: '380%' },
  ];

  const sugestoes = [
    { segmento: 'Clientes Inativos (30d+)', potencial: 'Alto', sugestao: 'Cupom de reativação 20% OFF', roi: '280%' },
    { segmento: 'Clientes Frequentes', potencial: 'Médio', sugestao: 'Programa de fidelidade pontos', roi: '180%' },
    { segmento: 'Novos Clientes', potencial: 'Alto', sugestao: 'Primeira compra com frete grátis', roi: '220%' },
  ];

  const mensagensData = {
    labels: ['Black Friday', 'Natal', 'Aniversário', 'Cupom 20%', 'Frete Grátis'],
    data: [2345, 1876, 2109, 1567, 1890],
  };

  const faturamentoData = {
    labels: ['Matriz', 'Moema', 'Pinheiros', 'Vila Olímpia'],
    data: [42300, 28700, 31500, 19800],
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleFilter = (filters) => {
    console.log('Filtros aplicados:', filters);
    // Simula atualização dos dados
    setKpis([
      { ...kpis[0], value: Math.floor(2800 + Math.random() * 200).toString() },
      { ...kpis[1], value: `R$ ${Math.floor(85000 + Math.random() * 5000)}` },
      { ...kpis[2], value: `R$ ${(30 + Math.random() * 5).toFixed(2)}` },
      { ...kpis[3], value: Math.floor(3200 + Math.random() * 400).toString() },
      { ...kpis[4], value: `${(32 + Math.random() * 5).toFixed(1)}%` },
      { ...kpis[5], value: `${(11 + Math.random() * 3).toFixed(1)}%` },
    ]);
    alert('📊 Dados atualizados com os filtros aplicados!');
  };

  const handleKpiClick = (id) => {
    let title = '';
    let content = '';
    if (id === 'pedidos') {
      title = 'Detalhamento de Pedidos';
      content = `
        <table class="w-full">
          <thead><tr><th class="text-left py-2">Produto</th><th class="text-left py-2">Quantidade</th><th class="text-left py-2">Valor</th></tr></thead>
          <tbody>
            <tr><td class="py-2">Pizza Margherita</td><td>342</td><td>R$ 8.550</td></tr>
            <tr><td class="py-2">Pasta ao Pesto</td><td>287</td><td>R$ 7.462</td></tr>
            <tr><td class="py-2">Tiramisu</td><td>423</td><td>R$ 4.653</td></tr>
          </tbody>
        </table>
        <button class="bg-orange text-white px-4 py-2 rounded-lg mt-4" onclick="alert('Exportando CSV...')">📥 Exportar CSV</button>
      `;
    } else if (id === 'receita') {
      title = 'Detalhamento de Receita';
      content = `
        <table class="w-full">
          <thead><tr><th class="text-left py-2">Canal</th><th class="text-left py-2">Valor</th><th class="text-left py-2">%</th></tr></thead>
          <tbody>
            <tr><td class="py-2">Delivery Próprio</td><td>R$ 42.890</td><td>48%</td></tr>
            <tr><td class="py-2">iFood</td><td>R$ 28.450</td><td>32%</td></tr>
            <tr><td class="py-2">Balcão</td><td>R$ 18.092</td><td>20%</td></tr>
          </tbody>
        </table>
      `;
    } else {
      title = 'Detalhamento';
      content = '<p>Dados detalhados do indicador selecionado.</p>';
    }
    setModal({ isOpen: true, title, content });
  };

  const closeModal = () => setModal({ isOpen: false, title: '', content: '' });

  const handleExport = () => {
    alert('📄 Relatório exportado em PDF/CSV. O download será iniciado em breve.');
  };

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 lg:ml-72">
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 bg-orange p-2 rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
        <main className="p-5 lg:p-8">
          <DashboardHeader onExport={handleExport} />
          <FiltrosBar onFilter={handleFilter} />
          <KPIGrid kpis={kpis} onKpiClick={handleKpiClick} />
          <GraficosGrid vendasData={vendasData} segmentacaoData={segmentacaoData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <CampanhasDashboard campanhas={campanhas} />
            <SugestoesDashboard sugestoes={sugestoes} />
          </div>
          <AnaliseInferencial />
          <InsightsSection />
          <GraficosAdicionais mensagensData={mensagensData} faturamentoData={faturamentoData} />
        </main>
      </div>
      <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.title}>
        <div dangerouslySetInnerHTML={{ __html: modal.content }} />
      </Modal>
    </div>
  );
};

export default Dashboard;