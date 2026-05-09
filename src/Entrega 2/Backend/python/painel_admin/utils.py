import pandas as pd
import numpy as np


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
