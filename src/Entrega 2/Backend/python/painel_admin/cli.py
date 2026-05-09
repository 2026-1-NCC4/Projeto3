import argparse


def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--periodo", default="todos")
    parser.add_argument("--empresa", default="todas")
    parser.add_argument("--canal", default="todos")
    parser.add_argument("--tipoPedido", default="todos")

    return parser.parse_args()
