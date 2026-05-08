const mockTempoRealService = require('../services/mockTempoReal.service');

function usuarioPodeUsarMock(req) {
  return req.user && ['admin', 'colaborador'].includes(req.user.role);
}

async function gerarPedidosMock(req, res) {
  try {
    if (!usuarioPodeUsarMock(req)) {
      return res.status(403).json({
        message: 'Acesso não autorizado para simulação em tempo real.'
      });
    }

    const quantidade = Number(req.body.quantidade || 2);

    const resultado = await mockTempoRealService.gerarPedidosMock({
      quantidade,
      usuarioId: req.user.id
    });

    return res.json({
      message: 'Pedidos simulados gerados com sucesso.',
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao gerar pedidos mock:', error);

    return res.status(500).json({
      message: 'Erro ao gerar pedidos simulados.',
      detail: error.message
    });
  }
}

module.exports = {
  gerarPedidosMock
};