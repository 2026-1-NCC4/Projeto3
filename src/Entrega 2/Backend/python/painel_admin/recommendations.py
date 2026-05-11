import pandas as pd
import numpy as np

from .utils import money, percent, safe_int


def normalizar_percentual(valor):
    if pd.isna(valor):
        return 0

    valor = float(valor)

    # se vier 0.29 => 29%
    if valor <= 1:
        return valor * 100

    # se já vier 29
    return valor


def intervalo_confianca_proporcao(sucessos, total, z=1.96):
    if total is None or total == 0 or pd.isna(total):
        return {
            "inferior": 0,
            "superior": 0
        }

    p = sucessos / total

    # Wilson interval
    denominator = 1 + (z**2 / total)

    center = (
        p + (z**2 / (2 * total))
    ) / denominator

    margin = (
        z * np.sqrt(
            (p * (1 - p) / total) +
            (z**2 / (4 * total**2))
        )
    ) / denominator

    inferior = max(0, (center - margin) * 100)
    superior = min(100, (center + margin) * 100)

    return {
        "inferior": round(inferior, 2),
        "superior": round(superior, 2)
    }


def calcular_roi_simulado(receita, mensagens, custo_por_mensagem=0.12):
    custo_estimado = max(
        mensagens * custo_por_mensagem,
        50
    )

    if custo_estimado <= 0:
        return 0

    roi = ((receita - custo_estimado) / custo_estimado) * 100

    # teto máximo mais realista
    roi = min(roi, 300)

    return round(roi, 2)


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
    # Recorrência
    # =========================
    for _, row in pior_recorrencia_df.head(6).iterrows():
        empresa = row["name"] if pd.notna(row["name"]) else "Empresa sem nome"

        recorrencia = normalizar_percentual(
            row["recorrencia"]
        )

        ticket_medio = money(
            row["ticketMedio"]
        )

        receita_potencial = money(
            row["receita"] * 0.08
        )

        sugestoes.append({
            "empresa": empresa,
            "tipo": "reativacao",
            "prioridade": "alta",
            "campanhaRecomendada": "Campanha de reativação de clientes",
            "justificativa": (
                f"A empresa apresenta recorrência de {percent(recorrencia)}%, abaixo do esperado."
            ),
            "acaoSugerida": "Enviar campanha com cupom de retorno para clientes sem compra recente.",
            "metricaBase": "Recorrência",
            "valorMetrica": percent(recorrencia),
            "receitaPotencial": receita_potencial,
            "roiSimulado": 180,
            "intervaloConfianca95": {
                "inferior": max(recorrencia - 4, 0),
                "superior": recorrencia + 4
            }
        })

    # =========================
    # Ticket baixo
    # =========================
    for _, row in pior_ticket_df.head(6).iterrows():
        empresa = row["name"] if pd.notna(row["name"]) else "Empresa sem nome"

        ticket_medio = money(
            row["ticketMedio"]
        )

        receita_potencial = money(
            row["receita"] * 0.06
        )

        sugestoes.append({
            "empresa": empresa,
            "tipo": "upsell",
            "prioridade": "media",
            "campanhaRecomendada": "Campanha de combo, upsell ou pedido mínimo",
            "justificativa": (
                f"A empresa possui ticket médio de R$ {ticket_medio}."
            ),
            "acaoSugerida": "Criar oferta de combo ou venda adicional.",
            "metricaBase": "Ticket médio",
            "valorMetrica": ticket_medio,
            "receitaPotencial": receita_potencial,
            "roiSimulado": 140,
            "intervaloConfianca95": {
                "inferior": 8,
                "superior": 16
            }
        })

    # =========================
    # Baixa conversão
    # =========================

    campanha_base_df = campanha_base_df.copy()

    campanha_base_df["conversao_normalizada"] = (
        campanha_base_df["conversao"]
        .apply(normalizar_percentual)
    )

    campanhas_baixa = campanha_base_df[
        (campanha_base_df["mensagens"] >= 50) &
        (campanha_base_df["conversao_normalizada"] <= 15)
    ].sort_values(
        "conversao_normalizada"
    ).head(6)

    for _, row in campanhas_baixa.iterrows():

        conversao = row["conversao_normalizada"]

        ic = intervalo_confianca_proporcao(
            row["pedidos"],
            row["mensagens"]
        )

        sugestoes.append({
            "empresa": "Visão global",
            "tipo": "baixa_conversao",
            "prioridade": "alta",
            "campanhaRecomendada": "Revisão de campanha com baixa conversão",
            "campanhaReferencia": row["campaignid"],
            "justificativa": (
                f"A campanha {row['campaignid']} teve conversão de {percent(conversao)}%."
            ),
            "acaoSugerida": "Revisar público, oferta, copy e horário.",
            "metricaBase": "Conversão",
            "valorMetrica": percent(conversao),
            "receitaPotencial": money(row["receita"] * 0.10),
            "roiSimulado": calcular_roi_simulado(
                row["receita"],
                row["mensagens"]
            ),
            "intervaloConfianca95": ic
        })

    # =========================
    # Alta performance
    # =========================
    campanhas_boas = campanha_base_df[
        campanha_base_df["mensagens"] >= 50
    ].sort_values(
        ["conversao_normalizada", "receita"],
        ascending=False
    ).head(6)

    for _, row in campanhas_boas.iterrows():

        conversao = row["conversao_normalizada"]

        ic = intervalo_confianca_proporcao(
            row["pedidos"],
            row["mensagens"]
        )

        sugestoes.append({
            "empresa": "Visão global",
            "tipo": "replicar_campanha",
            "prioridade": "media",
            "campanhaRecomendada": "Replicar campanha de alta conversão",
            "campanhaReferencia": row["campaignid"],
            "justificativa": (
                f"A campanha {row['campaignid']} apresentou conversão de {percent(conversao)}%."
            ),
            "acaoSugerida": "Replicar em empresas similares.",
            "metricaBase": "Conversão",
            "valorMetrica": percent(conversao),
            "receitaPotencial": money(row["receita"] * 0.15),
            "roiSimulado": calcular_roi_simulado(
                row["receita"],
                row["mensagens"]
            ),
            "intervaloConfianca95": ic
        })

    # =========================
    # Teste A/B
    # =========================
    campanhas_ab = campanha_base_df[
        campanha_base_df["mensagens"] >= 50
    ].sort_values(
        "mensagens",
        ascending=False
    ).head(2)

    if len(campanhas_ab) >= 2:

        campanha_a = campanhas_ab.iloc[0]
        campanha_b = campanhas_ab.iloc[1]

        conversao_a = campanha_a["conversao_normalizada"]
        conversao_b = campanha_b["conversao_normalizada"]

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
            "conversaoA": percent(conversao_a),
            "conversaoB": percent(conversao_b),
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
                f"A campanha {vencedora} apresentou melhor conversão simulada."
            )
        })

    # =========================
    # Resumo
    # =========================
    rois = [
        item["roiSimulado"]
        for item in sugestoes
    ]

    melhor_conversao = 0

    if len(campanha_base_df) > 0:
        melhor_conversao = campanha_base_df[
            "conversao_normalizada"
        ].max()

    return {
        "resumo": {
            "totalRecomendacoes": safe_int(
                len(sugestoes)
            ),
            "altaPrioridade": safe_int(
                len([
                    x for x in sugestoes
                    if x["prioridade"] == "alta"
                ])
            ),
            "roiMedioSimulado": round(
                np.mean(rois), 2
            ) if rois else 0,
            "melhorConversao": percent(
                melhor_conversao
            ),
            "totalTestesAB": safe_int(
                len(testes_ab)
            ),
            "totalInsights": safe_int(
                len(insights)
            )
        },
        "sugestoesCampanha": sugestoes[:20],
        "testeAB": testes_ab,
        "insights": insights
    }
