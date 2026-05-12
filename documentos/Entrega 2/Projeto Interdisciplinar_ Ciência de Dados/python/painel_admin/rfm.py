import pandas as pd
import numpy as np

from .utils import money, percent, safe_int


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

