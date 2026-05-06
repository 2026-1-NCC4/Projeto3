import os
import json
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "diagnostico_bases.json")


def ler_csv_com_fallback(caminho_arquivo):
    tentativas = [
        {"sep": ",", "encoding": "utf-8"},
        {"sep": ";", "encoding": "utf-8"},
        {"sep": ",", "encoding": "latin1"},
        {"sep": ";", "encoding": "latin1"},
    ]

    ultimo_erro = None

    for config in tentativas:
        try:
            df = pd.read_csv(caminho_arquivo, **config)

            # Evita falso positivo quando o separador está errado e tudo fica em uma coluna só
            if len(df.columns) > 1:
                return df, config

        except Exception as erro:
            ultimo_erro = erro

    raise Exception(f"Não foi possível ler o CSV. Último erro: {ultimo_erro}")


def diagnosticar_bases():
    resultado = {
        "pasta": DATA_DIR,
        "arquivos": []
    }

    arquivos = [
        arquivo for arquivo in os.listdir(DATA_DIR)
        if arquivo.lower().endswith(".csv")
    ]

    for arquivo in arquivos:
        caminho_arquivo = os.path.join(DATA_DIR, arquivo)

        try:
            df, config_usada = ler_csv_com_fallback(caminho_arquivo)

            resultado["arquivos"].append({
                "arquivo": arquivo,
                "linhas": int(len(df)),
                "colunas": list(df.columns),
                "separador_detectado": config_usada["sep"],
                "encoding_detectado": config_usada["encoding"],
                "amostra": df.head(3).fillna("").to_dict(orient="records")
            })

        except Exception as erro:
            resultado["arquivos"].append({
                "arquivo": arquivo,
                "erro": str(erro)
            })

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print("Diagnóstico gerado com sucesso:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    diagnosticar_bases()