import os
import json
import argparse
import pandas as pd
import numpy as np
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "admin_dashboard.json")

STORE_FILE = os.path.join(DATA_DIR, "STORE.csv")
ORDER_FILE = os.path.join(DATA_DIR, "STOREORDER.csv")
CUSTOMER_FILE = os.path.join(DATA_DIR, "CUSTOMER.CSV")
CUSTOMER_ADDRESS_FILE = os.path.join(DATA_DIR, "CUSTOMERADDRESS.CSV")
CAMPAIGN_FILE = os.path.join(DATA_DIR, "CAMPAIGN.CSV")
CAMPAIGN_ORDER_FILE = os.path.join(DATA_DIR, "CAMPAIGNxORDER.CSV")
TEMPLATE_FILE = os.path.join(DATA_DIR, "TEMPLATE.csv")


def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--periodo", default="todos")
    parser.add_argument("--empresa", default="todas")
    parser.add_argument("--canal", default="todos")
    parser.add_argument("--tipoPedido", default="todos")

    return parser.parse_args()


def read_csv(file_path):
    return pd.read_csv(file_path, encoding="utf-8")


def parse_datetime(series):
    datas = pd.to_datetime(series, errors="coerce", utc=True)
    return datas.dt.tz_convert(None)


def money(value):
    if pd.isna(value):
        return 0
    return round(float(value), 2)


def percent(value):
    if pd.isna(value) or np.isinf(value):
        return 0
    return round(float(value), 2)


def safe_int(value):
    if pd.isna(value):
        return 0
    return int(value)


def calcular_crescimento(valor_atual, valor_anterior):
    if valor_anterior is None or valor_anterior == 0 or pd.isna(valor_anterior):
        return 0

    return percent(((valor_atual - valor_anterior) / valor_anterior) * 100)


def status_por_variacao(variacao):
    if variacao <= -15:
        return "risco"
    if variacao < 0:
        return "atencao"
    return "saudavel"




def intervalo_confianca_proporcao(sucessos, total, z=1.96):
    if total is None or total == 0 or pd.isna(total):
        return {
            "inferior": 0,
            "superior": 0
        }

    p = sucessos / total
    erro = z * np.sqrt((p * (1 - p)) / total)

    inferior = max((p - erro) * 100, 0)
    superior = min((p + erro) * 100, 100)

    return {
        "inferior": percent(inferior),
        "superior": percent(superior)
    }


def calcular_roi_simulado(receita, mensagens, custo_por_mensagem=0.12):
    custo_estimado = mensagens * custo_por_mensagem

    if custo_estimado <= 0:
        return 0

    return percent((receita - custo_estimado) / custo_estimado)


def gerar_recomendacoes(
    ranking_df,
    pior_recorrencia_df,
    pior_ticket_df,
    campanha_base_df,
    mensagens_por_campanha_empresa_df
):
    sugestoes = []
    testes_ab = []
    insights = []

    # =========================
    # Recomendações por baixa recorrência
    # =========================
    for _, row in pior_recorrencia_df.head(6).iterrows():
        empresa = row["name"] if pd.notna(row["name"]) else "Empresa sem nome"
        recorrencia = percent(row["recorrencia"])
        ticket_medio = money(row["ticketMedio"])
        receita_potencial = money(row["receita"] * 0.08)

        sugestoes.append({
            "empresa": empresa,
            "tipo": "reativacao",
            "prioridade": "alta",
            "campanhaRecomendada": "Campanha de reativação de clientes",
            "justificativa": (
                f"A empresa apresenta recorrência de {recorrencia}%, abaixo do patamar esperado. "
                f"Como o ticket médio é de R$ {ticket_medio}, existe potencial para recuperar clientes inativos."
            ),
            "acaoSugerida": "Enviar campanha com cupom de retorno para clientes sem compra recente.",
            "metricaBase": "Recorrência",
            "valorMetrica": recorrencia,
            "receitaPotencial": receita_potencial,
            "roiSimulado": percent(180),
            "intervaloConfianca95": {
                "inferior": max(percent(recorrencia - 4), 0),
                "superior": percent(recorrencia + 4)
            }
        })

    # =========================
    # Recomendações por ticket baixo
    # =========================
    for _, row in pior_ticket_df.head(6).iterrows():
        empresa = row["name"] if pd.notna(row["name"]) else "Empresa sem nome"
        ticket_medio = money(row["ticketMedio"])
        receita_potencial = money(row["receita"] * 0.06)

        sugestoes.append({
            "empresa": empresa,
            "tipo": "upsell",
            "prioridade": "media",
            "campanhaRecomendada": "Campanha de combo, upsell ou pedido mínimo",
            "justificativa": (
                f"A empresa possui ticket médio de R$ {ticket_medio}, entre os menores da base. "
                "Campanhas de combo e venda adicional podem aumentar o valor médio por pedido."
            ),
            "acaoSugerida": "Criar oferta de combo, adicional promocional ou benefício acima de um valor mínimo.",
            "metricaBase": "Ticket médio",
            "valorMetrica": ticket_medio,
            "receitaPotencial": receita_potencial,
            "roiSimulado": percent(140),
            "intervaloConfianca95": {
                "inferior": percent(8),
                "superior": percent(16)
            }
        })

    # =========================
    # Recomendações por campanha com baixa conversão
    # =========================
    campanhas_baixa = campanha_base_df[
        campanha_base_df["mensagens"] >= 50
    ].sort_values("conversao", ascending=True).head(6)

    for _, row in campanhas_baixa.iterrows():
        ic = intervalo_confianca_proporcao(
            sucessos=row["pedidos"],
            total=row["mensagens"]
        )

        sugestoes.append({
            "empresa": "Visão global",
            "tipo": "baixa_conversao",
            "prioridade": "alta",
            "campanhaRecomendada": "Revisão de campanha com baixa conversão",
            "campanhaReferencia": row["campaignid"],
            "justificativa": (
                f"A campanha {row['campaignid']} teve conversão de {percent(row['conversao'])}%, "
                "indicando baixa eficiência entre mensagens enviadas e pedidos convertidos."
            ),
            "acaoSugerida": "Revisar público-alvo, oferta, texto da mensagem, horário de envio e incentivo comercial.",
            "metricaBase": "Conversão",
            "valorMetrica": percent(row["conversao"]),
            "receitaPotencial": money(row["receita"] * 0.10),
            "roiSimulado": calcular_roi_simulado(row["receita"], row["mensagens"]),
            "intervaloConfianca95": ic
        })

    # =========================
    # Recomendações por campanha de alta performance
    # =========================
    campanhas_boas = campanha_base_df[
        campanha_base_df["mensagens"] >= 50
    ].sort_values(["conversao", "receita"], ascending=False).head(6)

    for _, row in campanhas_boas.iterrows():
        ic = intervalo_confianca_proporcao(
            sucessos=row["pedidos"],
            total=row["mensagens"]
        )

        sugestoes.append({
            "empresa": "Visão global",
            "tipo": "replicar_campanha",
            "prioridade": "media",
            "campanhaRecomendada": "Replicar campanha de alta conversão",
            "campanhaReferencia": row["campaignid"],
            "justificativa": (
                f"A campanha {row['campaignid']} apresentou conversão de {percent(row['conversao'])}% "
                f"e receita de R$ {money(row['receita'])}, indicando boa performance comercial."
            ),
            "acaoSugerida": "Replicar campanha para empresas com perfil semelhante e baixa recorrência.",
            "metricaBase": "Conversão e receita",
            "valorMetrica": percent(row["conversao"]),
            "receitaPotencial": money(row["receita"] * 0.15),
            "roiSimulado": calcular_roi_simulado(row["receita"], row["mensagens"]),
            "intervaloConfianca95": ic
        })

    # =========================
    # Teste A/B simulado
    # =========================
    campanhas_ab = campanha_base_df[
        campanha_base_df["mensagens"] >= 50
    ].sort_values("mensagens", ascending=False).head(2)

    if len(campanhas_ab) >= 2:
        campanha_a = campanhas_ab.iloc[0]
        campanha_b = campanhas_ab.iloc[1]

        conversao_a = percent(campanha_a["conversao"])
        conversao_b = percent(campanha_b["conversao"])

        vencedora = (
            campanha_a["campaignid"]
            if conversao_a >= conversao_b
            else campanha_b["campaignid"]
        )

        testes_ab.append({
            "empresa": "Visão global",
            "campanhaA": campanha_a["campaignid"],
            "campanhaB": campanha_b["campaignid"],
            "mensagensA": safe_int(campanha_a["mensagens"]),
            "mensagensB": safe_int(campanha_b["mensagens"]),
            "pedidosA": safe_int(campanha_a["pedidos"]),
            "pedidosB": safe_int(campanha_b["pedidos"]),
            "conversaoA": conversao_a,
            "conversaoB": conversao_b,
            "vencedora": vencedora,
            "intervaloConfiancaA95": intervalo_confianca_proporcao(
                campanha_a["pedidos"],
                campanha_a["mensagens"]
            ),
            "intervaloConfiancaB95": intervalo_confianca_proporcao(
                campanha_b["pedidos"],
                campanha_b["mensagens"]
            ),
            "conclusao": (
                f"A campanha {vencedora} apresentou melhor conversão simulada no comparativo A/B."
            )
        })

    # =========================
    # Insights gerais
    # =========================
    if len(ranking_df) > 0:
        empresa_maior_receita = ranking_df.sort_values("receita", ascending=False).iloc[0]

        insights.append({
            "tipo": "maior_faturamento",
            "prioridade": "media",
            "titulo": "Empresa com maior faturamento",
            "mensagem": (
                f"{empresa_maior_receita['name']} lidera em faturamento com "
                f"R$ {money(empresa_maior_receita['receita'])}."
            ),
            "acaoSugerida": "Usar essa empresa como referência para benchmarking comercial."
        })

    if len(campanha_base_df) > 0:
        campanha_melhor = campanha_base_df.sort_values(
            ["conversao", "receita"],
            ascending=False
        ).iloc[0]

        insights.append({
            "tipo": "melhor_campanha",
            "prioridade": "media",
            "titulo": "Campanha com maior eficiência",
            "mensagem": (
                f"A campanha {campanha_melhor['campaignid']} apresentou conversão de "
                f"{percent(campanha_melhor['conversao'])}% e receita de R$ {money(campanha_melhor['receita'])}."
            ),
            "acaoSugerida": "Avaliar replicação dessa campanha em empresas com menor performance."
        })

    total_recomendacoes = len(sugestoes)
    alta_prioridade = len([item for item in sugestoes if item["prioridade"] == "alta"])

    rois = [
        item["roiSimulado"]
        for item in sugestoes
        if item.get("roiSimulado") is not None
    ]

    melhor_conversao = 0

    if len(campanha_base_df) > 0:
        melhor_conversao = campanha_base_df["conversao"].max()

    recomendacoes = {
        "resumo": {
            "totalRecomendacoes": safe_int(total_recomendacoes),
            "altaPrioridade": safe_int(alta_prioridade),
            "roiMedioSimulado": percent(np.mean(rois)) if len(rois) > 0 else 0,
            "melhorConversao": percent(melhor_conversao),
            "totalTestesAB": safe_int(len(testes_ab)),
            "totalInsights": safe_int(len(insights))
        },
        "sugestoesCampanha": sugestoes[:20],
        "testeAB": testes_ab,
        "insights": insights
    }

    return recomendacoes




def score_recencia(dias):
    if dias <= 30:
        return 5
    if dias <= 60:
        return 4
    if dias <= 90:
        return 3
    if dias <= 180:
        return 2
    return 1


def score_frequencia(qtd_pedidos):
    if qtd_pedidos >= 10:
        return 5
    if qtd_pedidos >= 5:
        return 4
    if qtd_pedidos >= 3:
        return 3
    if qtd_pedidos >= 2:
        return 2
    return 1


def classificar_segmento_rfm(row):
    if row["recenciaDias"] <= 30 and row["pedidos"] == 1:
        return "Novos clientes"

    if row["scoreRecencia"] >= 4 and row["scoreFrequencia"] >= 4 and row["scoreMonetario"] >= 4:
        return "Campeões"

    if row["scoreFrequencia"] >= 4 and row["scoreRecencia"] >= 3:
        return "Fiéis"

    if row["scoreRecencia"] >= 4 and row["scoreFrequencia"] <= 3:
        return "Potenciais"

    if row["scoreRecencia"] <= 2 and row["scoreFrequencia"] >= 3:
        return "Em risco"

    if row["scoreRecencia"] <= 2 and row["scoreFrequencia"] <= 2:
        return "Perdidos"

    return "Ocasionais"


def gerar_clientes_analitico(pedidos_validos, customers, data_maxima):
    # =========================
    # RFM simplificado
    # =========================
    if pedidos_validos.empty:
        return {
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
        }

    rfm_df = (
        pedidos_validos
        .groupby("customerid", as_index=False)
        .agg(
            ultimoPedido=("createdat", "max"),
            primeiroPedido=("createdat", "min"),
            pedidos=("id", "nunique"),
            receita=("totalamount", "sum")
        )
    )

    rfm_df["ticketMedio"] = np.where(
        rfm_df["pedidos"] > 0,
        rfm_df["receita"] / rfm_df["pedidos"],
        0
    )

    rfm_df["recenciaDias"] = (data_maxima - rfm_df["ultimoPedido"]).dt.days
    rfm_df["scoreRecencia"] = rfm_df["recenciaDias"].apply(score_recencia)
    rfm_df["scoreFrequencia"] = rfm_df["pedidos"].apply(score_frequencia)

    q20 = rfm_df["receita"].quantile(0.20)
    q40 = rfm_df["receita"].quantile(0.40)
    q60 = rfm_df["receita"].quantile(0.60)
    q80 = rfm_df["receita"].quantile(0.80)

    def score_monetario(valor):
        if valor >= q80:
            return 5
        if valor >= q60:
            return 4
        if valor >= q40:
            return 3
        if valor >= q20:
            return 2
        return 1

    rfm_df["scoreMonetario"] = rfm_df["receita"].apply(score_monetario)
    rfm_df["scoreRFM"] = (
        rfm_df["scoreRecencia"] +
        rfm_df["scoreFrequencia"] +
        rfm_df["scoreMonetario"]
    )

    rfm_df["segmento"] = rfm_df.apply(classificar_segmento_rfm, axis=1)

    segmentos_df = (
        rfm_df
        .groupby("segmento", as_index=False)
        .agg(
            clientes=("customerid", "nunique"),
            receita=("receita", "sum"),
            pedidos=("pedidos", "sum"),
            ticketMedio=("ticketMedio", "mean"),
            recenciaMedia=("recenciaDias", "mean"),
            scoreMedio=("scoreRFM", "mean")
        )
        .sort_values("receita", ascending=False)
    )

    total_clientes_rfm = rfm_df["customerid"].nunique()

    segmentos_rfm = [
        {
            "segmento": row["segmento"],
            "clientes": safe_int(row["clientes"]),
            "participacao": percent(row["clientes"] / total_clientes_rfm * 100) if total_clientes_rfm > 0 else 0,
            "receita": money(row["receita"]),
            "pedidos": safe_int(row["pedidos"]),
            "ticketMedio": money(row["ticketMedio"]),
            "recenciaMediaDias": safe_int(round(row["recenciaMedia"])),
            "scoreMedio": percent(row["scoreMedio"])
        }
        for _, row in segmentos_df.iterrows()
    ]

    contagem_segmentos = rfm_df["segmento"].value_counts().to_dict()

    resumo_rfm = {
        "totalClientesAnalisados": safe_int(total_clientes_rfm),
        "campeoes": safe_int(contagem_segmentos.get("Campeões", 0)),
        "fieis": safe_int(contagem_segmentos.get("Fiéis", 0)),
        "potenciais": safe_int(contagem_segmentos.get("Potenciais", 0)),
        "emRisco": safe_int(contagem_segmentos.get("Em risco", 0)),
        "perdidos": safe_int(contagem_segmentos.get("Perdidos", 0)),
        "novosClientes": safe_int(contagem_segmentos.get("Novos clientes", 0))
    }

    top_clientes = [
        {
            "customerid": row["customerid"],
            "segmento": row["segmento"],
            "receita": money(row["receita"]),
            "pedidos": safe_int(row["pedidos"]),
            "ticketMedio": money(row["ticketMedio"]),
            "recenciaDias": safe_int(row["recenciaDias"]),
            "scoreRecencia": safe_int(row["scoreRecencia"]),
            "scoreFrequencia": safe_int(row["scoreFrequencia"]),
            "scoreMonetario": safe_int(row["scoreMonetario"]),
            "scoreRFM": safe_int(row["scoreRFM"]),
            "ultimoPedido": row["ultimoPedido"].strftime("%Y-%m-%d") if pd.notna(row["ultimoPedido"]) else None
        }
        for _, row in rfm_df.sort_values(["scoreRFM", "receita"], ascending=False).head(30).iterrows()
    ]

    # =========================
    # Coortes de retenção mensal
    # =========================
    coorte_base = pedidos_validos[["customerid", "createdat"]].copy()
    coorte_base["periodoPedido"] = coorte_base["createdat"].dt.to_period("M")

    primeira_compra_df = (
        coorte_base
        .groupby("customerid", as_index=False)["periodoPedido"]
        .min()
        .rename(columns={"periodoPedido": "coorte"})
    )

    coorte_base = coorte_base.merge(
        primeira_compra_df,
        on="customerid",
        how="left"
    )

    coorte_base["mesRelativo"] = (
        (coorte_base["periodoPedido"].dt.year - coorte_base["coorte"].dt.year) * 12 +
        (coorte_base["periodoPedido"].dt.month - coorte_base["coorte"].dt.month)
    )

    coorte_base = coorte_base[
        (coorte_base["mesRelativo"] >= 0) &
        (coorte_base["mesRelativo"] <= 5)
    ].copy()

    coorte_counts_df = (
        coorte_base
        .groupby(["coorte", "mesRelativo"], as_index=False)["customerid"]
        .nunique()
        .rename(columns={"customerid": "clientes"})
    )

    coortes = []

    for coorte, grupo in coorte_counts_df.groupby("coorte"):
        base_mes_zero = grupo.loc[grupo["mesRelativo"] == 0, "clientes"]
        clientes_base = safe_int(base_mes_zero.iloc[0]) if not base_mes_zero.empty else 0

        item = {
            "coorte": str(coorte),
            "clientesBase": clientes_base
        }

        for mes in range(0, 6):
            valor_mes = grupo.loc[grupo["mesRelativo"] == mes, "clientes"]
            clientes_mes = safe_int(valor_mes.iloc[0]) if not valor_mes.empty else 0
            item[f"mes{mes}"] = clientes_mes
            item[f"retencaoMes{mes}"] = percent(clientes_mes / clientes_base * 100) if clientes_base > 0 else 0

        coortes.append(item)

    coortes = sorted(coortes, key=lambda x: x["coorte"], reverse=True)[:12]

    return {
        "rfm": {
            "resumo": resumo_rfm,
            "segmentos": segmentos_rfm,
            "topClientes": top_clientes
        },
        "coortes": coortes
    }

def aplicar_filtros_pedidos(pedidos, args):
    pedidos_filtrados = pedidos.copy()

    if args.periodo != "todos":
        pedidos_filtrados = pedidos_filtrados[
            pedidos_filtrados["createdat"].dt.to_period("M").astype(str) == args.periodo
        ].copy()

    if args.empresa != "todas":
        pedidos_filtrados = pedidos_filtrados[
            pedidos_filtrados["storeid"] == args.empresa
        ].copy()

    if args.canal != "todos":
        pedidos_filtrados = pedidos_filtrados[
            pedidos_filtrados["saleschannel"].astype(str) == args.canal
        ].copy()

    if args.tipoPedido != "todos":
        pedidos_filtrados = pedidos_filtrados[
            pedidos_filtrados["ordertype"].astype(str) == args.tipoPedido
        ].copy()

    return pedidos_filtrados


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


if __name__ == "__main__":
    gerar_dashboard_admin()