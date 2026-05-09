import React from 'react';
import {
  Building2,
  DollarSign,
  Megaphone,
  Receipt,
  Repeat,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';

import KpiCard from "../KpiCard";
import {
  formatarMoeda,
  formatarNumero,
  formatarPercentual
} from '../utils/formatters';

const KpisSection = ({ kpis, crescimento, abrirDetalhe }) => {
  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <KpiCard
          titulo="Receita total"
          valor={formatarMoeda(kpis.receitaTotal)}
          descricao="Consolidado da visão atual"
          icon={DollarSign}
          onClick={() => abrirDetalhe('receita')}
        />

        <KpiCard
          titulo="Total de pedidos"
          valor={formatarNumero(kpis.totalPedidos)}
          descricao="Pedidos concluídos"
          icon={Receipt}
          onClick={() => abrirDetalhe('pedidos')}
        />

        <KpiCard
          titulo="Ticket médio"
          valor={formatarMoeda(kpis.ticketMedio)}
          descricao="Receita / pedidos"
          icon={ShoppingBag}
          onClick={() => abrirDetalhe('ticket')}
        />

        <KpiCard
          titulo="Taxa de recorrência"
          valor={formatarPercentual(kpis.taxaRecorrencia)}
          descricao="Clientes com 2+ pedidos"
          icon={Repeat}
          onClick={() => abrirDetalhe('recorrencia')}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <KpiCard
          titulo="Crescimento da receita"
          valor={formatarPercentual(kpis.crescimentoReceita)}
          descricao="Comparação com mês anterior"
          icon={kpis.crescimentoReceita < 0 ? TrendingDown : TrendingUp}
          status={crescimento.statusReceita}
          onClick={() => abrirDetalhe('crescimentoReceita')}
        />

        <KpiCard
          titulo="Crescimento dos pedidos"
          valor={formatarPercentual(kpis.crescimentoPedidos)}
          descricao="Comparação com mês anterior"
          icon={kpis.crescimentoPedidos < 0 ? TrendingDown : TrendingUp}
          status={crescimento.statusPedidos}
          onClick={() => abrirDetalhe('crescimentoPedidos')}
        />

        <KpiCard
          titulo="Total de campanhas"
          valor={formatarNumero(kpis.totalCampanhas)}
          descricao="Campanhas registradas"
          icon={Megaphone}
          onClick={() => abrirDetalhe('campanhas')}
        />

        <KpiCard
          titulo="Receita via campanhas"
          valor={formatarMoeda(kpis.receitaCampanhas)}
          descricao="Pedidos associados a campanhas"
          icon={DollarSign}
          onClick={() => abrirDetalhe('receitaCampanhas')}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <KpiCard
          titulo="Empresas cadastradas"
          valor={formatarNumero(kpis.totalEmpresas)}
          descricao="Lojas na base"
          icon={Building2}
          onClick={() => abrirDetalhe('empresas')}
        />

        <KpiCard
          titulo="Clientes totais"
          valor={formatarNumero(kpis.totalClientes)}
          descricao="Base consolidada"
          icon={Users}
          onClick={() => abrirDetalhe('clientes')}
        />

        <KpiCard
          titulo="Clientes ativos"
          valor={formatarNumero(kpis.clientesAtivos)}
          descricao="Compraram nos últimos 90 dias"
          icon={UserCheck}
          onClick={() => abrirDetalhe('clientesAtivos')}
        />

        <KpiCard
          titulo="Clientes inativos"
          valor={formatarNumero(kpis.clientesInativos)}
          descricao="Oportunidade de reativação"
          icon={UserX}
          status="atencao"
          onClick={() => abrirDetalhe('clientesInativos')}
        />
      </section>
    </>
  );
};

export default KpisSection;