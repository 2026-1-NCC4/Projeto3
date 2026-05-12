import json
from datetime import datetime

import pandas as pd
import numpy as np

from .cli import get_args
from .config import (
    OUTPUT_FILE,
    STORE_FILE,
    ORDER_FILE,
    CUSTOMER_FILE,
    CUSTOMER_ADDRESS_FILE,
    CAMPAIGN_FILE,
    CAMPAIGN_ORDER_FILE,
    TEMPLATE_FILE,
)
from .utils import (
    read_csv,
    parse_datetime,
    money,
    percent,
    safe_int,
    calcular_crescimento,
    status_por_variacao,
)
from .filters import aplicar_filtros_pedidos
from .rfm import gerar_clientes_analitico
from .recommendations import gerar_recomendacoes


def gerar_dashboard_admin():
    args = get_args()

    stores = read_csv(STORE_FILE)
    orders = read_csv(ORDER_FILE)
    customers = read_csv(CUSTOMER_FILE)
    customer_address = read_csv(CUSTOMER_ADDRESS_FILE)
    campaigns = read_csv(CAMPAIGN_FILE)
    campaign_orders = read_csv(CAMPAIGN_ORDER_FILE)
    templates = read_csv(TEMPLATE_FILE)

    # =========================
    # Padronização básica
    # =========================
    stores["id"] = stores["id"].astype(str)
    stores["name"] = stores["name"].astype(str)

    orders["id"] = orders["id"].astype(str)
    orders["storeid"] = orders["storeid"].astype(str)
    orders["customerid"] = orders["customerid"].astype(str)

    customers["id"] = customers["id"].astype(str)

    customer_address["customerid"] = customer_address["customerid"].astype(str)

    campaigns["storeid"] = campaigns["storeid"].astype(str)
    campaigns["customerid"] = campaigns["customerid"].astype(str)
    campaigns["templateid"] = campaigns["templateid"].astype(str)

    templates["id"] = templates["id"].astype(str)
    templates["storeid"] = templates["storeid"].astype(str)

    orders["createdat"] = parse_datetime(orders["createdat"])
    orders["scheduledat"] = parse_datetime(orders["scheduledat"])
    stores["createdat"] = parse_datetime(stores["createdat"])
    customers["createdat"] = parse_datetime(customers["createdat"])
    campaigns["createdat"] = parse_datetime(campaigns["createdat"])
    campaigns["sendat"] = parse_datetime(campaigns["sendat"])
    templates["createdat"] = parse_datetime(templates["createdat"])

    orders["totalamount"] = pd.to_numeric(orders["totalamount"], errors="coerce").fillna(0)
    orders["subtotalamount"] = pd.to_numeric(orders["subtotalamount"], errors="coerce").fillna(0)
    orders["discountamount"] = pd.to_numeric(orders["discountamount"], errors="coerce").fillna(0)
    orders["taxamount"] = pd.to_numeric(orders["taxamount"], errors="coerce").fillna(0)

    # =========================
    # Pedidos válidos antes dos filtros
    # =========================
    # Alguns CSVs podem vir com problema de encoding no status_label,
    # por exemplo: "ConcluÃ­do" em vez de "Concluído".
    # Por isso, normalizamos e aceitamos as variações mais comuns.
    orders["status_normalizado"] = (
        orders["status_label"]
        .astype(str)
        .str.lower()
        .str.strip()
    )

    pedidos_base = orders[
        (
            orders["status_normalizado"].isin([
                "concluído",
                "concluido",
                "concluã­do",
                "completed"
            ])
        ) &
        (orders["totalamount"] > 0) &
        (orders["createdat"].notna())
    ].copy()

    pedidos_base["periodo"] = pedidos_base["createdat"].dt.to_period("M").astype(str)

    # =========================
    # Filtros disponíveis — sempre com base completa
    # =========================
    filtros = {
        "periodos": sorted(pedidos_base["periodo"].dropna().unique().tolist()),
        "empresas": [
            {
                "id": row["id"],
                "nome": row["name"]
            }
            for _, row in stores.sort_values("name").iterrows()
        ],
        "canais": sorted(
            pedidos_base["saleschannel"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        ),
        "tiposPedido": sorted(
            pedidos_base["ordertype"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )
    }

    # =========================
    # Aplicação real dos filtros
    # =========================
    pedidos_validos = aplicar_filtros_pedidos(pedidos_base, args)
    pedidos_validos["periodo"] = pedidos_validos["createdat"].dt.to_period("M").astype(str)

    # Filtro das campanhas por empresa e período quando aplicável
    campaign_orders["totalamount"] = pd.to_numeric(
        campaign_orders["totalamount"], errors="coerce"
    ).fillna(0)

    campaign_orders["order_id"] = campaign_orders["order_id"].astype(str)
    campaign_orders["campaignid"] = campaign_orders["campaignid"].astype(str)
    campaign_orders["storeid"] = campaign_orders["storeid"].astype(str)
    campaign_orders["customerid"] = campaign_orders["customerid"].astype(str)
    campaign_orders["order_at"] = parse_datetime(campaign_orders["order_at"])

    campaign_orders_filtrado = campaign_orders.copy()

    if args.periodo != "todos":
        campaign_orders_filtrado = campaign_orders_filtrado[
            campaign_orders_filtrado["order_at"].dt.to_period("M").astype(str) == args.periodo
        ].copy()

    if args.empresa != "todas":
        campaign_orders_filtrado = campaign_orders_filtrado[
            campaign_orders_filtrado["storeid"] == args.empresa
        ].copy()

    # =========================
    # Tratamento de base vazia
    # =========================
    if pedidos_validos.empty:
        dashboard = {
            "atualizadoEm": datetime.now().isoformat(),
            "perfil": "admin",
            "filtros": filtros,
            "filtrosAplicados": {
                "periodo": args.periodo,
                "empresa": args.empresa,
                "canal": args.canal,
                "tipoPedido": args.tipoPedido
            },
            "kpis": {
                "receitaTotal": 0,
                "totalPedidos": 0,
                "ticketMedio": 0,
                "totalEmpresas": int(stores["id"].nunique()),
                "totalClientes": int(customers["id"].nunique()),
                "clientesAtivos": 0,
                "clientesInativos": 0,
                "clientesRecorrentes": 0,
                "clientesOcasionais": 0,
                "clientesSemPedido": int(customers["id"].nunique()),
                "taxaRecorrencia": 0,
                "descontosTotal": 0,
                "taxaDescontoMedia": 0,
                "crescimentoReceita": 0,
                "crescimentoPedidos": 0,
                "totalCampanhas": int(campaigns.shape[0]),
                "receitaCampanhas": 0
            },
            "crescimento": {
                "receita": 0,
                "pedidos": 0,
                "statusReceita": "atencao",
                "statusPedidos": "atencao"
            },
            "segmentacaoClientes": {
                "ativos": 0,
                "inativos": 0,
                "recorrentes": 0,
                "ocasionais": 0,
                "semPedido": int(customers["id"].nunique()),
                "comPedido": 0,
                "taxaRecorrencia": 0
            },
            "graficos": {
                "receitaPorMes": [],
                "pedidosPorMes": [],
                "ticketMedioPorMes": [],
                "clientesNovosPorMes": [],
                "performanceCanais": [],
                "pedidosPorTipo": [],
                "topEmpresasReceita": [],
                "topEmpresasPedidos": [],
                "clientesPorEstado": []
            },
            "rankingEmpresas": [],
            "indicadoresObrigatorios": {
                "porEmpresa": [],
                "mensagensPorCampanhaEmpresa": []
            },
            "empresasRisco": {
                "baixaRecorrencia": [],
                "ticketBaixo": [],
                "baixoVolumePedidos": [],
                "baixaReceita": []
            },
            "performanceCampanhas": [],
            "campanhas": {
                "totalCampanhas": int(campaigns.shape[0]),
                "totalTemplates": int(templates.shape[0]),
                "receitaCampanhas": 0,
                "pedidosGerados": 0,
                "mensagens": 0,
                "conversaoMedia": 0,
                "melhoresCampanhas": [],
                "campanhasBaixaConversao": [],
                "templatesMaisUsados": []
            },
            "clientes": {
                "segmentacao": {
                    "ativos": 0,
                    "inativos": 0,
                    "recorrentes": 0,
                    "ocasionais": 0,
                    "semPedido": int(customers["id"].nunique()),
                    "comPedido": 0,
                    "taxaRecorrencia": 0
                },
                "clientesNovosPorMes": [],
                "clientesPorEstado": [],
                "rfm": {
                    "resumo": {
                        "totalClientesAnalisados": 0,
                        "campeoes": 0,
                        "fieis": 0,
                        "potenciais": 0,
                        "emRisco": 0,
                        "perdidos": 0,
                        "novosClientes": 0
                    },
                    "segmentos": [],
                    "topClientes": []
                },
                "coortes": []
            },
            "financeiro": {
                "receitaTotal": 0,
                "receitaBruta": 0,
                "receitaLiquida": 0,
                "custosVariaveis": 0,
                "margemBruta": 0,
                "margemPercentual": 0,
                "caixaEstimado": 0,
                "ticketMedio": 0,
                "descontosTotal": 0,
                "taxaDescontoMedia": 0,
                "percentualCustoVariavel": 38,
                "percentualReservaCaixa": 18,
                "receitaPorMes": [],
                "ticketMedioPorMes": [],
                "performanceCanais": [],
                "pedidosPorTipo": [],
                "resultadoPorMes": [],
                "resultadoPorCanal": [],
                "resultadoPorTipoPedido": [],
                "alertasFinanceiros": []
            },
            "empresas": {
                "total": int(stores["id"].nunique()),
                "rankingReceita": [],
                "melhoresDesempenhos": [],
                "empresasRisco": {
                    "baixaRecorrencia": [],
                    "ticketBaixo": [],
                    "baixoVolumePedidos": [],
                    "baixaReceita": []
                }
            },
            "recomendacoes": {
                "resumo": {
                    "totalRecomendacoes": 0,
                    "altaPrioridade": 0,
                    "roiMedioSimulado": 0,
                    "melhorConversao": 0,
                    "totalTestesAB": 0,
                    "totalInsights": 0
                },
                "sugestoesCampanha": [],
                "testeAB": [],
                "insights": []
            },
            "alertas": [
                {
                    "tipo": "sem_dados",
                    "prioridade": "media",
                    "empresa": "Filtros selecionados",
                    "mensagem": "Nenhum pedido encontrado para os filtros aplicados.",
                    "acaoSugerida": "Tente selecionar outro período, empresa, canal ou tipo de pedido."
                }
            ]
        }

        with open(OUTPUT_FILE, "w", encoding="utf-8") as arquivo:
            json.dump(dashboard, arquivo, ensure_ascii=False, indent=2)

        print("Dashboard admin gerado com sucesso:")
        print(OUTPUT_FILE)
        return

    data_maxima = pedidos_validos["createdat"].max()
    limite_ativos = data_maxima - pd.Timedelta(days=90)

    # =========================
    # KPIs globais filtrados
    # =========================
    receita_total = pedidos_validos["totalamount"].sum()
    total_pedidos = pedidos_validos["id"].nunique()
    ticket_medio = receita_total / total_pedidos if total_pedidos > 0 else 0

    total_empresas = stores["id"].nunique()
    total_clientes = customers["id"].nunique()

    clientes_com_pedido = pedidos_validos["customerid"].nunique()

    pedidos_por_cliente = pedidos_validos.groupby("customerid")["id"].nunique()
    clientes_recorrentes = int((pedidos_por_cliente >= 2).sum())
    clientes_ocasionais = int((pedidos_por_cliente == 1).sum())

    taxa_recorrencia = (
        clientes_recorrentes / clientes_com_pedido * 100
        if clientes_com_pedido > 0
        else 0
    )

    clientes_ativos = pedidos_validos[
        pedidos_validos["createdat"] >= limite_ativos
    ]["customerid"].nunique()

    clientes_inativos = max(clientes_com_pedido - clientes_ativos, 0)
    clientes_sem_pedido = max(total_clientes - clientes_com_pedido, 0)

    descontos_total = pedidos_validos["discountamount"].sum()
    subtotal_total = pedidos_validos["subtotalamount"].sum()

    taxa_desconto_media = (
        descontos_total / subtotal_total * 100
        if subtotal_total > 0
        else 0
    )

    total_campanhas = campaigns.shape[0]
    total_templates = templates.shape[0]

    # =========================
    # Séries mensais
    # =========================
    receita_por_mes_df = (
        pedidos_validos
        .groupby("periodo", as_index=False)["totalamount"]
        .sum()
        .sort_values("periodo")
    )

    pedidos_por_mes_df = (
        pedidos_validos
        .groupby("periodo", as_index=False)["id"]
        .nunique()
        .rename(columns={"id": "pedidos"})
        .sort_values("periodo")
    )

    mensal_df = receita_por_mes_df.merge(
        pedidos_por_mes_df,
        on="periodo",
        how="left"
    )

    mensal_df["ticketMedio"] = mensal_df["totalamount"] / mensal_df["pedidos"]

    mensal_df["receitaAnterior"] = mensal_df["totalamount"].shift(1)
    mensal_df["pedidosAnterior"] = mensal_df["pedidos"].shift(1)

    mensal_df["crescimentoReceita"] = mensal_df.apply(
        lambda row: calcular_crescimento(row["totalamount"], row["receitaAnterior"]),
        axis=1
    )

    mensal_df["crescimentoPedidos"] = mensal_df.apply(
        lambda row: calcular_crescimento(row["pedidos"], row["pedidosAnterior"]),
        axis=1
    )

    mensal_12_df = mensal_df.tail(12)

    receita_por_mes = [
        {
            "periodo": row["periodo"],
            "receita": money(row["totalamount"]),
            "crescimento": percent(row["crescimentoReceita"])
        }
        for _, row in mensal_12_df.iterrows()
    ]

    pedidos_por_mes = [
        {
            "periodo": row["periodo"],
            "pedidos": safe_int(row["pedidos"]),
            "crescimento": percent(row["crescimentoPedidos"])
        }
        for _, row in mensal_12_df.iterrows()
    ]

    ticket_medio_por_mes = [
        {
            "periodo": row["periodo"],
            "ticketMedio": money(row["ticketMedio"])
        }
        for _, row in mensal_12_df.iterrows()
    ]

    crescimento_receita = 0
    crescimento_pedidos = 0

    if len(mensal_df) >= 2:
        ultima_linha = mensal_df.iloc[-1]
        crescimento_receita = percent(ultima_linha["crescimentoReceita"])
        crescimento_pedidos = percent(ultima_linha["crescimentoPedidos"])

    # =========================
    # Clientes novos por mês
    # =========================
    clientes_validos = customers[customers["createdat"].notna()].copy()

    if args.periodo != "todos":
        clientes_validos = clientes_validos[
            clientes_validos["createdat"].dt.to_period("M").astype(str) == args.periodo
        ].copy()

    clientes_validos["periodo"] = clientes_validos["createdat"].dt.to_period("M").astype(str)

    clientes_novos_por_mes_df = (
        clientes_validos
        .groupby("periodo", as_index=False)["id"]
        .nunique()
        .rename(columns={"id": "clientes"})
        .sort_values("periodo")
        .tail(12)
    )

    clientes_novos_por_mes = [
        {
            "periodo": row["periodo"],
            "clientes": safe_int(row["clientes"])
        }
        for _, row in clientes_novos_por_mes_df.iterrows()
    ]

    # =========================
    # Orders com empresas
    # =========================
    orders_with_store = pedidos_validos.merge(
        stores[["id", "name"]],
        left_on="storeid",
        right_on="id",
        how="left",
        suffixes=("", "_store")
    )

    # =========================
    # Ranking geral de empresas
    # =========================
    ranking_df = (
        orders_with_store
        .groupby(["storeid", "name"], as_index=False)
        .agg(
            receita=("totalamount", "sum"),
            pedidos=("id", "nunique"),
            clientes=("customerid", "nunique"),
            desconto=("discountamount", "sum")
        )
    )

    ranking_df["ticketMedio"] = ranking_df["receita"] / ranking_df["pedidos"]

    recorrencia_por_store = (
        orders_with_store
        .groupby(["storeid", "customerid"])["id"]
        .nunique()
        .reset_index(name="qtd_pedidos_cliente")
    )

    recorrencia_store_df = (
        recorrencia_por_store
        .groupby("storeid")
        .agg(
            clientesTotais=("customerid", "nunique"),
            clientesRecorrentes=("qtd_pedidos_cliente", lambda x: int((x >= 2).sum()))
        )
        .reset_index()
    )

    recorrencia_store_df["recorrencia"] = (
        recorrencia_store_df["clientesRecorrentes"] /
        recorrencia_store_df["clientesTotais"] * 100
    )

    ranking_df = ranking_df.merge(
        recorrencia_store_df[["storeid", "recorrencia", "clientesRecorrentes"]],
        on="storeid",
        how="left"
    )

    ranking_df["recorrencia"] = ranking_df["recorrencia"].fillna(0)
    ranking_df["clientesRecorrentes"] = ranking_df["clientesRecorrentes"].fillna(0)

    ranking_df["status"] = np.where(
        ranking_df["recorrencia"] < 25,
        "risco",
        np.where(ranking_df["recorrencia"] < 35, "atencao", "saudavel")
    )

    ranking_df = ranking_df.sort_values("receita", ascending=False)

    ranking_empresas = [
        {
            "storeid": row["storeid"],
            "empresa": row["name"] if pd.notna(row["name"]) else "Empresa sem nome",
            "receita": money(row["receita"]),
            "pedidos": safe_int(row["pedidos"]),
            "clientes": safe_int(row["clientes"]),
            "clientesRecorrentes": safe_int(row["clientesRecorrentes"]),
            "ticketMedio": money(row["ticketMedio"]),
            "recorrencia": percent(row["recorrencia"]),
            "desconto": money(row["desconto"]),
            "status": row["status"]
        }
        for _, row in ranking_df.head(15).iterrows()
    ]

    top_empresas_receita = [
        {
            "empresa": row["name"] if pd.notna(row["name"]) else "Empresa sem nome",
            "receita": money(row["receita"])
        }
        for _, row in ranking_df.head(8).iterrows()
    ]

    top_empresas_pedidos = [
        {
            "empresa": row["name"] if pd.notna(row["name"]) else "Empresa sem nome",
            "pedidos": safe_int(row["pedidos"])
        }
        for _, row in ranking_df.sort_values("pedidos", ascending=False).head(8).iterrows()
    ]

    pior_recorrencia_df = ranking_df[
        ranking_df["clientes"] >= 30
    ].sort_values("recorrencia", ascending=True).head(8)

    pior_ticket_df = ranking_df[
        ranking_df["pedidos"] >= 30
    ].sort_values("ticketMedio", ascending=True).head(8)

    baixo_volume_df = ranking_df.sort_values("pedidos", ascending=True).head(8)

    baixa_receita_df = ranking_df.sort_values("receita", ascending=True).head(8)

    empresas_risco = {
        "baixaRecorrencia": [
            {
                "empresa": row["name"],
                "recorrencia": percent(row["recorrencia"]),
                "clientes": safe_int(row["clientes"]),
                "status": row["status"]
            }
            for _, row in pior_recorrencia_df.iterrows()
        ],
        "ticketBaixo": [
            {
                "empresa": row["name"],
                "ticketMedio": money(row["ticketMedio"]),
                "pedidos": safe_int(row["pedidos"]),
                "status": row["status"]
            }
            for _, row in pior_ticket_df.iterrows()
        ],
        "baixoVolumePedidos": [
            {
                "empresa": row["name"],
                "pedidos": safe_int(row["pedidos"]),
                "receita": money(row["receita"]),
                "status": row["status"]
            }
            for _, row in baixo_volume_df.iterrows()
        ],
        "baixaReceita": [
            {
                "empresa": row["name"],
                "receita": money(row["receita"]),
                "pedidos": safe_int(row["pedidos"]),
                "status": row["status"]
            }
            for _, row in baixa_receita_df.iterrows()
        ]
    }

    # =========================
    # Performance por canal
    # =========================
    canais_df = (
        pedidos_validos
        .groupby("saleschannel", as_index=False)
        .agg(
            receita=("totalamount", "sum"),
            pedidos=("id", "nunique")
        )
        .sort_values("receita", ascending=False)
    )

    canais_df["ticketMedio"] = canais_df["receita"] / canais_df["pedidos"]

    performance_canais = [
        {
            "canal": str(row["saleschannel"]),
            "receita": money(row["receita"]),
            "pedidos": safe_int(row["pedidos"]),
            "ticketMedio": money(row["ticketMedio"])
        }
        for _, row in canais_df.iterrows()
    ]

    # =========================
    # Tipo de pedido
    # =========================
    tipo_pedido_df = (
        pedidos_validos
        .groupby("ordertype", as_index=False)
        .agg(
            receita=("totalamount", "sum"),
            pedidos=("id", "nunique")
        )
        .sort_values("receita", ascending=False)
    )

    pedidos_por_tipo = [
        {
            "tipo": str(row["ordertype"]),
            "receita": money(row["receita"]),
            "pedidos": safe_int(row["pedidos"])
        }
        for _, row in tipo_pedido_df.iterrows()
    ]

    # =========================
    # Campanhas
    # =========================
    campanha_base_df = (
        campaign_orders_filtrado
        .groupby("campaignid", as_index=False)
        .agg(
            receita=("totalamount", "sum"),
            pedidos=("order_id", "nunique"),
            mensagens=("message_id", "nunique"),
            clientes=("customerid", "nunique")
        )
    )

    campanha_base_df["conversao"] = np.where(
        campanha_base_df["mensagens"] > 0,
        campanha_base_df["pedidos"] / campanha_base_df["mensagens"] * 100,
        0
    )

    campanha_base_df["conversao"] = campanha_base_df["conversao"].clip(upper=100)

    campanhas_df = campanha_base_df.sort_values("receita", ascending=False).head(10)

    performance_campanhas = [
        {
            "campanha": row["campaignid"],
            "receita": money(row["receita"]),
            "pedidos": safe_int(row["pedidos"]),
            "mensagens": safe_int(row["mensagens"]),
            "clientes": safe_int(row["clientes"]),
            "conversao": percent(row["conversao"])
        }
        for _, row in campanhas_df.iterrows()
    ]

    campanhas_baixa_conversao_df = campanha_base_df[
        campanha_base_df["mensagens"] >= 50
    ].sort_values("conversao", ascending=True).head(10)

    campanhas_baixa_conversao = [
        {
            "campanha": row["campaignid"],
            "mensagens": safe_int(row["mensagens"]),
            "pedidos": safe_int(row["pedidos"]),
            "conversao": percent(row["conversao"]),
            "receita": money(row["receita"])
        }
        for _, row in campanhas_baixa_conversao_df.iterrows()
    ]

    receita_campanhas = campanha_base_df["receita"].sum()
    pedidos_campanhas = campanha_base_df["pedidos"].sum()
    mensagens_campanhas = campanha_base_df["mensagens"].sum()

    conversao_media_campanhas = (
        pedidos_campanhas / mensagens_campanhas * 100
        if mensagens_campanhas > 0
        else 0
    )

    # =========================
    # Templates
    # =========================
    campaigns_filtrado_templates = campaigns.copy()

    if args.empresa != "todas":
        campaigns_filtrado_templates = campaigns_filtrado_templates[
            campaigns_filtrado_templates["storeid"] == args.empresa
        ].copy()

    templates_uso_df = (
        campaigns_filtrado_templates
        .groupby("templateid", as_index=False)
        .agg(
            usos=("templateid", "count")
        )
    )

    templates_uso_df = templates_uso_df.merge(
        templates[["id", "name"]],
        left_on="templateid",
        right_on="id",
        how="left"
    )

    templates_uso_df = templates_uso_df.sort_values("usos", ascending=False).head(10)

    templates_mais_usados = [
        {
            "template": row["name"] if pd.notna(row["name"]) else row["templateid"],
            "usos": safe_int(row["usos"])
        }
        for _, row in templates_uso_df.iterrows()
    ]

    # =========================
    # Indicadores obrigatórios por empresa
    # =========================
    campanha_empresa_df = campaign_orders_filtrado.copy()

    campanha_empresa_df = campanha_empresa_df.merge(
        stores[["id", "name"]],
        left_on="storeid",
        right_on="id",
        how="left",
        suffixes=("", "_store")
    )

    mensagens_por_empresa_df = (
        campanha_empresa_df
        .groupby(["storeid", "name"], as_index=False)
        .agg(
            mensagens=("message_id", "nunique"),
            pedidosConvertidos=("order_id", "nunique"),
            receitaCampanhas=("totalamount", "sum"),
            campanhas=("campaignid", "nunique")
        )
    )

    faturamento_empresa_df = (
        orders_with_store
        .groupby(["storeid", "name"], as_index=False)
        .agg(
            faturamentoTotal=("totalamount", "sum"),
            pedidosTotais=("id", "nunique")
        )
    )

    indicadores_empresa_df = faturamento_empresa_df.merge(
        mensagens_por_empresa_df,
        on=["storeid", "name"],
        how="left"
    )

    indicadores_empresa_df["mensagens"] = indicadores_empresa_df["mensagens"].fillna(0)
    indicadores_empresa_df["pedidosConvertidos"] = indicadores_empresa_df["pedidosConvertidos"].fillna(0)
    indicadores_empresa_df["receitaCampanhas"] = indicadores_empresa_df["receitaCampanhas"].fillna(0)
    indicadores_empresa_df["campanhas"] = indicadores_empresa_df["campanhas"].fillna(0)

    indicadores_empresa_df["taxaConversaoNumero"] = np.where(
        indicadores_empresa_df["mensagens"] > 0,
        indicadores_empresa_df["pedidosConvertidos"] / indicadores_empresa_df["mensagens"] * 100,
        0
    )

    indicadores_empresa_df["taxaConversaoValor"] = np.where(
        indicadores_empresa_df["faturamentoTotal"] > 0,
        indicadores_empresa_df["receitaCampanhas"] / indicadores_empresa_df["faturamentoTotal"] * 100,
        0
    )

    indicadores_empresa_df["ticketMedio"] = np.where(
        indicadores_empresa_df["pedidosTotais"] > 0,
        indicadores_empresa_df["faturamentoTotal"] / indicadores_empresa_df["pedidosTotais"],
        0
    )

    indicadores_empresa_df = indicadores_empresa_df.sort_values(
        "faturamentoTotal",
        ascending=False
    )

    indicadores_obrigatorios = [
        {
            "storeid": row["storeid"],
            "empresa": row["name"] if pd.notna(row["name"]) else "Empresa sem nome",
            "faturamentoTotal": money(row["faturamentoTotal"]),
            "pedidosTotais": safe_int(row["pedidosTotais"]),
            "ticketMedio": money(row["ticketMedio"]),
            "mensagens": safe_int(row["mensagens"]),
            "campanhas": safe_int(row["campanhas"]),
            "pedidosConvertidos": safe_int(row["pedidosConvertidos"]),
            "receitaCampanhas": money(row["receitaCampanhas"]),
            "taxaConversaoNumero": percent(row["taxaConversaoNumero"]),
            "taxaConversaoValor": percent(row["taxaConversaoValor"])
        }
        for _, row in indicadores_empresa_df.iterrows()
    ]

    mensagens_por_campanha_empresa_df = (
        campanha_empresa_df
        .groupby(["storeid", "name", "campaignid"], as_index=False)
        .agg(
            mensagens=("message_id", "nunique"),
            pedidosConvertidos=("order_id", "nunique"),
            receita=("totalamount", "sum"),
            clientes=("customerid", "nunique")
        )
    )

    mensagens_por_campanha_empresa_df["taxaConversao"] = np.where(
        mensagens_por_campanha_empresa_df["mensagens"] > 0,
        mensagens_por_campanha_empresa_df["pedidosConvertidos"] /
        mensagens_por_campanha_empresa_df["mensagens"] * 100,
        0
    )

    mensagens_por_campanha_empresa = [
        {
            "storeid": row["storeid"],
            "empresa": row["name"] if pd.notna(row["name"]) else "Empresa sem nome",
            "campanha": row["campaignid"],
            "mensagens": safe_int(row["mensagens"]),
            "pedidosConvertidos": safe_int(row["pedidosConvertidos"]),
            "clientes": safe_int(row["clientes"]),
            "receita": money(row["receita"]),
            "taxaConversao": percent(row["taxaConversao"])
        }
        for _, row in mensagens_por_campanha_empresa_df
        .sort_values("receita", ascending=False)
        .head(30)
        .iterrows()
    ]

    # =========================
    # Clientes por estado
    # =========================
    clientes_filtrados_ids = pedidos_validos["customerid"].dropna().unique().tolist()

    estados_df = customer_address[
        customer_address["customerid"].isin(clientes_filtrados_ids)
    ].copy()

    estados_df["state"] = estados_df["state"].astype(str).str.upper()

    clientes_por_estado_df = (
        estados_df[estados_df["state"].notna()]
        .groupby("state", as_index=False)["customerid"]
        .nunique()
        .rename(columns={"customerid": "clientes"})
        .sort_values("clientes", ascending=False)
        .head(10)
    )

    clientes_por_estado = [
        {
            "estado": row["state"],
            "clientes": safe_int(row["clientes"])
        }
        for _, row in clientes_por_estado_df.iterrows()
    ]

    segmentacao_clientes = {
        "ativos": safe_int(clientes_ativos),
        "inativos": safe_int(clientes_inativos),
        "recorrentes": safe_int(clientes_recorrentes),
        "ocasionais": safe_int(clientes_ocasionais),
        "semPedido": safe_int(clientes_sem_pedido),
        "comPedido": safe_int(clientes_com_pedido),
        "taxaRecorrencia": percent(taxa_recorrencia)
    }

    # =========================
    # Alertas estratégicos
    # =========================
    alertas = []

    for _, row in pior_recorrencia_df.head(5).iterrows():
        alertas.append({
            "tipo": "recorrencia_baixa",
            "prioridade": "alta",
            "empresa": row["name"] if pd.notna(row["name"]) else "Empresa sem nome",
            "mensagem": f"Recorrência de {percent(row['recorrencia'])}% abaixo do esperado.",
            "acaoSugerida": "Avaliar campanhas de reativação e recorrência para esta empresa."
        })

    for _, row in pior_ticket_df.head(3).iterrows():
        alertas.append({
            "tipo": "ticket_baixo",
            "prioridade": "media",
            "empresa": row["name"] if pd.notna(row["name"]) else "Empresa sem nome",
            "mensagem": f"Ticket médio de R$ {money(row['ticketMedio'])} está entre os menores da base.",
            "acaoSugerida": "Avaliar estratégia de combos, upsell e ticket mínimo."
        })

    if crescimento_receita < 0:
        alertas.append({
            "tipo": "queda_receita",
            "prioridade": "alta",
            "empresa": "Visão filtrada",
            "mensagem": f"Receita caiu {abs(crescimento_receita)}% em relação ao mês anterior dentro da visão filtrada.",
            "acaoSugerida": "Verificar empresas, canais e períodos com maior impacto na queda."
        })

    if crescimento_pedidos < 0:
        alertas.append({
            "tipo": "queda_pedidos",
            "prioridade": "alta",
            "empresa": "Visão filtrada",
            "mensagem": f"Pedidos caíram {abs(crescimento_pedidos)}% em relação ao mês anterior dentro da visão filtrada.",
            "acaoSugerida": "Analisar queda por canal, empresa e tipo de pedido."
        })

    # =========================
    # Blocos por área da lateral
    # =========================
    empresas_area = {
        "total": safe_int(total_empresas),
        "rankingReceita": ranking_empresas,
        "melhoresDesempenhos": ranking_empresas[:5],
        "empresasRisco": empresas_risco
    }

    campanhas_area = {
        "totalCampanhas": safe_int(total_campanhas),
        "totalTemplates": safe_int(templates.shape[0]),
        "receitaCampanhas": money(receita_campanhas),
        "pedidosGerados": safe_int(pedidos_campanhas),
        "mensagens": safe_int(mensagens_campanhas),
        "conversaoMedia": percent(conversao_media_campanhas),
        "melhoresCampanhas": performance_campanhas,
        "campanhasBaixaConversao": campanhas_baixa_conversao,
        "templatesMaisUsados": templates_mais_usados
    }

    clientes_analitico = gerar_clientes_analitico(
        pedidos_validos=pedidos_validos,
        customers=customers,
        data_maxima=data_maxima
    )

    clientes_area = {
        "segmentacao": segmentacao_clientes,
        "clientesNovosPorMes": clientes_novos_por_mes,
        "clientesPorEstado": clientes_por_estado,
        "rfm": clientes_analitico["rfm"],
        "coortes": clientes_analitico["coortes"]
    }

    # =========================
    # Painel financeiro simulado
    # =========================
    receita_bruta = receita_total
    receita_liquida = max(receita_bruta - descontos_total, 0)

    percentual_custo_variavel = 0.38
    percentual_reserva_caixa = 0.18

    custos_variaveis = receita_liquida * percentual_custo_variavel
    margem_bruta = receita_liquida - custos_variaveis

    margem_percentual = (
        margem_bruta / receita_liquida * 100
        if receita_liquida > 0
        else 0
    )

    caixa_estimado = margem_bruta * percentual_reserva_caixa

    resultado_por_mes = []

    for _, row in mensal_12_df.iterrows():
        receita_mes = row["totalamount"]
        pedidos_mes = row["pedidos"]
        ticket_mes = row["ticketMedio"]

        descontos_mes = pedidos_validos[
            pedidos_validos["periodo"] == row["periodo"]
        ]["discountamount"].sum()

        receita_liquida_mes = max(receita_mes - descontos_mes, 0)
        custos_mes = receita_liquida_mes * percentual_custo_variavel
        margem_mes = receita_liquida_mes - custos_mes

        margem_percentual_mes = (
            margem_mes / receita_liquida_mes * 100
            if receita_liquida_mes > 0
            else 0
        )

        resultado_por_mes.append({
            "periodo": row["periodo"],
            "receitaBruta": money(receita_mes),
            "descontos": money(descontos_mes),
            "receitaLiquida": money(receita_liquida_mes),
            "custosVariaveis": money(custos_mes),
            "margemBruta": money(margem_mes),
            "margemPercentual": percent(margem_percentual_mes),
            "pedidos": safe_int(pedidos_mes),
            "ticketMedio": money(ticket_mes)
        })

    resultado_por_canal = []

    for _, row in canais_df.iterrows():
        receita_canal = row["receita"]
        pedidos_canal = row["pedidos"]

        descontos_canal = pedidos_validos[
            pedidos_validos["saleschannel"].astype(str) == str(row["saleschannel"])
        ]["discountamount"].sum()

        receita_liquida_canal = max(receita_canal - descontos_canal, 0)
        custos_canal = receita_liquida_canal * percentual_custo_variavel
        margem_canal = receita_liquida_canal - custos_canal

        margem_percentual_canal = (
            margem_canal / receita_liquida_canal * 100
            if receita_liquida_canal > 0
            else 0
        )

        resultado_por_canal.append({
            "canal": str(row["saleschannel"]),
            "receitaBruta": money(receita_canal),
            "descontos": money(descontos_canal),
            "receitaLiquida": money(receita_liquida_canal),
            "custosVariaveis": money(custos_canal),
            "margemBruta": money(margem_canal),
            "margemPercentual": percent(margem_percentual_canal),
            "pedidos": safe_int(pedidos_canal),
            "ticketMedio": money(row["ticketMedio"])
        })

    resultado_por_tipo_pedido = []

    for _, row in tipo_pedido_df.iterrows():
        receita_tipo = row["receita"]
        pedidos_tipo = row["pedidos"]

        descontos_tipo = pedidos_validos[
            pedidos_validos["ordertype"].astype(str) == str(row["ordertype"])
        ]["discountamount"].sum()

        receita_liquida_tipo = max(receita_tipo - descontos_tipo, 0)
        custos_tipo = receita_liquida_tipo * percentual_custo_variavel
        margem_tipo = receita_liquida_tipo - custos_tipo

        margem_percentual_tipo = (
            margem_tipo / receita_liquida_tipo * 100
            if receita_liquida_tipo > 0
            else 0
        )

        resultado_por_tipo_pedido.append({
            "tipo": str(row["ordertype"]),
            "receitaBruta": money(receita_tipo),
            "descontos": money(descontos_tipo),
            "receitaLiquida": money(receita_liquida_tipo),
            "custosVariaveis": money(custos_tipo),
            "margemBruta": money(margem_tipo),
            "margemPercentual": percent(margem_percentual_tipo),
            "pedidos": safe_int(pedidos_tipo)
        })

    alertas_financeiros = []

    if crescimento_receita <= -15:
        alertas_financeiros.append({
            "tipo": "queda_receita",
            "prioridade": "alta",
            "mensagem": f"Receita caiu {abs(percent(crescimento_receita))}% em relação ao período anterior.",
            "acaoSugerida": "Avaliar canais, empresas e campanhas com maior impacto negativo."
        })

    if taxa_desconto_media >= 15:
        alertas_financeiros.append({
            "tipo": "desconto_alto",
            "prioridade": "media",
            "mensagem": f"Taxa média de desconto em {percent(taxa_desconto_media)}%, acima do recomendado.",
            "acaoSugerida": "Revisar política de cupons e descontos por campanha."
        })

    if margem_percentual < 40:
        alertas_financeiros.append({
            "tipo": "margem_baixa",
            "prioridade": "alta",
            "mensagem": f"Margem percentual simulada de {percent(margem_percentual)}%.",
            "acaoSugerida": "Revisar custos variáveis, descontos e mix de canais."
        })

    financeiro_area = {
        "receitaTotal": money(receita_total),
        "receitaBruta": money(receita_bruta),
        "receitaLiquida": money(receita_liquida),
        "custosVariaveis": money(custos_variaveis),
        "margemBruta": money(margem_bruta),
        "margemPercentual": percent(margem_percentual),
        "caixaEstimado": money(caixa_estimado),
        "ticketMedio": money(ticket_medio),
        "descontosTotal": money(descontos_total),
        "taxaDescontoMedia": percent(taxa_desconto_media),
        "percentualCustoVariavel": percent(percentual_custo_variavel * 100),
        "percentualReservaCaixa": percent(percentual_reserva_caixa * 100),
        "receitaPorMes": receita_por_mes,
        "ticketMedioPorMes": ticket_medio_por_mes,
        "performanceCanais": performance_canais,
        "pedidosPorTipo": pedidos_por_tipo,
        "resultadoPorMes": resultado_por_mes,
        "resultadoPorCanal": resultado_por_canal,
        "resultadoPorTipoPedido": resultado_por_tipo_pedido,
        "alertasFinanceiros": alertas_financeiros
    }

    recomendacoes_area = gerar_recomendacoes(
        ranking_df=ranking_df,
        pior_recorrencia_df=pior_recorrencia_df,
        pior_ticket_df=pior_ticket_df,
        campanha_base_df=campanha_base_df,
        mensagens_por_campanha_empresa_df=mensagens_por_campanha_empresa_df
    )

    dashboard = {
        "atualizadoEm": datetime.now().isoformat(),
        "perfil": "admin",
        "filtrosAplicados": {
            "periodo": args.periodo,
            "empresa": args.empresa,
            "canal": args.canal,
            "tipoPedido": args.tipoPedido
        },
        "filtros": filtros,
        "kpis": {
            "receitaTotal": money(receita_total),
            "totalPedidos": safe_int(total_pedidos),
            "ticketMedio": money(ticket_medio),
            "totalEmpresas": safe_int(total_empresas),
            "totalClientes": safe_int(total_clientes),
            "clientesAtivos": safe_int(clientes_ativos),
            "clientesInativos": safe_int(clientes_inativos),
            "clientesRecorrentes": safe_int(clientes_recorrentes),
            "clientesOcasionais": safe_int(clientes_ocasionais),
            "clientesSemPedido": safe_int(clientes_sem_pedido),
            "taxaRecorrencia": percent(taxa_recorrencia),
            "descontosTotal": money(descontos_total),
            "taxaDescontoMedia": percent(taxa_desconto_media),
            "crescimentoReceita": percent(crescimento_receita),
            "crescimentoPedidos": percent(crescimento_pedidos),
            "totalCampanhas": safe_int(total_campanhas),
            "receitaCampanhas": money(receita_campanhas)
        },
        "crescimento": {
            "receita": percent(crescimento_receita),
            "pedidos": percent(crescimento_pedidos),
            "statusReceita": status_por_variacao(crescimento_receita),
            "statusPedidos": status_por_variacao(crescimento_pedidos)
        },
        "segmentacaoClientes": segmentacao_clientes,
        "graficos": {
            "receitaPorMes": receita_por_mes,
            "pedidosPorMes": pedidos_por_mes,
            "ticketMedioPorMes": ticket_medio_por_mes,
            "clientesNovosPorMes": clientes_novos_por_mes,
            "performanceCanais": performance_canais,
            "pedidosPorTipo": pedidos_por_tipo,
            "topEmpresasReceita": top_empresas_receita,
            "topEmpresasPedidos": top_empresas_pedidos,
            "clientesPorEstado": clientes_por_estado
        },
        "rankingEmpresas": ranking_empresas,
        "indicadoresObrigatorios": {
            "porEmpresa": indicadores_obrigatorios,
            "mensagensPorCampanhaEmpresa": mensagens_por_campanha_empresa
        },
        "empresasRisco": empresas_risco,
        "performanceCampanhas": performance_campanhas,
        "campanhas": campanhas_area,
        "clientes": clientes_area,
        "financeiro": financeiro_area,
        "empresas": empresas_area,
        "recomendacoes": recomendacoes_area,
        "alertas": alertas[:10]
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as arquivo:
        json.dump(dashboard, arquivo, ensure_ascii=False, indent=2)

    print("Dashboard admin gerado com sucesso:")
    print(OUTPUT_FILE)


