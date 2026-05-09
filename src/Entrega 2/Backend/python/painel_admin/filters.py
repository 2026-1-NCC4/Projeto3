
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


