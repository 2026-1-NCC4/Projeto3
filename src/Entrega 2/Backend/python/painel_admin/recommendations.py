import pandas as pd
import numpy as np

from .utils import money, percent, safe_int


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




